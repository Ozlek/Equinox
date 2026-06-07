import random
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from topics.models import Topic
from .models import Question, UserSkillProfile
from .dda_engine import EquinoxDDAEngine
from users_progress.models import UserProgress

# Define how many questions make up a single quiz session
MAX_QUESTIONS_PER_SESSION = 10

@login_required
def playthrough_view(request, topic_id):
    topic = get_object_or_404(Topic, id=topic_id)
    dda = EquinoxDDAEngine()

    # Initialize session values if it's the start of the quiz
    if 'questions_served' not in request.session:
        request.session['questions_served'] = 0
        request.session['score'] = 0
        request.session['current_question_id'] = None

    questions_served = request.session['questions_served']
    score = request.session['score']

    # Fetch the user's current DDA tier for this domain
    # (Assuming topic.name matches your domains like 'Algebra', 'Arithmetic', etc.)
    profile, _ = UserSkillProfile.objects.get_or_create(user=request.user)
    current_rating = profile.get_rating(topic.name)
    current_tier = dda.get_closest_tier(current_rating)

    # -------------------------------------------------------------------------
    # CASE 1: END OF QUIZ SESSION
    # -------------------------------------------------------------------------
    if questions_served >= MAX_QUESTIONS_PER_SESSION:
        # Save the session summary into your existing progress tracking app
        UserProgress.objects.create(
            user=request.user,
            topic=topic,
            score=score,
            total_questions=MAX_QUESTIONS_PER_SESSION,
            difficulty=current_tier  # Saves the ending DDA tier achieved
        )

        final_score = score

        # Reset session storage safely for the next run
        del request.session['questions_served']
        del request.session['score']
        if 'current_question_id' in request.session:
            del request.session['current_question_id']

        return render(request, 'playthrough/result.html', {
            'topic': topic,
            'score': final_score,
            'total': MAX_QUESTIONS_PER_SESSION,
        })

    # -------------------------------------------------------------------------
    # CASE 2: USER SUBMITTED AN ANSWER (POST)
    # -------------------------------------------------------------------------
    if request.method == 'POST':
        # Use .strip() to remove accidental spaces, and .upper() to handle lowercase variations safely
        selected_answer = request.POST.get('answer', '').strip()
        current_q_id = request.session.get('current_question_id')
        
        if current_q_id:
            question = get_object_or_404(Question, id=current_q_id)
            
            # Smart comparison:
            # If it's an MCQ, it checks case-insensitive ('A' == 'a')
            # If it's text-box, it compares the literal input string directly against correct_answer
            is_correct = (selected_answer.upper() == question.correct_answer.upper())

            if is_correct:
                request.session['score'] += 1

            # Execute the core DDA Pipeline
            dda.adjust_difficulty(
                user=request.user,
                domain=topic.name,
                question_obj=question,
                is_correct=is_correct
            )

            request.session['questions_served'] += 1

        return redirect('playthrough', topic_id=topic.id)

    # -------------------------------------------------------------------------
    # CASE 3: DISPLAYING THE NEXT QUESTION (GET)
    # -------------------------------------------------------------------------
    # 1. Attempt to find questions matching the specific topic AND current DDA tier
    matching_questions = Question.objects.filter(topic=topic, difficulty=current_tier)

    # 2. Fallback 1: If no questions match that specific difficulty tier, grab ANY difficulty for this topic
    if not matching_questions.exists():
        matching_questions = Question.objects.filter(topic=topic)

    # 3. Fallback 2: CRASH PREVENTION
    # If there are literally ZERO questions in the database for this topic, show a clean message instead of throwing an IndexError
    if not matching_questions.exists():
        return render(request, 'playthrough/playthrough.html', {
            'topic': topic,
            'question': None,
            'error_message': f"Database Missing Data: No questions have been seeded for the topic '{topic.name}' yet! Please add questions in the Django Admin panel."
        })

    # Now it is completely safe to use random.choice because we know matching_questions is NOT empty
    question = random.choice(matching_questions)
    
    request.session['current_question_id'] = question.id

    return render(request, 'playthrough/playthrough.html', {
        'topic': topic,
        'question': question,
        'question_number': questions_served + 1,
        'total_questions': MAX_QUESTIONS_PER_SESSION,
        'score': score,
        'current_tier': current_tier,
        'is_playthrough': True,
    })

@login_required
def quit_playthrough_view(request):
    """Safely clears stale quiz session data without saving incomplete progress records."""
    if 'questions_served' in request.session:
        del request.session['questions_served']
    if 'score' in request.session:
        del request.session['score']
    if 'current_question_id' in request.session:
        del request.session['current_question_id']
        
    # Redirect cleanly back to the main topics selection catalogue
    return redirect('topic_list') # Replace 'topic_list' with your actual dashboard/topics named route