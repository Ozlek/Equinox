from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from django.db.models import Max, Count
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


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Bypasses CSRF enforcement for read-only leaderboard GET requests."""
    def enforce_csrf(self, request):
        return

@api_view(['GET'])
@authentication_classes([CsrfExemptSessionAuthentication])
@permission_classes([IsAuthenticated])
def leaderboard_api(request, topic_id):
    """
    Returns the leaderboard for a specific topic.
    Each user is ranked by their personal best score on that topic.
    Ties are broken by total attempts (more attempts = higher rank).
    """
    # For each user who has attempted this topic, get their best score
    # and total attempts
    from django.contrib.auth.models import User

    leaderboard_data = (
        UserProgress.objects
        .filter(topic_id=topic_id)
        .values('user__id', 'user__username')
        .annotate(
            best_score=Max('score'),
            attempts=Count('id')
        )
        .order_by('-best_score', '-attempts')
    )

    # Find the current user's rank
    current_user_id = request.user.id
    ranked = list(leaderboard_data)

    result = []
    current_user_rank = None

    for rank, entry in enumerate(ranked, start=1):
        is_current_user = entry['user__id'] == current_user_id
        if is_current_user:
            current_user_rank = rank
        result.append({
            "rank": rank,
            "username": entry['user__username'],
            "best_score": entry['best_score'],
            "attempts": entry['attempts'],
            "is_current_user": is_current_user,
        })

    return Response({
        "topic_id": topic_id,
        "current_user_rank": current_user_rank,
        "leaderboard": result
    })