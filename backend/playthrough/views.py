import time
import math
import sys
import logging
import random

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import F, Min, Max
from django.db import IntegrityError

from topics.models import Topic
from .models import Question, DomainRating, GamifiedModifier, UserInventory, PlaythroughSession, LearningResource, ShopItem
from accounts.models import UserStars
from .dda_engine import EquinoxDDAEngine
from users_progress.models import UserProgress
from users_progress.achievements import AchievementRegistry

logger = logging.getLogger(__name__)

# Import adaptive analysis function at module level
try:
    from users_progress.adaptive_analysis import generate_adaptive_analysis
    logger.info("Adaptive analysis module imported successfully")
except Exception as e:
    logger.warning(f"Could not import generate_adaptive_analysis: {e}")
    generate_adaptive_analysis = None

# ---------------------------------------------------------------------------
# Config — pulled from settings with sensible defaults
# ---------------------------------------------------------------------------
_cfg = getattr(settings, 'PLAYTHROUGH_CONFIG', {})
MAX_QUESTIONS_PER_SESSION = _cfg.get('MAX_QUESTIONS_PER_SESSION', 10)


# ---------------------------------------------------------------------------
# Helper: answer normalisation
# ---------------------------------------------------------------------------

def normalize_answer(answer):
    """
    Normalise a raw answer string before comparison.

    Strips leading/trailing whitespace and converts to uppercase so that
    ``"b"``, ``" B "``, and ``"B"`` all compare equal to a stored correct
    answer of ``"B"``.

    Args:
        answer (str | None): The raw answer string from the request or database.
            Non-string types are safely converted to empty string.

    Returns:
        str: The normalised answer string.
    """
    if answer is None or not isinstance(answer, str):
        return ''
    return answer.strip().upper()


# ---------------------------------------------------------------------------
# Helper: scoring calculation
# ---------------------------------------------------------------------------

def calculate_points(is_correct, current_tier, time_taken, current_streak,
                     modifier_type, modifier_multiplier):
    """
    Calculate the gamified points earned for a single answer submission.

    Points are based on a tier-dependent base value, scaled by a time bonus
    (faster answers score higher, capped at 1.5×), a streak multiplier
    (consecutive correct answers, capped at 1.5×), and an optional item
    modifier for ``SCORE_BOOST`` type modifiers.

    Args:
        is_correct (bool): Whether the submitted answer was correct.
        current_tier (str): The player's current difficulty tier
            (``"Novice"``, ``"Intermediate"``, ``"Advanced"``, or ``"Expert"``).
        time_taken (float): Seconds elapsed since the question was served.
        current_streak (int): Number of consecutive correct answers
            *including* this one.
        modifier_type (str | None): The active modifier type, e.g.
            ``"SCORE_BOOST"`` or ``"STREAK_SHIELD"``.
        modifier_multiplier (float): The multiplier value of the active
            modifier (ignored unless ``modifier_type == "SCORE_BOOST"``).

    Returns:
        int: Points earned (0 for incorrect answers).
    """
    if not is_correct:
        return 0

    base = {"Novice": 1000, "Intermediate": 1500, "Advanced": 2000, "Expert": 2500}.get(current_tier, 1000)
    m_time = max(1.0, 1.5 - (time_taken / 60.0))
    m_streak = min(1.5, 1.0 + (0.1 * current_streak))
    m_modifier = modifier_multiplier if modifier_type == 'SCORE_BOOST' else 1.0

    return math.floor(base * m_time * m_streak * m_modifier)


# ---------------------------------------------------------------------------
# Helper: session initialisation
# ---------------------------------------------------------------------------

def _init_session(request, topic):
    """
    Create and persist a new ``PlaythroughSession`` for the given user/topic.

    Resolves the chosen difficulty and equipped modifier from query params or
    POST body, seeds the DDA rating, and returns the newly created session.

    Args:
        request: The DRF ``Request`` object.
        topic (Topic): The topic the session is being started for.

    Returns:
        PlaythroughSession: The freshly created session instance.
    """
    chosen_difficulty = (
        request.query_params.get('difficulty') or
        request.data.get('difficulty') or
        'Intermediate'
    )

    # --- Modifier resolution ---
    equipped_modifier_slug = (
        request.query_params.get('equipped_modifier') or
        request.query_params.get('mods') or
        request.data.get('equipped_modifier')
    )

    # Treat the legacy 'disable_adjuster' alias as the canonical slug
    if equipped_modifier_slug == 'disable_adjuster':
        equipped_modifier_slug = 'dda_adjuster'

    active_modifier_id = None
    modifier_multiplier = 1.0
    modifier_type = None

    if equipped_modifier_slug:
        try:
            inv_item = UserInventory.objects.get(
                user=request.user,
                modifier__slug=equipped_modifier_slug,
                quantity__gt=0
            )
            active_modifier_id = inv_item.modifier.id
            modifier_multiplier = inv_item.modifier.multiplier_value
            modifier_type = inv_item.modifier.modifier_type
            logger.info(
                "Modifier equipped for user=%s slug=%s type=%s",
                request.user.username, equipped_modifier_slug, modifier_type
            )
        except UserInventory.DoesNotExist:
            logger.warning(
                "Modifier slug '%s' not found in inventory for user=%s — ignoring.",
                equipped_modifier_slug, request.user.username
            )
            equipped_modifier_slug = None

    # Seed the DDA rating from the chosen difficulty
    EquinoxDDAEngine.seed_initial_rating(request.user, topic.name, chosen_difficulty)
    logger.debug(
        "DDA seeded: user=%s topic=%s difficulty=%s",
        request.user.username, topic.name, chosen_difficulty
    )

    session = PlaythroughSession.objects.create(
        user=request.user,
        topic=topic,
        active_modifier_id=active_modifier_id,
        modifier_multiplier=modifier_multiplier,
        modifier_type=modifier_type,
        modifier_slug=equipped_modifier_slug,
    )
    return session


# ---------------------------------------------------------------------------
# Helper: get or resume session
# ---------------------------------------------------------------------------

def _get_or_create_session(request, topic):
    """
    Return the active ``PlaythroughSession`` for this user/topic, creating one
    if none exists or if the existing session has expired.

    Uses ``get_or_create`` internally to safely handle concurrent requests that
    could otherwise trigger a UNIQUE constraint violation on
    ``(user_id, topic_id)``.

    Args:
        request: The DRF ``Request`` object.
        topic (Topic): The topic being played.

    Returns:
        tuple[PlaythroughSession, bool]: The session and a boolean indicating
        whether it was newly created (``True``) or resumed (``False``).
    """
    session = PlaythroughSession.objects.filter(user=request.user, topic=topic).first()

    if session:
        if session.is_expired():
            logger.info(
                "Expired session found for user=%s topic=%s — replacing.",
                request.user.username, topic.name
            )
            session.delete()
        else:
            return session, False

    # Create the session — use get_or_create to guard against concurrent
    # duplicate-key races (StrictMode double-mount, rapid navigation, etc.)
    try:
        new_session = _init_session(request, topic)
        return new_session, True
    except IntegrityError:
        # Another request beat us to creating the session; fetch it instead.
        session = PlaythroughSession.objects.get(user=request.user, topic=topic)
        if session.is_expired():
            # Race lost but session is stale — safe to delete and retry once
            session.delete()
            return _init_session(request, topic), True
        return session, False


# ---------------------------------------------------------------------------
# Helper: submit answer
# ---------------------------------------------------------------------------

def submit_answer(request, topic, session, question):
    """
    Process a single answer submission against the active question.

    Updates the session's score, streak, and gamified score in-place and
    persists the changes. Also triggers DDA adjustment unless the active
    modifier locks it.

    Args:
        request: The DRF ``Request`` object (used for user identity and
            ``request.data``).
        topic (Topic): The topic being played (used for DDA domain lookup).
        session (PlaythroughSession): The caller's active session instance.
            Modified in-place and saved.
        question (Question): The question being answered.

    Returns:
        dict: A result dict with keys ``is_correct``, ``points_earned``,
            ``shield_consumed``, and ``one_life_triggered``.
    """
    dda = EquinoxDDAEngine()

    raw_answer = request.data.get('answer', '')
    
    # Input validation: prevent excessively long answers
    if len(raw_answer) > 500:
        raise ValidationError("Answer too long. Maximum length is 500 characters.")
    
    selected_answer = normalize_answer(raw_answer)
    is_correct = (selected_answer == normalize_answer(question.correct_answer))

    start_time = session.question_start_time or time.time()
    time_taken = time.time() - start_time

    current_rating = dda.get_rating(request.user, topic.name)
    current_tier = dda.get_closest_tier(current_rating)

    shield_consumed = False
    points_earned = 0

    if is_correct:
        session.score += 1
        session.current_streak += 1
        points_earned = calculate_points(
            is_correct=True,
            current_tier=current_tier,
            time_taken=time_taken,
            current_streak=session.current_streak,
            modifier_type=session.modifier_type,
            modifier_multiplier=session.modifier_multiplier,
        )
        session.gamified_score += points_earned
        logger.debug(
            "Correct answer: user=%s question=%d points=%d streak=%d",
            request.user.username, question.id, points_earned, session.current_streak
        )
    else:
        if session.modifier_type == 'STREAK_SHIELD':
            # Consume the shield — streak is preserved, modifier is spent
            session.modifier_type = None
            session.modifier_multiplier = 1.0
            shield_consumed = True
            logger.info("STREAK_SHIELD consumed for user=%s", request.user.username)
        else:
            session.current_streak = 0

    # Determine whether DDA adjustment is locked by an active modifier
    incoming_mods = request.data.get('active_mods', [])
    if isinstance(incoming_mods, str):
        incoming_mods = [incoming_mods]

    is_dda_locked = (
        session.modifier_slug in ['dda_adjuster', 'disable_adjuster'] or
        'dda_adjuster' in incoming_mods or
        'disable_adjuster' in incoming_mods or
        request.data.get('equipped_modifier') in ['dda_adjuster', 'disable_adjuster'] or
        request.query_params.get('mods') == 'disable_adjuster'
    )

    if not is_dda_locked:
        dda.adjust_difficulty(
            user=request.user,
            domain=topic.name,
            question_obj=question,
            is_correct=is_correct
        )
    else:
        logger.debug("DDA locked for user=%s by modifier", request.user.username)

    session.questions_served += 1
    session.current_question_id = None
    session.save()

    # Don't evaluate achievements here - only at session end
    # This prevents premature achievement unlocking
    new_badges = []

    # Check one-life game-over condition
    one_life_slugs = ['one_life']
    one_life_active = (
        session.modifier_slug in one_life_slugs or
        any(m in incoming_mods for m in one_life_slugs)
    )
    one_life_triggered = (not is_correct and one_life_active)

    return {
        'is_correct': is_correct,
        'points_earned': points_earned,
        'shield_consumed': shield_consumed,
        'one_life_triggered': one_life_triggered,
        'current_tier': current_tier,
        'new_achievements': new_badges,
    }


# ---------------------------------------------------------------------------
# Helper: serve next question
# ---------------------------------------------------------------------------

def get_next_question(topic, session):
    """
    Select and return the next question to serve for the given session.

    Prefers questions at the player's current DDA tier that have not yet been
    seen this session. Falls back first to any question at the current tier
    (allowing repeats), then to any question in the topic.

    Args:
        topic (Topic): The topic being played.
        session (PlaythroughSession): The active session (used to read
            ``seen_question_ids`` and the current DDA tier).

    Returns:
        Question | None: The selected question, or ``None`` if no questions
        exist for this topic.
    """
    dda = EquinoxDDAEngine()
    current_rating = dda.get_rating(session.user, topic.name)
    current_tier = dda.get_closest_tier(current_rating)
    
    # Map tier names to numeric difficulty values
    tier_to_difficulty = {
        'Novice': 1.0,
        'Intermediate': 2.0,
        'Advanced': 3.0,
        'Expert': 4.0
    }
    current_difficulty = tier_to_difficulty.get(current_tier, 2.0)

    seen_ids = session.seen_question_ids or []

    # Mix question types: 50% word problems, 50% direct math problems
    # This ensures variety in quiz sessions
    use_word_problem = random.choice([True, False])

    def _build_qs(prefer_wp, exclude_seen):
        """Build a queryset with the given parameters, optionally excluding seen IDs."""
        base = Question.objects.filter(
            topic=topic,
            difficulty=current_difficulty,
            is_word_problem=prefer_wp
        )
        return base.exclude(id__in=seen_ids) if exclude_seen else base

    # Try to get a question of the preferred type first (unseen)
    qs = _build_qs(use_word_problem, exclude_seen=True)

    # Fallback 1: allow repeats within the current tier and preferred type
    if not qs.exists():
        qs = _build_qs(use_word_problem, exclude_seen=False)

    # Fallback 2: try the other question type (unseen)
    if not qs.exists():
        qs = _build_qs(not use_word_problem, exclude_seen=True)

    # Fallback 3: allow repeats with other type
    if not qs.exists():
        qs = _build_qs(not use_word_problem, exclude_seen=False)

    # Fallback 4: any question in the topic (last resort)
    if not qs.exists():
        qs = Question.objects.filter(topic=topic)

    if not qs.exists():
        return None

    # Use deterministic ordering in test runs to keep assertions stable
    if 'test' in sys.argv:
        return qs.order_by('id').first()
    
    # Random selection: collect PKs from the filtered queryset and pick one uniformly
    try:
        pk_list = list(qs.values_list('id', flat=True))
        if pk_list:
            return qs.get(id=random.choice(pk_list))
    except Exception:
        pass  # Fallback to first() below if random selection fails

    return qs.order_by('id').first()


# ---------------------------------------------------------------------------
# Helper: end session (save progress + deduct modifier)
# ---------------------------------------------------------------------------

def end_session(session, topic, current_tier, new_badges=None):
    """
    Persist the final ``UserProgress`` record, deduct the used modifier from
    the player's inventory, and delete the session.

    Args:
        session (PlaythroughSession): The session being ended.
        topic (Topic): The topic that was played.
        current_tier (str): The difficulty tier at the time of completion.
        new_badges (list | None): Pre-evaluated achievement list to include in
            the return value. Pass ``None`` to skip achievement evaluation
            (e.g. for one-life game-overs).

    Returns:
        dict: A summary dict suitable for inclusion in the API response, with
        keys ``final_score``, ``final_gamified_score``, and
        ``new_achievements``.
    """
    final_score = session.score
    final_gamified_score = session.gamified_score

    UserProgress.objects.create(
        user=session.user,
        topic=topic,
        score=final_score,
        gamified_score=final_gamified_score,
        total_questions=session.questions_served,
        difficulty=current_tier,
    )
    logger.info(
        "Session complete: user=%s topic=%s score=%d gamified=%d tier=%s",
        session.user.username, topic.name, final_score, final_gamified_score, current_tier
    )

    if session.active_modifier_id:
        UserInventory.objects.filter(
            user=session.user,
            modifier_id=session.active_modifier_id,
            quantity__gt=0
        ).update(quantity=F('quantity') - 1)

    # Award Stars based on gamified score (1 Star per 5000 points)
    stars_earned = final_gamified_score // 5000
    if stars_earned > 0:
        try:
            user_stars, _ = UserStars.objects.get_or_create(user=session.user)
            user_stars.add_stars(stars_earned)
            logger.info(
                "Awarded %d stars to user=%s for gamified_score=%d",
                stars_earned, session.user.username, final_gamified_score
            )
        except Exception as e:
            logger.error(f"Failed to award stars: {e}")

    session_id = session.id
    session.end_session()
    logger.info(f"Session {session_id} deleted from database")
    
    # Verify deletion
    still_exists = PlaythroughSession.objects.filter(id=session_id).exists()
    if still_exists:
        logger.error(f"ERROR: Session {session_id} still exists after deletion!")
    else:
        logger.info(f"Confirmed: Session {session_id} successfully deleted")

    return {
        'final_score': final_score,
        'final_gamified_score': final_gamified_score,
        'new_achievements': new_badges or [],
    }


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def playthrough_api_view(request, topic_id):
    """
    Unified playthrough session endpoint with DDA-driven question serving.

    GET — Serve the next question (or return the session-complete payload once
    ``MAX_QUESTIONS_PER_SESSION`` answers have been submitted).

    POST — Submit an answer to the current question. Returns correctness,
    updated score, and gamification data. If the session is now complete (all
    questions answered, or a one-life game-over), the response includes
    ``session_complete: true`` and final score fields.

    Args:
        request: DRF ``Request``. Relevant fields:
            - GET ``difficulty`` (str): Starting difficulty tier for new sessions.
            - GET/POST ``equipped_modifier`` or ``mods`` (str): Modifier slug.
            - POST ``answer`` (str): The player's answer (``"A"``--``"D"`` for
              MCQ, or the answer text for open-ended questions).
            - POST ``active_mods`` (list[str]): Additional modifier slugs active
              client-side (used for DDA-lock detection).
        topic_id (int): PK of the ``Topic`` being played.

    Returns:
        Response: JSON payload. See inline comments for field descriptions.

    Raises:
        HTTP 404: If the topic does not exist or no questions are seeded.
        HTTP 400: If a POST is submitted without an active question in session.
    """
    logger.debug(
        "playthrough_api_view: user=%s topic_id=%s method=%s",
        request.user.username, topic_id, request.method
    )

    topic = get_object_or_404(Topic, id=topic_id)
    dda = EquinoxDDAEngine()

    session, is_new = _get_or_create_session(request, topic)

    current_rating = dda.get_rating(request.user, topic.name)
    current_tier = dda.get_closest_tier(current_rating)

    # -------------------------------------------------------------------------
    # ACTION A: USER SUBMITTED AN ANSWER (POST)
    # -------------------------------------------------------------------------
    if request.method == 'POST':
        if 'answer' not in request.data:
            # No answer key — treat as a configuration-only POST (legacy support)
            return Response({"status": "configured", "score": session.score}, status=status.HTTP_200_OK)

        if not session.current_question_id:
            return Response(
                {"error": "No active question found in session."},
                status=status.HTTP_400_BAD_REQUEST
            )

        question = get_object_or_404(Question, id=session.current_question_id)

        result = submit_answer(request, topic, session, question)
        session.refresh_from_db()  # Reflect saves made inside submit_answer

        # Re-read tier after DDA may have adjusted the rating
        current_rating = dda.get_rating(request.user, topic.name)
        current_tier = dda.get_closest_tier(current_rating)
        
        # Check if this answer completed the session
        is_session_complete = session.questions_served >= MAX_QUESTIONS_PER_SESSION

        if result['one_life_triggered']:
            new_badges = AchievementRegistry.evaluate_user(request.user)
            summary = end_session(session, topic, current_tier, new_badges=new_badges)
            
            # Get adaptive analysis for the user
            try:
                from users_progress.views import generate_adaptive_analysis
                analysis_data = generate_adaptive_analysis(request.user)
            except Exception as e:
                logger.error(f"Failed to get adaptive analysis: {e}")
                analysis_data = {}
            
            return Response({
                "is_correct": False,
                "correct_answer": question.correct_answer,
                "question_solution": question.question_solution,
                "session_complete": True,
                "status": "completed",
                "is_finished": True,
                "final_score": summary['final_score'],
                "final_gamified_score": summary['final_gamified_score'],
                "questions_served": session.questions_served,
                "points_earned": 0,
                "gamified_score": summary['final_gamified_score'],
                "current_streak": 0,
                "shield_active": False,
                "new_achievements": summary['new_achievements'],
                "adaptive_analysis": analysis_data,
            }, status=status.HTTP_200_OK)

        # Check if session is complete and include completion data in POST response
        if is_session_complete:
            logger.info(f"Session {session.id} complete in POST - evaluating achievements")
            new_badges = AchievementRegistry.evaluate_user(request.user)
            logger.info(f"New badges unlocked: {new_badges}")
            
            # Get adaptive analysis
            logger.info("Attempting to generate adaptive analysis...")
            try:
                from users_progress.adaptive_analysis import generate_adaptive_analysis
                analysis_data = generate_adaptive_analysis(request.user)
                logger.info(f"Adaptive analysis result: {analysis_data}")
            except Exception as e:
                logger.error(f"Failed to get adaptive analysis: {e}", exc_info=True)
                analysis_data = {}
            
            # End the session and save progress
            summary = end_session(session, topic, current_tier, new_badges=new_badges)
            
            return Response({
                "is_correct": result['is_correct'],
                "correct_answer": question.correct_answer,
                "question_solution": question.question_solution,
                "score": session.score,
                "current_score": session.score,
                "questions_served": session.questions_served,
                "points_earned": result['points_earned'],
                "gamified_score": session.gamified_score,
                "current_streak": session.current_streak,
                "shield_active": (session.modifier_type == 'STREAK_SHIELD'),
                "session_complete": True,
                "is_finished": True,
                "final_score": summary['final_score'],
                "final_gamified_score": summary['final_gamified_score'],
                "new_achievements": summary['new_achievements'],
                "adaptive_analysis": analysis_data,
            })
        
        return Response({
            "is_correct": result['is_correct'],
            "correct_answer": question.correct_answer,
            "question_solution": question.question_solution,
            "score": session.score,
            "current_score": session.score,
            "questions_served": session.questions_served,
            "points_earned": result['points_earned'],
            "gamified_score": session.gamified_score,
            "current_streak": session.current_streak,
            "shield_active": (session.modifier_type == 'STREAK_SHIELD'),
            "new_achievements": result.get('new_achievements', []),
        })

    # -------------------------------------------------------------------------
    # ACTION B: EVALUATE END GAME OR SERVE NEXT QUESTION (GET)
    # -------------------------------------------------------------------------
    # Refresh session from database to get latest questions_served count
    session.refresh_from_db()
    logger.debug(f"GET request - session.questions_served={session.questions_served}, MAX={MAX_QUESTIONS_PER_SESSION}")
    
    if session.questions_served >= MAX_QUESTIONS_PER_SESSION:
        logger.info(f"Session {session.id} complete - evaluating achievements")
        new_badges = AchievementRegistry.evaluate_user(request.user)
        logger.info(f"New badges unlocked: {new_badges}")
        summary = end_session(session, topic, current_tier, new_badges=new_badges)
        
        # Get adaptive analysis for the user
        try:
            from users_progress.views import generate_adaptive_analysis
            analysis_data = generate_adaptive_analysis(request.user)
            logger.info(f"Adaptive analysis generated: {len(analysis_data.get('recommendations', []))} recommendations")
        except Exception as e:
            logger.error(f"Failed to get adaptive analysis: {e}")
            analysis_data = {}
        
        response_data = {
            "session_complete": True,
            "final_score": summary['final_score'],
            "final_gamified_score": summary['final_gamified_score'],
            "total_questions": MAX_QUESTIONS_PER_SESSION,
            "new_achievements": summary['new_achievements'],
            "adaptive_analysis": analysis_data,
        }
        logger.info(f"Returning completion response with {len(new_badges)} achievements and {len(analysis_data.get('recommendations', []))} recommendations")
        return Response(response_data)

    # Serve the current question if one is already active, otherwise pick a new one
    if session.current_question_id:
        question = get_object_or_404(Question, id=session.current_question_id)
    else:
        question = get_next_question(topic, session)
        if question is None:
            return Response(
                {"error": f"No questions seeded for topic '{topic.name}' yet."},
                status=status.HTTP_404_NOT_FOUND
            )
        session.current_question_id = question.id
        seen = session.seen_question_ids or []
        seen.append(question.id)
        session.seen_question_ids = seen

    session.question_start_time = time.time()
    session.save()

    is_admin_user = request.user.is_staff

    payload = {
        "session_complete": False,
        "question_id": question.id,
        "topic_name": topic.name,
        "question_number": session.questions_served + 1,
        "questions_served": session.questions_served,  # Preserved structural key for validation tests
        "total_questions": MAX_QUESTIONS_PER_SESSION,
        "score": session.score,
        "current_tier": current_tier,
        "current_rating": current_rating,
        "question_text": question.question_text,
        "question_solution": question.question_solution,
        "choices": {
            "A": question.choice_a,
            "B": question.choice_b,
            "C": question.choice_c,
            "D": question.choice_d,
        } if question.choice_a else None,
        "gamified_score": session.gamified_score,
        "current_streak": session.current_streak,
        "active_modifier_type": session.modifier_type,
        "is_admin": is_admin_user,
    }

    if is_admin_user:
        payload["admin_correct_answer"] = question.correct_answer

    return Response(payload, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quit_playthrough_api_view(request):
    """
    Terminate the player's active session without spending their equipped modifier.

    Deletes the ``PlaythroughSession`` record without recording a
    ``UserProgress`` entry, so the session is abandoned cleanly. The modifier
    item is *not* deducted from inventory.

    Args:
        request: DRF ``Request``. No body fields required.

    Returns:
        Response: ``{"message": "..."}`` with HTTP 200.
    """
    deleted_count, _ = PlaythroughSession.objects.filter(user=request.user).delete()
    logger.info("Quit: user=%s deleted %d session(s)", request.user.username, deleted_count)
    return Response(
        {"message": "Session terminated cleanly. Equipped item was not spent."},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_active_session_api(request):
    """
    Check whether the authenticated player has an abandoned in-progress session.

    Used by the React dashboard to prompt the player to resume or discard a
    previous session before starting a new one.

    Args:
        request: DRF ``Request``.

    Returns:
        Response: ``{"has_active_session": bool, "topic_id": int|null,
        "difficulty": str, "modifiers": list, "equipped_item": str}``
    """
    session = (
        PlaythroughSession.objects
        .filter(user=request.user)
        .select_related('topic')
        .first()
    )

    if session and not session.is_expired():
        # Derive the current difficulty tier from the DDA rating
        dda = EquinoxDDAEngine()
        current_rating = dda.get_rating(session.user, session.topic.name)
        current_tier = dda.get_closest_tier(current_rating)
        
        # Construct modifiers list from the active modifier slug
        modifiers = [session.modifier_slug] if session.modifier_slug else []
        
        return Response({
            "has_active_session": True,
            "topic_id": session.topic.id,
            "difficulty": current_tier,
            "modifiers": modifiers,
            "equipped_item": session.modifier_slug or '',
        }, status=status.HTTP_200_OK)

    # Clean up any stale expired session found
    if session:
        session.delete()

    return Response({
        "has_active_session": False,
        "difficulty": 'Intermediate',
        "modifiers": [],
        "equipped_item": '',
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])  # Public access for learning resources
def learning_resources_api(request, topic_id):
    """
    Return learning resources for a specific topic and grade level.
    
    Args:
        request: DRF Request
        topic_id (int): PK of the Topic
    
    Query Parameters:
        grade_level (int): Grade level filter (1-10)
    
    Returns:
        Response: {"resources": list[dict]}
    """
    # Convert numeric grade level (1-10) to string format expected by LearningResource model
    # Elementary: grades 1-6, Junior High: grades 7-10
    grade_level_int = request.query_params.get('grade_level', 1)
    try:
        grade_level_int = int(grade_level_int)
    except (ValueError, TypeError):
        grade_level_int = 1
    
    # Map numeric grade to string format
    if grade_level_int <= 6:
        grade_level = 'Elementary'
    else:
        grade_level = 'Junior High'
    
    resources = LearningResource.objects.filter(
        topic_id=topic_id,
        grade_level=grade_level
    ).order_by('order')
    
    data = [{
        'id': r.id,
        'type': r.resource_type,
        'title': r.title,
        'embed_url': r.embed_url,
        'description': r.description,
    } for r in resources]
    
    return Response({'resources': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_inventory_api_view(request):
    """
    Return the authenticated player's available (non-zero quantity) modifiers.

    Used by ``ChallengeConfig.jsx`` to populate the pre-quiz item selection
    dropdown.

    Args:
        request: DRF ``Request``.

    Returns:
        Response: ``{"available_modifiers": list[dict]}`` where each dict
        contains ``slug``, ``name``, ``type``, ``value``, ``quantity``, and
        ``description``.
    """
    inventory = UserInventory.objects.filter(user=request.user, quantity__gt=0).select_related('modifier')
    data = [{
        "slug": item.modifier.slug,
        "name": item.modifier.name,
        "type": item.modifier.modifier_type,
        "value": item.modifier.multiplier_value,
        "quantity": item.quantity,
        "description": item.modifier.description,
    } for item in inventory]

    return Response({"available_modifiers": data}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Stars & Shop Views
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stars_api_view(request):
    """
    Return the authenticated user's current Stars balance.

    Returns:
        Response: ``{"balance": int, "total_earned": int}``
    """
    stars, _ = UserStars.objects.get_or_create(user=request.user)
    return Response({
        "balance": stars.balance,
        "total_earned": stars.total_earned,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shop_list_api_view(request):
    """
    List all available items in the shop with their prices.

    Returns:
        Response: ``{"items": list[dict]}`` where each dict contains
        ``id``, ``modifier_id``, ``name``, ``slug``, ``type``, ``value``,
        ``description``, and ``price``.
    """
    items = ShopItem.objects.filter(is_available=True).select_related('modifier')
    data = [{
        "id": item.id,
        "modifier_id": item.modifier.id,
        "name": item.modifier.name,
        "slug": item.modifier.slug,
        "type": item.modifier.modifier_type,
        "value": item.modifier.multiplier_value,
        "description": item.modifier.description or item.modifier.name,
        "price": item.price,
    } for item in items]

    return Response({"items": data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def shop_buy_api_view(request):
    """
    Purchase an item from the shop using Stars.

    Request body:
        ``item_id`` (int): The ID of the ShopItem to purchase.

    Returns:
        Response: Success or error message with updated balance.
    """
    item_id = request.data.get('item_id')
    if not item_id:
        return Response({"error": "item_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    shop_item = get_object_or_404(ShopItem, id=item_id, is_available=True)

    stars, _ = UserStars.objects.get_or_create(user=request.user)

    if stars.balance < shop_item.price:
        return Response({
            "error": "Insufficient stars.",
            "balance": stars.balance,
            "price": shop_item.price,
        }, status=status.HTTP_400_BAD_REQUEST)

    # Deduct stars
    stars.spend_stars(shop_item.price)

    # Add to user inventory
    inv_item, created = UserInventory.objects.get_or_create(
        user=request.user,
        modifier=shop_item.modifier,
        defaults={'quantity': 1}
    )
    if not created:
        inv_item.quantity += 1
        inv_item.save()

    logger.info(
        "Purchase: user=%s item=%s price=%d new_balance=%d",
        request.user.username, shop_item.modifier.name, shop_item.price, stars.balance
    )

    return Response({
        "success": True,
        "message": f"Purchased {shop_item.modifier.name}!",
        "balance": stars.balance,
        "quantity": inv_item.quantity,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def shop_admin_grant_api_view(request):
    """
    Admin-only endpoint to grant shop items for free (testing purposes).

    Request body:
        ``item_id`` (int): The ID of the ShopItem to grant.

    Returns:
        Response: Success or error message with updated balance.
    """
    if not request.user.is_superuser:
        return Response({
            "error": "Admin access required."
        }, status=status.HTTP_403_FORBIDDEN)

    item_id = request.data.get('item_id')
    if not item_id:
        return Response({"error": "item_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    shop_item = get_object_or_404(ShopItem, id=item_id, is_available=True)

    # Add to user inventory without spending stars
    inv_item, created = UserInventory.objects.get_or_create(
        user=request.user,
        modifier=shop_item.modifier,
        defaults={'quantity': 1}
    )
    if not created:
        inv_item.quantity += 1
        inv_item.save()

    stars, _ = UserStars.objects.get_or_create(user=request.user)

    logger.info(
        "Admin grant: user=%s item=%s",
        request.user.username, shop_item.modifier.name
    )

    return Response({
        "success": True,
        "message": f"Granted {shop_item.modifier.name} for free!",
        "balance": stars.balance,
        "quantity": inv_item.quantity,
    }, status=status.HTTP_200_OK)
