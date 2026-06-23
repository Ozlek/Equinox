from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Topic

@api_view(['GET'])
@permission_classes([AllowAny]) # Anyone can browse the available topic lists
def topic_list_api(request):
    topics = Topic.objects.all()
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