from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Max, Count
from django.contrib.auth.models import User
from collections import defaultdict
from .models import UserProgress
from .models import UnlockedAchievement
from .achievements import AchievementRegistry
from playthrough.models import DomainRating, ResponseLog

# Pagination limit for leaderboard to prevent unbounded responses
LEADERBOARD_PAGE_SIZE = 100


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def progress_history_api(request):
    """
    Return the authenticated user's full playthrough history, newest first.

    Args:
        request: DRF ``Request``.

    Returns:
        Response: List of progress record dicts.
    """
    progress_records = (
        UserProgress.objects
        .filter(user=request.user)
        .select_related('topic')
        .order_by('-completed_at')
    )

    data = [{
        "id": record.id,
        "topic_name": record.topic.name,
        "grade_level_min": record.topic.grade_level_min,
        "grade_level_max": record.topic.grade_level_max,
        "score": record.score,
        "gamified_score": record.gamified_score,
        "total_questions": record.total_questions,
        "difficulty_achieved": record.difficulty,
        "completed_at": record.completed_at.isoformat(),
    } for record in progress_records]

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_achievements_api(request):
    """
    Return ALL available achievements with their unlock status.

    Args:
        request: DRF ``Request``.

    Returns:
        Response: List of achievement dicts with id, title, description, icon,
        unlocked (bool), and unlocked_at (iso string or None).
    """
    from .achievements import AchievementRegistry
    
    unlocked_ids = set(
        UnlockedAchievement.objects.filter(user=request.user)
        .values_list('achievement_id', flat=True)
    )
    unlocked_at_map = {
        ua.achievement_id: ua.unlocked_at.isoformat()
        for ua in UnlockedAchievement.objects.filter(user=request.user)
    }
    
    data = []
    for badge_id, badge_data in AchievementRegistry.BADGES.items():
        data.append({
            "id": badge_id,
            "title": badge_data.get('title', badge_id),
            "description": badge_data.get('description', ''),
            "icon": badge_data.get('icon', '🏆'),
            "unlocked": badge_id in unlocked_ids,
            "unlocked_at": unlocked_at_map.get(badge_id, None),
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard_api(request, topic_id):
    """
    Return top performers for a specific topic.

    Args:
        request: DRF ``Request``.
        topic_id (int): PK of the Topic.

    Returns:
        Response: List of leaderboard entries with username, score, and gamified_score.
    """
    from topics.models import Topic
    from django.db.models import Max

    topic = get_object_or_404(Topic, id=topic_id)

    # Get the best UserProgress entry per user for this topic
    best_progress = (
        UserProgress.objects
        .filter(topic=topic)
        .values('user')
        .annotate(
            best_score=Max('score'),
            best_gamified=Max('gamified_score'),
            total_questions=Max('total_questions'),
            latest_completed=Max('completed_at')
        )
        .order_by('-best_gamified')[:LEADERBOARD_PAGE_SIZE]
    )

    # Fetch usernames in a second query to keep the aggregation simple
    user_ids = [entry['user'] for entry in best_progress]
    users = User.objects.filter(id__in=user_ids)
    user_map = {u.id: u.username for u in users}

    data = [{
        "user_id": entry['user'],
        "username": user_map.get(entry['user'], 'Unknown'),
        "score": entry['best_score'],
        "gamified_score": entry['best_gamified'],
        "total_questions": entry['total_questions'],
        "completed_at": entry['latest_completed'].isoformat() if entry['latest_completed'] else None,
    } for entry in best_progress]

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def adaptive_analysis_api(request):
    """
    Analyze user performance and provide personalized recommendations for next topic and difficulty.

    Analyzes ResponseLog history to calculate:
    - Overall accuracy per domain
    - Learning velocity (improvement rate over time)
    - Consistency metrics
    - Word problem vs direct problem performance
    - Recommended next topic and difficulty level

    Args:
        request: DRF ``Request``. Must be authenticated.

    Returns:
        Response: ``{"analysis": dict, "recommendations": list[dict]}``
    """
    from .adaptive_analysis import generate_adaptive_analysis
    result = generate_adaptive_analysis(request.user)
    return Response(result)

