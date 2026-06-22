from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Max, Count
from .models import UserProgress
from .models import UnlockedAchievement
from .achievements import AchievementRegistry

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
        "grade_level": record.topic.grade_level,
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
    Return all achievements with earned/locked status for the authenticated user.

    Args:
        request: DRF ``Request``.

    Returns:
        Response: ``{"achievements": list[dict]}``
    """
    unlocked_records = UnlockedAchievement.objects.filter(user=request.user)
    unlocked_ids = set(unlocked_records.values_list('achievement_id', flat=True))

    payload = []

    for badge_id, badge_data in AchievementRegistry.BADGES.items():
        is_earned = badge_id in unlocked_ids

        payload.append({
            "id": badge_id,
            "title": badge_data["title"],
            "description": badge_data["description"],
            "icon": badge_data["icon"],
            "unlocked": is_earned,
        })

    return Response({"achievements": payload})


# JWT authentication does not require CSRF tokens — the leaderboard endpoint
# relies solely on the Bearer token supplied in the Authorization header, so
# no CSRF exemption class is needed here.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard_api(request, topic_id):
    """
    Return the leaderboard for a specific topic.

    Each user is ranked by their personal best gamified score on that topic.
    Uses ``values()`` + ``annotate()`` to aggregate per-user bests in a single
    query, avoiding N+1 issues. ``select_related('user')`` is applied before
    the ``values()`` call so the ORM can resolve the join efficiently.

    Args:
        request: DRF ``Request``. Must be authenticated.
        topic_id (int): PK of the ``Topic`` to rank.

    Returns:
        Response: ``{"topic_id": int, "current_user_rank": int|null,
        "leaderboard": list[dict]}``
    """
    current_user_id = request.user.id

    leaderboard_data = (
        UserProgress.objects
        .filter(topic_id=topic_id)
        .select_related('user')
        .values('user__id', 'user__username')
        .annotate(
            best_academic=Max('score'),
            best_gamified=Max('gamified_score'),
            best_total_questions=Max('total_questions'),
            attempts=Count('id'),
        )
        .order_by('-best_gamified', '-best_academic')
        [:LEADERBOARD_PAGE_SIZE]  # Limit response size for performance
    )

    result = []
    current_user_rank = None

    for rank, entry in enumerate(leaderboard_data, start=1):
        is_current_user = entry['user__id'] == current_user_id

        if is_current_user:
            current_user_rank = rank

        result.append({
            "rank": rank,
            "username": entry['user__username'],
            "best_score": entry['best_academic'],
            "gamified_score": entry['best_gamified'],
            "total_questions": entry['best_total_questions'],
            "attempts": entry['attempts'],
            "is_current_user": is_current_user,
        })

    return Response({
        "topic_id": topic_id,
        "current_user_rank": current_user_rank,
        "leaderboard": result,
    })
