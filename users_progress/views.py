from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import UserProgress

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def progress_history_api(request):
    # Safely targets the logged-in student profile session
    progress_records = UserProgress.objects.filter(user=request.user).order_by('-completed_at')
    
    data = [{
        "id": record.id,
        "topic_name": record.topic.name,
        "score": record.score,
        "total_questions": record.total_questions,
        "difficulty_achieved": record.difficulty,
        "completed_at": record.completed_at.strftime("%Y-%m-%d %H:%M")
    } for record in progress_records]
    
    return Response(data)