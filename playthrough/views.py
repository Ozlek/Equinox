from django.shortcuts import render, get_object_or_404, redirect
from topics.models import Topic
from .models import Question
from users_progress.models import UserProgress

# Create your views here.

def playthrough_view(request, topic_id):

    topic = get_object_or_404(Topic, id=topic_id)

    questions = Question.objects.filter(topic=topic)

    # Initialize session values
    if 'question_index' not in request.session:
        request.session['question_index'] = 0
        request.session['score'] = 0

    question_index = request.session['question_index']
    score = request.session['score']

    # If no more questions
    if question_index >= len(questions):

        UserProgress.objects.create(
            user=request.user,
            topic=topic,
            score=score,
            total_questions=len(questions),
            difficulty='Novice'
        )

        final_score = score

        # Reset session
        request.session['question_index'] = 0
        request.session['score'] = 0

        return render(request, 'playthrough/result.html', {
            'topic': topic,
            'score': final_score,
            'total': len(questions),
        })

    question = questions[question_index]

    feedback = None

    if request.method == 'POST':

        selected_answer = request.POST.get('answer')

        if selected_answer == question.correct_answer:

            request.session['score'] += 1

            feedback = "Correct!"

        else:

            feedback = "Wrong!"

        request.session['question_index'] += 1

        return redirect('playthrough', topic_id=topic.id)

    return render(request, 'playthrough/playthrough.html', {
        'topic': topic,
        'question': question,
        'question_number': question_index + 1,
        'total_questions': len(questions),
        'score': score,
        'feedback': feedback,
    })