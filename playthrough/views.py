import time
import math
import random
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from topics.models import Topic
from .models import Question, UserSkillProfile
from .dda_engine import EquinoxDDAEngine
from users_progress.models import UserProgress
from users_progress.achievements import AchievementRegistry

MAX_QUESTIONS_PER_SESSION = 10

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def playthrough_api_view(request, topic_id):
    topic = get_object_or_404(Topic, id=topic_id)
    dda = EquinoxDDAEngine()

    # 1. Initialize session properties inside the backend session cache
    if 'questions_served' not in request.session:
        # Checks query params (?difficulty=novice) or JSON body payload data safely
        chosen_difficulty = request.query_params.get('difficulty') or request.data.get('difficulty') or 'Intermediate'
        
        # Force-seed the engine rating baseline before building the question cache stack
        EquinoxDDAEngine.seed_initial_rating(request.user, topic.name, chosen_difficulty)

        request.session['questions_served'] = 0
        request.session['score'] = 0 # Academic score
        request.session['current_question_id'] = None
        request.session['active_topic_id'] = topic.id
        request.session['seen_question_ids'] = []
        
        # --- Gamification Inits ---
        request.session['gamified_score'] = 0
        request.session['current_streak'] = 0

    questions_served = request.session['questions_served']
    score = request.session['score']

    # This profile read now accurately picks up the baseline seed we injected above!
    profile, _ = UserSkillProfile.objects.get_or_create(user=request.user)
    current_rating = profile.get_rating(topic.name)
    current_tier = dda.get_closest_tier(current_rating)

    # -------------------------------------------------------------------------
    # ACTION A: USER SUBMITTED AN ANSWER (POST)
    # -------------------------------------------------------------------------
    if request.method == 'POST':
        selected_answer = request.data.get('answer', '').strip()
        current_q_id = request.session.get('current_question_id')
        
        if not current_q_id:
            return Response({"error": "No active question found in session."}, status=status.HTTP_400_BAD_REQUEST)
            
        question = get_object_or_404(Question, id=current_q_id)
        is_correct = (selected_answer.upper() == question.correct_answer.upper())

        # --- Gamified Scoring Logic ---
        start_time = request.session.get('question_start_time', time.time())
        time_taken = time.time() - start_time

        if is_correct:
            request.session['score'] += 1
            
            # Increment Streak
            current_streak = request.session.get('current_streak', 0) + 1
            request.session['current_streak'] = current_streak

            # Base Points per Tier
            tier_points = {
                "Novice": 1000,
                "Intermediate": 1500,
                "Advanced": 2000,
                "Expert": 2500
            }
            base = tier_points.get(current_tier, 1000)

            # Multipliers
            m_time = max(1.0, 1.5 - (time_taken / 60.0))
            m_streak = min(1.5, 1.0 + (0.1 * current_streak))
            m_modifier = 1.0 # Placeholder for future items

            # Calculate and add to total
            points_earned = math.floor(base * m_time * m_streak * m_modifier)
            request.session['gamified_score'] += points_earned
            
        else:
            # Reset streak to zero on incorrect answer
            request.session['current_streak'] = 0
            points_earned = 0

        # Run DDA Engine math
        dda.adjust_difficulty(
            user=request.user,
            domain=topic.name,
            question_obj=question,
            is_correct=is_correct
        )

        request.session['questions_served'] += 1

        # Clear the lock so the next GET request knows to pick a fresh question
        request.session['current_question_id'] = None 
        
        request.session.modified = True 
        
        # Return immediate feedback to React
        return Response({
            "is_correct": is_correct,
            "correct_answer": question.correct_answer,
            "current_score": request.session['score'], # Academic
            "questions_served": request.session['questions_served'],
            # --- Gamification Feedback ---
            "points_earned": points_earned,
            "gamified_score": request.session['gamified_score'],
            "current_streak": request.session['current_streak']
        })

    # -------------------------------------------------------------------------
    # ACTION B: EVALUATE END GAME OR SERVE NEXT QUESTION (GET)
    # -------------------------------------------------------------------------
    if questions_served >= MAX_QUESTIONS_PER_SESSION:
        # Save session history row
        UserProgress.objects.create(
            user=request.user,
            topic=topic,
            score=score,
            gamified_score=request.session.get('gamified_score', 0),
            total_questions=MAX_QUESTIONS_PER_SESSION,
            difficulty=current_tier
        )

        new_badges = AchievementRegistry.evaluate_user(request.user)
        final_gamified_score = request.session.get('gamified_score', 0)

        # Clear active quiz storage comprehensively
        keys_to_clear = [
            'questions_served', 'score', 'current_question_id', 'active_topic_id', 
            'seen_question_ids', 'gamified_score', 'current_streak', 'question_start_time'
        ]
        for key in keys_to_clear:
            if key in request.session:
                del request.session[key]

        return Response({
            "session_complete": True,
            "final_score": score,
            "final_gamified_score": final_gamified_score,
            "total_questions": MAX_QUESTIONS_PER_SESSION,
            "new_achievements": new_badges
        })

    active_q_id = request.session.get('current_question_id')
    seen_ids = request.session.get('seen_question_ids', [])
    
    if active_q_id:
        question = get_object_or_404(Question, id=active_q_id)
    else:
        matching_questions = Question.objects.filter(topic=topic, difficulty=current_tier).exclude(id__in=seen_ids)
        if not matching_questions.exists():
            matching_questions = Question.objects.filter(topic=topic)

        if not matching_questions.exists():
            return Response({
                "error": f"No questions seeded for topic '{topic.name}' yet."
            }, status=status.HTTP_404_NOT_FOUND)

        question = matching_questions.order_by('?').first()
        
        request.session['current_question_id'] = question.id
        request.session['seen_question_ids'].append(question.id) 

    # --- Start the Timer for Gamification ---
    request.session['question_start_time'] = time.time()
    request.session.modified = True
    
    is_admin_user = request.user.is_staff

    payload = {
        "session_complete": False,
        "topic_name": topic.name,
        "question_number": questions_served + 1,
        "total_questions": MAX_QUESTIONS_PER_SESSION,
        "score": score,
        "current_tier": current_tier,
        "question_text": question.question_text,
        "choices": {
            "A": question.choice_a,
            "B": question.choice_b,
            "C": question.choice_c,
            "D": question.choice_d,
        } if question.choice_a else None,
        
        # Gamification State
        "gamified_score": request.session.get('gamified_score', 0),
        "current_streak": request.session.get('current_streak', 0),
        
        "is_admin": is_admin_user,
    }

    if is_admin_user:
        payload["admin_correct_answer"] = question.correct_answer

    return Response(payload, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quit_playthrough_api_view(request):
    """API endpoint to wipe cache if student confirms exit intention."""
    keys_to_clear = [
        'questions_served', 'score', 'current_question_id', 'active_topic_id', 
        'seen_question_ids', 'gamified_score', 'current_streak', 'question_start_time'
    ]
    for key in keys_to_clear:
        if key in request.session:
            del request.session[key]
            
    request.session.modified = True 
    return Response({"message": "Session terminated cleanly."}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_active_session_api(request):
    """Allows the React dashboard to check if the student has an abandoned playthrough."""
    active_topic = request.session.get('active_topic_id')
    
    if active_topic is not None:
        return Response({
            "has_active_session": True, 
            "topic_id": active_topic
        }, status=status.HTTP_200_OK)
        
    return Response({"has_active_session": False}, status=status.HTTP_200_OK)