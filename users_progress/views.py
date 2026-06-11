from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import UserProgress
from .models import UnlockedAchievement
from .achievements import AchievementRegistry

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_achievements_api(request):
    # Fetch the IDs of badges the user already owns
    unlocked_records = UnlockedAchievement.objects.filter(user=request.user)
    unlocked_ids = set(unlocked_records.values_list('achievement_id', flat=True))
    
    payload = []
    
    # Map the entire registry to show both earned and locked statuses
    for badge_id, badge_data in AchievementRegistry.BADGES.items():
        is_earned = badge_id in unlocked_ids
        
        payload.append({
            "id": badge_id,
            "title": badge_data["title"],
            "description": badge_data["description"],
            "icon": badge_data["icon"],
            "unlocked": is_earned
        })
        
    return Response({"achievements": payload})