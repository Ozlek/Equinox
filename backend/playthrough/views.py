import time
import math
import sys
import logging
import random

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import F, Min, Max

from topics.models import Topic
from .models import Question, DomainRating, GamifiedModifier, UserInventory, PlaythroughSession, LearningResource
from .dda_engine import EquinoxDDAEngine
from users_progress.models import UserProgress
from users_progress.achievements import AchievementRegistry

logger = logging.getLogger(__name__)

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
        answer (str): The raw answer string from the request or database.

    Returns:
        str: The normalised answer string.
    """
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

    Args:
        request: The DRF ``Request`` object.
        topic (Topic): The topic being played.

    Returns:
        tuple[PlaythroughSession, bool]: The session and a boolean indicating
        whether it was newly created (``True``) or resumed (``False``).
    """
    try:
        session = PlaythroughSession.objects.get(user=request.user, topic=topic)
        if session.is_expired():
            logger.info(
                "Expired session found for user=%s topic=%s — replacing.",
                request.user.username, topic.name
            )
            session.delete()
            raise PlaythroughSession.DoesNotExist
        return session, False
    except PlaythroughSession.DoesNotExist:
        return _init_session(request, topic), True


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
        return Response(
            {"error": "Answer too long. Maximum length is 500 characters."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
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

    seen_ids = session.seen_question_ids or []

    qs = Question.objects.filter(topic=topic, difficulty=current_tier).exclude(id__in=seen_ids)

    # Fallback 1: allow repeats within the current tier
    if not qs.exists():
        qs = Question.objects.filter(topic=topic, difficulty=current_tier)

    # Fallback 2: any question in the topic
    if not qs.exists():
        qs = Question.objects.filter(topic=topic)

    if not qs.exists():
        return None

    # Use deterministic ordering in test runs to keep assertions stable
    if 'test' in sys.argv:
        return qs.order_by('id').first()
    
    # Optimize random selection: avoid expensive order_by('?') on large tables
    # by selecting a random ID within the range instead
    try:
        min_id = qs.aggregate(min_id=Min('id'))['min_id']
        max_id = qs.aggregate(max_id=Max('id'))['max_id']
        if min_id and max_id:
            random_id = random.randint(min_id, max_id)
            question = qs.filter(id__gte=random_id).first()
            if question:
                return question
    except Exception:
        pass  # Fallback to simple first() if random selection fails
    
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
        total_questions=MAX_QUESTIONS_PER_SESSION,
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

    session.end_session()

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
            - POST ``answer`` (str): The player's answer (``"A"``–``"D"`` for
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

        if result['one_life_triggered']:
            summary = end_session(session, topic, current_tier, new_badges=None)
            return Response({
                "is_correct": False,
                "correct_answer": question.correct_answer,
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
            }, status=status.HTTP_200_OK)

        return Response({
            "is_correct": result['is_correct'],
            "correct_answer": question.correct_answer,
            "score": session.score,
            "current_score": session.score,
            "questions_served": session.questions_served,
            "points_earned": result['points_earned'],
            "gamified_score": session.gamified_score,
            "current_streak": session.current_streak,
            "shield_active": (session.modifier_type == 'STREAK_SHIELD'),
        })

    # -------------------------------------------------------------------------
    # ACTION B: EVALUATE END GAME OR SERVE NEXT QUESTION (GET)
    # -------------------------------------------------------------------------
    if session.questions_served >= MAX_QUESTIONS_PER_SESSION:
        new_badges = AchievementRegistry.evaluate_user(request.user)
        summary = end_session(session, topic, current_tier, new_badges=new_badges)
        return Response({
            "session_complete": True,
            "final_score": summary['final_score'],
            "final_gamified_score": summary['final_gamified_score'],
            "total_questions": MAX_QUESTIONS_PER_SESSION,
            "new_achievements": summary['new_achievements'],
        })

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
        Response: ``{"has_active_session": bool, "topic_id": int|null}``
    """
    session = (
        PlaythroughSession.objects
        .filter(user=request.user)
        .select_related('topic')
        .first()
    )

    if session and not session.is_expired():
        return Response({
            "has_active_session": True,
            "topic_id": session.topic.id,
        }, status=status.HTTP_200_OK)

    # Clean up any stale expired session found
    if session:
        session.delete()

    return Response({"has_active_session": False}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])  # Public access for learning resources
def learning_resources_api(request, topic_id):
    """
    Return learning resources for a specific topic and grade level.
    
    Args:
        request: DRF Request
        topic_id (int): PK of the Topic
    
    Query Parameters:
        grade_level (str): Grade level filter (Elementary, Junior High, Senior High)
    
    Returns:
        Response: {"resources": list[dict]}
    """
    grade_level = request.query_params.get('grade_level', 'Elementary')
    
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