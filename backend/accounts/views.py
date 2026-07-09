from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.contrib.auth import login, logout, authenticate
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .forms import RegisterForm
from .models import UserProfile
from playthrough.models import Question, Topic, QuestionChangeRequest


# ---------------------------------------------------------------------------
# Permission helpers
# ---------------------------------------------------------------------------

def _is_admin(user):
    return user.is_superuser or user.is_staff


def _is_instructor(user):
    """Return True if the user is an instructor or has admin-level access."""
    if _is_admin(user):
        return True
    profile = getattr(user, 'profile', None)
    return profile is not None and profile.user_type == 'instructor'


def _require_admin(request):
    """Raise PermissionDenied if the requesting user is not an admin."""
    if not _is_admin(request.user):
        raise PermissionDenied("Admin access required.")


def _require_instructor(request):
    """Raise PermissionDenied if the requesting user is not instructor/admin."""
    if not _is_instructor(request.user):
        raise PermissionDenied("Instructor or admin access required.")


# ---------------------------------------------------------------------------
# Auth views
# ---------------------------------------------------------------------------

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_api(request):
    """
    Authenticate user and create session.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({
            "authenticated": False,
            "errors": {"non_field_errors": ["Username and password are required."]}
        }, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        refresh = RefreshToken.for_user(user)
        profile = getattr(user, 'profile', None)

        return Response({
            "authenticated": True,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "user_type": profile.user_type if profile else 'student',
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "needs_onboarding": profile is None or not profile.has_completed_onboarding,
            "message": "Login successful"
        }, status=status.HTTP_200_OK)

    return Response({
        "authenticated": False,
        "errors": {"non_field_errors": ["Invalid username or password."]}
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register_api(request):
    form = RegisterForm(request.data)
    if form.is_valid():
        user = form.save()
        user_type = form.cleaned_data.get('user_type', 'student')

        # Set is_staff for instructors (gives Django admin panel access)
        if user_type == 'instructor':
            user.is_staff = True
            user.save()

        # Update or create profile with user_type
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.user_type = user_type
        profile.save()

        login(request, user)
        return Response({
            "authenticated": True,
            "username": user.username,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "user_type": user_type,
            "message": "Registration successful"
        }, status=status.HTTP_201_CREATED)

    return Response({
        "authenticated": False,
        "errors": form.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    logout(request)
    return Response({"authenticated": False, "message": "Logged out successfully"}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth_status(request):
    if request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        return Response({
            "authenticated": True,
            "username": request.user.username,
            "email": request.user.email or None,
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
            "user_type": profile.user_type if profile else 'student',
            "date_joined": request.user.date_joined.isoformat() if request.user.date_joined else None,
            "needs_onboarding": profile is None or not profile.has_completed_onboarding
        })
    return Response({"authenticated": False})


@api_view(['POST'])
@permission_classes([AllowAny])
def onboarding_api(request):
    grade_level = request.data.get('grade_level')

    # Validate grade_level is a valid integer in range 1-10
    try:
        grade_level_int = int(grade_level)
        if not (1 <= grade_level_int <= 10):
            raise ValueError("Grade level must be between 1 and 10")
    except (ValueError, TypeError):
        return Response({"error": "Invalid grade level. Must be a number between 1 and 10."}, status=status.HTTP_400_BAD_REQUEST)

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.grade_level = grade_level_int
    profile.has_completed_onboarding = True
    profile.save()

    return Response({"success": True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_achievements_api(request):
    """
    Reset all achievements for the current user (admin/testing function).
    """
    from users_progress.models import UnlockedAchievement
    from users_progress.achievements import AchievementRegistry

    # Delete all unlocked achievements for this user
    deleted_count, _ = UnlockedAchievement.objects.filter(user=request.user).delete()

    # Get updated achievement list (all should be locked now)
    achievements_list = []
    for badge_id, badge_data in AchievementRegistry.BADGES.items():
        achievements_list.append({
            "id": badge_id,
            "title": badge_data["title"],
            "description": badge_data["description"],
            "icon": badge_data["icon"],
            "unlocked": False,
        })

    return Response({
        "success": True,
        "message": f"Reset {deleted_count} achievements. All achievements are now locked.",
        "newly_unlocked": [],
        "achievements": achievements_list
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_grade_api(request):
    """
    Get the current user's grade level.
    """
    profile = getattr(request.user, 'profile', None)
    grade_level = profile.grade_level if profile else None

    return Response({
        "grade_level": grade_level
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_grade_api(request):
    """
    Update the current user's grade level.
    """
    grade_level = request.data.get('grade_level')

    try:
        grade_level_int = int(grade_level)
        if not (1 <= grade_level_int <= 10):
            raise ValueError("Grade level must be between 1 and 10")
    except (ValueError, TypeError):
        return Response({"error": "Invalid grade level. Must be a number between 1 and 10."}, status=status.HTTP_400_BAD_REQUEST)

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.grade_level = grade_level_int
    profile.save()

    return Response({
        "success": True,
        "grade_level": grade_level_int
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account_api(request):
    """
    Permanently delete the user's account and all associated data.
    """
    user = request.user
    user.delete()

    return Response({
        "success": True,
        "message": "Account deleted successfully"
    }, status=status.HTTP_200_OK)


# ===========================================================================
# ADMIN ENDPOINTS — superuser/staff only
# ===========================================================================


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """List all users with profiles, progress count, sorted by date joined."""
    _require_admin(request)

    from django.contrib.auth.models import User
    from django.db.models import Count

    users = User.objects.annotate(
        progress_count=Count('userprogress')
    ).order_by('-date_joined')

    data = [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "is_staff": u.is_staff,
        "is_superuser": u.is_superuser,
        "user_type": getattr(u.profile, 'user_type', 'student') if hasattr(u, 'profile') else 'student',
        "grade_level": getattr(u.profile, 'grade_level', None) if hasattr(u, 'profile') else None,
        "has_completed_onboarding": getattr(u.profile, 'has_completed_onboarding', False) if hasattr(u, 'profile') else False,
        "progress_count": u.progress_count,
        "date_joined": u.date_joined.isoformat(),
    } for u in users]

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_topics_list(request):
    """List all topics with question counts per grade level."""
    _require_admin(request)

    topics = Topic.objects.all().order_by('name')
    from django.db.models import Count

    data = []
    for topic in topics:
        # Group questions by grade_level
        grade_groups = (
            Question.objects
            .filter(topic=topic)
            .values('grade_level')
            .annotate(count=Count('id'))
            .order_by('grade_level')
        )
        grades = {str(g['grade_level']): g['count'] for g in grade_groups}

        data.append({
            "id": topic.id,
            "name": topic.name,
            "description": topic.description,
            "grade_level_min": topic.grade_level_min,
            "grade_level_max": topic.grade_level_max,
            "question_counts_by_grade": grades,
            "total_questions": sum(grades.values()),
        })

    return Response(data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_questions_list(request):
    """
    List questions or create a new question (admin, direct).
    GET:  List questions with optional filters: ?topic_id=&grade_level=
    POST: Create a new question directly (bypasses approval system)
    """
    _require_admin(request)

    if request.method == 'POST':
        data = request.data
        topic = get_object_or_404(Topic, id=data.get('topic_id'))
        question = Question.objects.create(
            topic=topic,
            question_text=data.get('question_text', ''),
            question_solution=data.get('question_solution', ''),
            choice_a=data.get('choice_a'),
            choice_b=data.get('choice_b'),
            choice_c=data.get('choice_c'),
            choice_d=data.get('choice_d'),
            correct_answer=data.get('correct_answer', ''),
            grade_level=data.get('grade_level', 1),
            difficulty=data.get('difficulty', 1.0),
            source=data.get('source', 'seed'),
            is_word_problem=data.get('is_word_problem', True),
            is_verified=data.get('is_verified', False),
        )
        return Response({"id": question.id, "message": "Question created"}, status=status.HTTP_201_CREATED)

    qs = Question.objects.select_related('topic').all().order_by('id')

    topic_id = request.query_params.get('topic_id')
    grade_level = request.query_params.get('grade_level')

    if topic_id:
        qs = qs.filter(topic_id=topic_id)
    if grade_level:
        qs = qs.filter(grade_level=grade_level)

    data = [{
        "id": q.id,
        "topic_id": q.topic_id,
        "topic_name": q.topic.name,
        "question_text": q.question_text,
        "question_solution": q.question_solution,
        "choice_a": q.choice_a,
        "choice_b": q.choice_b,
        "choice_c": q.choice_c,
        "choice_d": q.choice_d,
        "correct_answer": q.correct_answer,
        "grade_level": q.grade_level,
        "difficulty": q.difficulty,
        "source": q.source,
        "is_word_problem": q.is_word_problem,
        "is_verified": q.is_verified,
    } for q in qs]

    return Response(data)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_question_detail(request, question_id):
    """Update (PUT) or delete (DELETE) a question (admin, direct)."""
    _require_admin(request)

    question = get_object_or_404(Question, id=question_id)

    if request.method == 'PUT':
        data = request.data
        if 'topic_id' in data:
            question.topic = get_object_or_404(Topic, id=data['topic_id'])
        if 'question_text' in data:
            question.question_text = data['question_text']
        if 'question_solution' in data:
            question.question_solution = data['question_solution']
        if 'choice_a' in data:
            question.choice_a = data['choice_a']
        if 'choice_b' in data:
            question.choice_b = data['choice_b']
        if 'choice_c' in data:
            question.choice_c = data['choice_c']
        if 'choice_d' in data:
            question.choice_d = data['choice_d']
        if 'correct_answer' in data:
            question.correct_answer = data['correct_answer']
        if 'grade_level' in data:
            question.grade_level = data['grade_level']
        if 'difficulty' in data:
            question.difficulty = data['difficulty']
        if 'source' in data:
            question.source = data['source']
        if 'is_word_problem' in data:
            question.is_word_problem = data['is_word_problem']
        if 'is_verified' in data:
            question.is_verified = data['is_verified']
        question.save()
        return Response({"message": "Question updated"})

    # DELETE
    question.delete()
    return Response({"message": "Question deleted"}, status=status.HTTP_200_OK)


@api_view(['POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_topic_detail(request, topic_id=None):
    """Create (POST), update (PUT), or delete (DELETE) a topic."""
    _require_admin(request)

    if request.method == 'POST':
        data = request.data
        topic = Topic.objects.create(
            name=data.get('name'),
            grade_level_min=data.get('grade_level_min', 1),
            grade_level_max=data.get('grade_level_max', 10),
            description=data.get('description', ''),
        )
        return Response({"id": topic.id, "message": "Topic created"}, status=status.HTTP_201_CREATED)

    topic = get_object_or_404(Topic, id=topic_id)

    if request.method == 'PUT':
        data = request.data
        if 'name' in data:
            topic.name = data['name']
        if 'grade_level_min' in data:
            topic.grade_level_min = data['grade_level_min']
        if 'grade_level_max' in data:
            topic.grade_level_max = data['grade_level_max']
        if 'description' in data:
            topic.description = data['description']
        topic.save()
        return Response({"message": "Topic updated"})

    topic.delete()
    return Response({"message": "Topic deleted"}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Admin — Change Request Management
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_change_requests_list(request):
    """List all change requests, optionally filtered by status."""
    _require_admin(request)

    qs = QuestionChangeRequest.objects.select_related(
        'submitted_by', 'reviewed_by', 'question'
    ).all()

    status_filter = request.query_params.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    data = [{
        "id": cr.id,
        "change_type": cr.change_type,
        "proposed_data": cr.proposed_data,
        "submitted_by": cr.submitted_by.username,
        "submitted_by_id": cr.submitted_by.id,
        "status": cr.status,
        "reviewed_by": cr.reviewed_by.username if cr.reviewed_by else None,
        "reviewed_at": cr.reviewed_at.isoformat() if cr.reviewed_at else None,
        "review_notes": cr.review_notes,
        "question_id": cr.question_id,
        "created_at": cr.created_at.isoformat(),
    } for cr in qs]

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_change_request_review(request, request_id):
    """Approve or reject a change request."""
    _require_admin(request)

    change_request = get_object_or_404(QuestionChangeRequest, id=request_id)

    if change_request.status != 'pending':
        return Response({
            "error": f"This request has already been {change_request.status}."
        }, status=status.HTTP_400_BAD_REQUEST)

    action = request.data.get('action')  # 'approve' or 'reject'
    review_notes = request.data.get('review_notes', '')

    if action not in ('approve', 'reject'):
        return Response({"error": "action must be 'approve' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)

    if action == 'approve':
        try:
            _apply_change_request(change_request)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    change_request.status = 'approved' if action == 'approve' else 'rejected'
    change_request.reviewed_by = request.user
    change_request.reviewed_at = timezone.now()
    change_request.review_notes = review_notes
    change_request.save()

    return Response({
        "message": f"Change request {change_request.status}.",
        "request_id": change_request.id,
        "status": change_request.status,
    })


def _apply_change_request(change_request):
    """Apply the approved change request to the Question table."""
    data = change_request.proposed_data

    if change_request.change_type == 'add':
        topic = get_object_or_404(Topic, id=data.get('topic_id'))
        question = Question.objects.create(
            topic=topic,
            question_text=data.get('question_text', ''),
            question_solution=data.get('question_solution', ''),
            choice_a=data.get('choice_a'),
            choice_b=data.get('choice_b'),
            choice_c=data.get('choice_c'),
            choice_d=data.get('choice_d'),
            correct_answer=data.get('correct_answer', ''),
            grade_level=data.get('grade_level', 1),
            difficulty=data.get('difficulty', 1.0),
            source='seed',
            is_word_problem=data.get('is_word_problem', True),
            is_verified=False,
        )
        change_request.question = question

    elif change_request.change_type == 'edit':
        question = change_request.question
        if not question:
            raise ValueError("Cannot edit: the original question no longer exists.")
        if 'question_text' in data:
            question.question_text = data['question_text']
        if 'question_solution' in data:
            question.question_solution = data['question_solution']
        if 'choice_a' in data:
            question.choice_a = data['choice_a']
        if 'choice_b' in data:
            question.choice_b = data['choice_b']
        if 'choice_c' in data:
            question.choice_c = data['choice_c']
        if 'choice_d' in data:
            question.choice_d = data['choice_d']
        if 'correct_answer' in data:
            question.correct_answer = data['correct_answer']
        if 'grade_level' in data:
            question.grade_level = data['grade_level']
        if 'difficulty' in data:
            question.difficulty = data['difficulty']
        if 'is_word_problem' in data:
            question.is_word_problem = data['is_word_problem']
        question.save()

    elif change_request.change_type == 'delete':
        question = change_request.question
        if not question:
            raise ValueError("Cannot delete: the question no longer exists.")
        question.delete()

    else:
        raise ValueError(f"Unknown change type: {change_request.change_type}")


# ---------------------------------------------------------------------------
# Admin — Verification Toggle
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_toggle_verification(request, question_id):
    """Toggle the is_verified flag on a question (admin)."""
    _require_admin(request)

    question = get_object_or_404(Question, id=question_id)
    question.is_verified = not question.is_verified
    question.save()

    return Response({
        "id": question.id,
        "is_verified": question.is_verified,
        "message": f"Question verification set to {question.is_verified}.",
    })


# ===========================================================================
# INSTRUCTOR ENDPOINTS — instructors & admins only
# ===========================================================================


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def instructor_questions_list(request):
    """
    List questions or create a change request (instructor).
    GET:  List questions (filters: ?topic_id=&grade_level=)
    POST: Submit a change request to add a new question
    """
    _require_instructor(request)

    if request.method == 'POST':
        data = request.data
        change_request = QuestionChangeRequest.objects.create(
            change_type='add',
            proposed_data={
                'topic_id': data.get('topic_id'),
                'question_text': data.get('question_text', ''),
                'question_solution': data.get('question_solution', ''),
                'choice_a': data.get('choice_a'),
                'choice_b': data.get('choice_b'),
                'choice_c': data.get('choice_c'),
                'choice_d': data.get('choice_d'),
                'correct_answer': data.get('correct_answer', ''),
                'grade_level': data.get('grade_level', 1),
                'difficulty': data.get('difficulty', 1.0),
                'is_word_problem': data.get('is_word_problem', True),
            },
            submitted_by=request.user,
        )
        return Response({
            "request_id": change_request.id,
            "message": "Question addition request submitted for admin review.",
        }, status=status.HTTP_201_CREATED)

    # GET - list questions
    qs = Question.objects.select_related('topic').all().order_by('id')

    topic_id = request.query_params.get('topic_id')
    grade_level = request.query_params.get('grade_level')

    if topic_id:
        qs = qs.filter(topic_id=topic_id)
    if grade_level:
        qs = qs.filter(grade_level=grade_level)

    data = [{
        "id": q.id,
        "topic_id": q.topic_id,
        "topic_name": q.topic.name,
        "question_text": q.question_text,
        "question_solution": q.question_solution,
        "choice_a": q.choice_a,
        "choice_b": q.choice_b,
        "choice_c": q.choice_c,
        "choice_d": q.choice_d,
        "correct_answer": q.correct_answer,
        "grade_level": q.grade_level,
        "difficulty": q.difficulty,
        "source": q.source,
        "is_word_problem": q.is_word_problem,
        "is_verified": q.is_verified,
    } for q in qs]

    return Response(data)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def instructor_question_detail(request, question_id):
    """
    Update (PUT) or delete (DELETE) a question (instructor).
    
    Instead of applying changes directly, this creates a QuestionChangeRequest
    that an admin must approve.
    """
    _require_instructor(request)

    question = get_object_or_404(Question, id=question_id)

    if request.method == 'PUT':
        data = request.data
        # Build proposed changes (only include what's being changed)
        proposed_data = {}
        for field in ['question_text', 'question_solution', 'choice_a', 'choice_b',
                       'choice_c', 'choice_d', 'correct_answer', 'grade_level',
                       'difficulty', 'is_word_problem', 'topic_id']:
            if field in data:
                proposed_data[field] = data[field]
        proposed_data['id'] = question_id

        change_request = QuestionChangeRequest.objects.create(
            question=question,
            change_type='edit',
            proposed_data=proposed_data,
            submitted_by=request.user,
        )
        return Response({
            "request_id": change_request.id,
            "message": "Question edit request submitted for admin review.",
        })

    # DELETE
    change_request = QuestionChangeRequest.objects.create(
        question=question,
        change_type='delete',
        proposed_data={"id": question_id},
        submitted_by=request.user,
    )
    return Response({
        "request_id": change_request.id,
        "message": "Question deletion request submitted for admin review.",
    }, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Instructor — View their own change requests
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_my_change_requests(request):
    """List the current user's own change requests."""
    _require_instructor(request)

    qs = QuestionChangeRequest.objects.filter(
        submitted_by=request.user
    ).select_related('question', 'reviewed_by')

    data = [{
        "id": cr.id,
        "change_type": cr.change_type,
        "proposed_data": cr.proposed_data,
        "status": cr.status,
        "reviewed_by": cr.reviewed_by.username if cr.reviewed_by else None,
        "reviewed_at": cr.reviewed_at.isoformat() if cr.reviewed_at else None,
        "review_notes": cr.review_notes,
        "question_id": cr.question_id,
        "created_at": cr.created_at.isoformat(),
    } for cr in qs]

    return Response(data)


# ---------------------------------------------------------------------------
# Instructor — Verification Toggle
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def instructor_toggle_verification(request, question_id):
    """Toggle the is_verified flag on a question (instructor/admin)."""
    _require_instructor(request)

    question = get_object_or_404(Question, id=question_id)
    question.is_verified = not question.is_verified
    question.save()

    return Response({
        "id": question.id,
        "is_verified": question.is_verified,
        "message": f"Question verification set to {question.is_verified}.",
    })


# ---------------------------------------------------------------------------
# Admin — Pending Requests Count (for badge/notification)
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_pending_count(request):
    """Return the count of pending change requests."""
    _require_admin(request)

    count = QuestionChangeRequest.objects.filter(status='pending').count()

    return Response({"pending_count": count})