from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Topic
from playthrough.models import Lesson

@api_view(['GET'])
@permission_classes([AllowAny]) # Anyone can browse the available topic lists
def topic_list_api(request):
    """Return visible topics for learners."""
    topics = Topic.objects.filter(is_visible=True).order_by('name')
    data = [{
        "id": t.id,
        "name": t.name,
        "grade_level_min": t.grade_level_min,
        "grade_level_max": t.grade_level_max,
        "description": t.description
    } for t in topics]
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def topic_detail_api(request, topic_id):
    topic = get_object_or_404(Topic, id=topic_id)
    data = {
        "id": topic.id,
        "name": topic.name,
        "grade_level_min": topic.grade_level_min,
        "grade_level_max": topic.grade_level_max,
        "description": topic.description
    }
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def topic_lessons_api(request, topic_id):
    """
    Return lessons for a specific topic and grade level.
    
    Query Parameters:
        grade_level (int): Grade level filter (1-10)
    
    Returns:
        Response: {"lessons": list[dict]} where each dict contains
        id, title, objectives, example, and tip.
    """
    topic = get_object_or_404(Topic, id=topic_id)
    
    # Get grade level from query params, default to topic's min grade
    grade_level = request.query_params.get('grade_level')
    if grade_level:
        try:
            grade_level = int(grade_level)
        except (ValueError, TypeError):
            grade_level = topic.grade_level_min
    else:
        grade_level = topic.grade_level_min
    
    lessons = Lesson.objects.filter(
        topic=topic,
        grade_level=grade_level
    ).order_by('order')
    
    data = [{
        'id': lesson.id,
        'title': lesson.title,
        'objectives': lesson.objectives,
        'example': lesson.example,
        'tip': lesson.tip,
    } for lesson in lessons]
    
    return Response({'lessons': data})


@api_view(['GET'])
@permission_classes([AllowAny])
def all_topics_api(request):
    """Return all topics for public use (e.g., instructor registration)."""
    topics = Topic.objects.all().order_by('name')
    data = [{
        "id": t.id,
        "name": t.name,
        "grade_level_min": t.grade_level_min,
        "grade_level_max": t.grade_level_max,
        "description": t.description
    } for t in topics]
    return Response(data)
