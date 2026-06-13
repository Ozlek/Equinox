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
        request.session['questions_served'] = 0
        request.session['score'] = 0
        request.session['current_question_id'] = None
        request.session['active_topic_id'] = topic.id

    questions_served = request.session['questions_served']
    score = request.session['score']

    profile, _ = UserSkillProfile.objects.get_or_create(user=request.user)
    current_rating = profile.get_rating(topic.name)
    current_tier = dda.get_closest_tier(current_rating)

    # -------------------------------------------------------------------------
    # ACTION A: USER SUBMITTED AN ANSWER (POST)
    # -------------------------------------------------------------------------
    if request.method == 'POST':
        # React will send data as a JSON payload, parsed automatically by DRF into request.data
        selected_answer = request.data.get('answer', '').strip()
        current_q_id = request.session.get('current_question_id')
        
        if not current_q_id:
            return Response({"error": "No active question found in session."}, status=status.HTTP_400_BAD_REQUEST)
            
        question = get_object_or_404(Question, id=current_q_id)
        is_correct = (selected_answer.upper() == question.correct_answer.upper())

        if is_correct:
            request.session['score'] += 1
            
        # Run DDA Engine math
        dda.adjust_difficulty(
            user=request.user,
            domain=topic.name,
            question_obj=question,
            is_correct=is_correct
        )

        request.session['questions_served'] += 1
        request.session.modified = True # Force Django to save tracking state updates
        
        # Return immediate feedback to React so the UI can flash green/red
        return Response({
            "is_correct": is_correct,
            "correct_answer": question.correct_answer,
            "current_score": request.session['score'],
            "questions_served": request.session['questions_served']
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
            total_questions=MAX_QUESTIONS_PER_SESSION,
            difficulty=current_tier
        )

        new_badges = AchievementRegistry.evaluate_user(request.user)

        # Clear active quiz storage
        for key in ['questions_served', 'score', 'current_question_id', 'active_topic_id']:
            if key in request.session:
                del request.session[key]

        # Notify React that the session has concluded
        return Response({
            "session_complete": True,
            "final_score": score,
            "total_questions": MAX_QUESTIONS_PER_SESSION,
            "new_achievements": new_badges
        })

    # Query matching tier pool
    matching_questions = Question.objects.filter(topic=topic, difficulty=current_tier)
    if not matching_questions.exists():
        matching_questions = Question.objects.filter(topic=topic)

    if not matching_questions.exists():
        return Response({
            "error": f"No questions seeded for topic '{topic.name}' yet."
        }, status=status.HTTP_404_NOT_FOUND)

    question = matching_questions.order_by('?').first()
    request.session['current_question_id'] = question.id
    request.session.modified = True

    # Pack complete layout payload for React layout renderer
    return Response({
        "session_complete": False,
        "topic_name": topic.name,
        "question_number": questions_served + 1,
        "total_questions": MAX_QUESTIONS_PER_SESSION,
        "score": score,
        "current_tier": current_tier,
        "question_text": question.question_text,
        # Safely pack choices if they exist (handles text box fallback out of the box)
        "choices": {
            "A": question.choice_a,
            "B": question.choice_b,
            "C": question.choice_c,
            "D": question.choice_d,
        } if question.choice_a else None
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quit_playthrough_api_view(request):
    """API endpoint to wipe cache if student confirms exit intention."""
    for key in ['questions_served', 'score', 'current_question_id', 'active_topic_id']:
        if key in request.session:
            del request.session[key]
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