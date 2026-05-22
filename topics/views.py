from django.shortcuts import render, get_object_or_404
from .models import Topic


def topic_list(request):

    topics = Topic.objects.all()

    return render(request, 'topics/topic_list.html', {
        'topics': topics
    })


def topic_detail(request, topic_id):

    topic = get_object_or_404(Topic, id=topic_id)

    return render(request, 'topics/topic_detail.html', {
        'topic': topic
    })