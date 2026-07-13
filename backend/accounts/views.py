from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.contrib.auth import login, logout, authenticate
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .forms import RegisterForm, InstructorRegisterForm
from .models import UserProfile
from playthrough.models import (
    Question, Topic, QuestionChangeRequest, Lesson, LessonChangeRequest,
    QuestionTemplate, TemplateChangeRequest
)
from topics.models import Topic as TopicModel


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


def _check_instructor_scope(profile, topic_id, grade_level):
    """
    Validate that an instructor can access a given topic/grade.
    Returns (is_valid, error_message) tuple.
    """
    if profile.user_type != 'instructor':
        return True, None  # Admins have full access
    
    # Check topic assignment
    if profile.assigned_topics.exists():
        if topic_id not in profile.assigned_topics.values_list('id', flat=True):
            return False, "You are not assigned to this topic."
    
    # Check grade level range
    if profile.grade_level_min and grade_level < profile.grade_level_min:
        return False, f"Grade level must be at least {profile.grade_level_min}."
    if profile.grade_level_max and grade_level > profile.grade_level_max:
        return False, f"Grade level must be at most {profile.grade_level_max}."
    
    return True, None


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

        # Instructors don't need student onboarding
        needs_onboarding = False
        if profile:
            if profile.user_type == 'instructor':
                needs_onboarding = False
            else:
                needs_onboarding = not profile.has_completed_onboarding
        else:
            needs_onboarding = True

        return Response({
            "authenticated": True,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "user_type": profile.user_type if profile else 'student',
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "needs_onboarding": needs_onboarding,
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
        # Instructors don't need student onboarding
        needs_onboarding = False
        if profile:
            if profile.user_type == 'instructor':
                needs_onboarding = False
            else:
                needs_onboarding = not profile.has_completed_onboarding
        else:
            needs_onboarding = True
        return Response({
            "authenticated": True,
            "username": request.user.username,
            "email": request.user.email or None,
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
            "user_type": profile.user_type if profile else 'student',
            "date_joined": request.user.date_joined.isoformat() if request.user.date_joined else None,
            "needs_onboarding": needs_onboarding
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
            "is_visible": topic.is_visible,
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
        profile = getattr(request.user, 'profile', None)
        
        # Validate scope for instructors
        if profile and profile.user_type == 'instructor':
            is_valid, error_msg = _check_instructor_scope(
                profile, 
                data.get('topic_id'), 
                data.get('grade_level', 1)
            )
            if not is_valid:
                return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
        
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

    # Filter by instructor's assigned scope
    profile = getattr(request.user, 'profile', None)
    if profile and profile.user_type == 'instructor':
        if profile.assigned_topics.exists():
            qs = qs.filter(topic__in=profile.assigned_topics.all())
        if profile.grade_level_min:
            qs = qs.filter(grade_level__gte=profile.grade_level_min)
        if profile.grade_level_max:
            qs = qs.filter(grade_level__lte=profile.grade_level_max)

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
    profile = getattr(request.user, 'profile', None)

    # Validate scope for instructors
    if profile and profile.user_type == 'instructor':
        is_valid, error_msg = _check_instructor_scope(
            profile,
            question.topic_id,
            question.grade_level
        )
        if not is_valid:
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_lesson_pending_count(request):
    """Return the count of pending lesson change requests."""
    _require_admin(request)

    count = LessonChangeRequest.objects.filter(status='pending').count()

    return Response({"lesson_pending_count": count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_toggle_topic_visibility(request, topic_id):
    """Toggle the is_visible field on a topic (admin)."""
    _require_admin(request)

    topic = get_object_or_404(Topic, id=topic_id)
    topic.is_visible = not topic.is_visible
    topic.save()

    return Response({
        "id": topic.id,
        "name": topic.name,
        "is_visible": topic.is_visible,
        "message": f"Topic visibility set to {topic.is_visible}.",
    })


# ===========================================================================
# LESSON MANAGEMENT ENDPOINTS
# ===========================================================================

# ---------------------------------------------------------------------------
# Admin — Direct Lesson CRUD
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_lessons_list(request):
    """
    List lessons or create a new lesson (admin, direct).
    GET:  List lessons with optional filters: ?topic_id=&grade_level=
    POST: Create a new lesson directly (bypasses approval system)
    """
    _require_admin(request)

    if request.method == 'POST':
        data = request.data
        topic = get_object_or_404(Topic, id=data.get('topic_id'))
        lesson = Lesson.objects.create(
            topic=topic,
            title=data.get('title', ''),
            grade_level=data.get('grade_level', 1),
            order=data.get('order', 0),
            objectives=data.get('objectives', []),
            example=data.get('example', ''),
            tip=data.get('tip', ''),
        )
        return Response({"id": lesson.id, "message": "Lesson created"}, status=status.HTTP_201_CREATED)

    qs = Lesson.objects.select_related('topic').all().order_by('topic__name', 'grade_level', 'order')

    topic_id = request.query_params.get('topic_id')
    grade_level = request.query_params.get('grade_level')

    if topic_id:
        qs = qs.filter(topic_id=topic_id)
    if grade_level:
        qs = qs.filter(grade_level=grade_level)

    data = [{
        "id": l.id,
        "topic_id": l.topic_id,
        "topic_name": l.topic.name,
        "title": l.title,
        "grade_level": l.grade_level,
        "order": l.order,
        "objectives": l.objectives,
        "example": l.example,
        "tip": l.tip,
    } for l in qs]

    return Response(data)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_lesson_detail(request, lesson_id):
    """Update (PUT) or delete (DELETE) a lesson (admin, direct)."""
    _require_admin(request)

    lesson = get_object_or_404(Lesson, id=lesson_id)

    if request.method == 'PUT':
        data = request.data
        if 'topic_id' in data:
            lesson.topic = get_object_or_404(Topic, id=data['topic_id'])
        if 'title' in data:
            lesson.title = data['title']
        if 'grade_level' in data:
            lesson.grade_level = data['grade_level']
        if 'order' in data:
            lesson.order = data['order']
        if 'objectives' in data:
            lesson.objectives = data['objectives']
        if 'example' in data:
            lesson.example = data['example']
        if 'tip' in data:
            lesson.tip = data['tip']
        lesson.save()
        return Response({"message": "Lesson updated"})

    # DELETE
    lesson.delete()
    return Response({"message": "Lesson deleted"}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Admin — Lesson Change Request Management
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_lesson_change_requests_list(request):
    """List all lesson change requests, optionally filtered by status."""
    _require_admin(request)

    qs = LessonChangeRequest.objects.select_related(
        'submitted_by', 'reviewed_by', 'lesson'
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
        "lesson_id": cr.lesson_id,
        "created_at": cr.created_at.isoformat(),
    } for cr in qs]

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_lesson_change_request_review(request, request_id):
    """Approve or reject a lesson change request."""
    _require_admin(request)

    change_request = get_object_or_404(LessonChangeRequest, id=request_id)

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
            _apply_lesson_change_request(change_request)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    change_request.status = 'approved' if action == 'approve' else 'rejected'
    change_request.reviewed_by = request.user
    change_request.reviewed_at = timezone.now()
    change_request.review_notes = review_notes
    change_request.save()

    return Response({
        "message": f"Lesson change request {change_request.status}.",
        "request_id": change_request.id,
        "status": change_request.status,
    })


def _apply_lesson_change_request(change_request):
    """Apply the approved change request to the Lesson table."""
    data = change_request.proposed_data

    if change_request.change_type == 'add':
        topic = get_object_or_404(Topic, id=data.get('topic_id'))
        lesson = Lesson.objects.create(
            topic=topic,
            title=data.get('title', ''),
            grade_level=data.get('grade_level', 1),
            order=data.get('order', 0),
            objectives=data.get('objectives', []),
            example=data.get('example', ''),
            tip=data.get('tip', ''),
        )
        change_request.lesson = lesson

    elif change_request.change_type == 'edit':
        lesson = change_request.lesson
        if not lesson:
            raise ValueError("Cannot edit: the original lesson no longer exists.")
        if 'topic_id' in data:
            lesson.topic = get_object_or_404(Topic, id=data['topic_id'])
        if 'title' in data:
            lesson.title = data['title']
        if 'grade_level' in data:
            lesson.grade_level = data['grade_level']
        if 'order' in data:
            lesson.order = data['order']
        if 'objectives' in data:
            lesson.objectives = data['objectives']
        if 'example' in data:
            lesson.example = data['example']
        if 'tip' in data:
            lesson.tip = data['tip']
        lesson.save()

    elif change_request.change_type == 'delete':
        lesson = change_request.lesson
        if not lesson:
            raise ValueError("Cannot delete: the lesson no longer exists.")
        lesson.delete()

    else:
        raise ValueError(f"Unknown change type: {change_request.change_type}")


# ---------------------------------------------------------------------------
# Instructor — Lesson Change Requests
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def instructor_lessons_list(request):
    """
    List lessons or create a change request (instructor).
    GET:  List lessons (filters: ?topic_id=&grade_level=)
    POST: Submit a change request to add a new lesson
    """
    _require_instructor(request)

    if request.method == 'POST':
        data = request.data
        profile = getattr(request.user, 'profile', None)
        
        # Validate scope for instructors
        if profile and profile.user_type == 'instructor':
            is_valid, error_msg = _check_instructor_scope(
                profile,
                data.get('topic_id'),
                data.get('grade_level', 1)
            )
            if not is_valid:
                return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
        
        change_request = LessonChangeRequest.objects.create(
            change_type='add',
            proposed_data={
                'topic_id': data.get('topic_id'),
                'title': data.get('title', ''),
                'grade_level': data.get('grade_level', 1),
                'order': data.get('order', 0),
                'objectives': data.get('objectives', []),
                'example': data.get('example', ''),
                'tip': data.get('tip', ''),
            },
            submitted_by=request.user,
        )
        return Response({
            "request_id": change_request.id,
            "message": "Lesson addition request submitted for admin review.",
        }, status=status.HTTP_201_CREATED)

    # GET - list lessons
    qs = Lesson.objects.select_related('topic').all().order_by('topic__name', 'grade_level', 'order')

    # Filter by instructor's assigned scope
    profile = getattr(request.user, 'profile', None)
    if profile and profile.user_type == 'instructor':
        if profile.assigned_topics.exists():
            qs = qs.filter(topic__in=profile.assigned_topics.all())
        if profile.grade_level_min:
            qs = qs.filter(grade_level__gte=profile.grade_level_min)
        if profile.grade_level_max:
            qs = qs.filter(grade_level__lte=profile.grade_level_max)

    topic_id = request.query_params.get('topic_id')
    grade_level = request.query_params.get('grade_level')

    if topic_id:
        qs = qs.filter(topic_id=topic_id)
    if grade_level:
        qs = qs.filter(grade_level=grade_level)

    data = [{
        "id": l.id,
        "topic_id": l.topic_id,
        "topic_name": l.topic.name,
        "title": l.title,
        "grade_level": l.grade_level,
        "order": l.order,
        "objectives": l.objectives,
        "example": l.example,
        "tip": l.tip,
    } for l in qs]

    return Response(data)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def instructor_lesson_detail(request, lesson_id):
    """
    Update (PUT) or delete (DELETE) a lesson (instructor).
    
    Instead of applying changes directly, this creates a LessonChangeRequest
    that an admin must approve.
    """
    _require_instructor(request)

    lesson = get_object_or_404(Lesson, id=lesson_id)
    profile = getattr(request.user, 'profile', None)

    # Validate scope for instructors
    if profile and profile.user_type == 'instructor':
        is_valid, error_msg = _check_instructor_scope(
            profile,
            lesson.topic_id,
            lesson.grade_level
        )
        if not is_valid:
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'PUT':
        data = request.data
        # Build proposed changes (only include what's being changed)
        proposed_data = {}
        for field in ['title', 'grade_level', 'order', 'objectives', 'example', 'tip', 'topic_id']:
            if field in data:
                proposed_data[field] = data[field]
        proposed_data['id'] = lesson_id

        change_request = LessonChangeRequest.objects.create(
            lesson=lesson,
            change_type='edit',
            proposed_data=proposed_data,
            submitted_by=request.user,
        )
        return Response({
            "request_id": change_request.id,
            "message": "Lesson edit request submitted for admin review.",
        })

    # DELETE
    change_request = LessonChangeRequest.objects.create(
        lesson=lesson,
        change_type='delete',
        proposed_data={"id": lesson_id},
        submitted_by=request.user,
    )
    return Response({
        "request_id": change_request.id,
        "message": "Lesson deletion request submitted for admin review.",
    }, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Instructor Registration (separate endpoint)
# ---------------------------------------------------------------------------

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def instructor_register_api(request):
    """
    Register a new instructor account with assignment fields:
    - grade_level_min / grade_level_max
    - assigned_topics (list of topic IDs)
    - instructional_scope
    """
    from topics.models import Topic as TopicModel

    # Convert DRF data to mutable format for Django form compatibility
    data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
    # Ensure integer fields are strings for Django form validation
    if 'grade_level_min' in data:
        data['grade_level_min'] = str(data['grade_level_min'])
    if 'grade_level_max' in data:
        data['grade_level_max'] = str(data['grade_level_max'])

    form = InstructorRegisterForm(data)
    if not form.is_valid():
        return Response({
            "authenticated": False,
            "errors": form.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    user = form.save()
    user.is_staff = True
    user.save()

    # Update profile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.user_type = 'instructor'
    profile.grade_level_min = form.cleaned_data.get('grade_level_min')
    profile.grade_level_max = form.cleaned_data.get('grade_level_max')
    profile.instructional_scope = form.cleaned_data.get('instructional_scope', '')
    profile.has_completed_onboarding = True  # Instructors don't need student onboarding

    # Assign topics
    topic_ids = request.data.get('assigned_topics', [])
    if topic_ids:
        topics = TopicModel.objects.filter(id__in=topic_ids)
        profile.assigned_topics.set(topics)

    profile.save()

    login(request, user)
    return Response({
        "authenticated": True,
        "username": user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "user_type": 'instructor',
        "message": "Instructor registration successful"
    }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Instructor Profile (view assignments)
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_profile_api(request):
    """Get the current instructor's assignment data."""
    profile = getattr(request.user, 'profile', None)
    if not profile or profile.user_type not in ('instructor', 'admin'):
        return Response({"error": "Not an instructor account."}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        "grade_level_min": profile.grade_level_min,
        "grade_level_max": profile.grade_level_max,
        "instructional_scope": profile.instructional_scope,
        "assigned_topics": list(profile.assigned_topics.values('id', 'name')),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_my_lesson_change_requests(request):
    """List the current user's own lesson change requests."""
    _require_instructor(request)

    qs = LessonChangeRequest.objects.filter(
        submitted_by=request.user
    ).select_related('lesson', 'reviewed_by')

    data = [{
        "id": cr.id,
        "change_type": cr.change_type,
        "proposed_data": cr.proposed_data,
        "status": cr.status,
        "reviewed_by": cr.reviewed_by.username if cr.reviewed_by else None,
        "reviewed_at": cr.reviewed_at.isoformat() if cr.reviewed_at else None,
        "review_notes": cr.review_notes,
        "lesson_id": cr.lesson_id,
        "created_at": cr.created_at.isoformat(),
    } for cr in qs]

    return Response(data)


# ===========================================================================
# TEMPLATE MANAGEMENT ENDPOINTS
# ===========================================================================

# ---------------------------------------------------------------------------
# Instructor — List & Verify Templates
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_templates_list(request):
    """
    List all question templates with their verification status and sample data.
    Each template includes a pre-rendered sample question + solution + answer.
    """
    _require_instructor(request)

    from django.db.models import Count

    qs = QuestionTemplate.objects.all().order_by('domain', 'template_id')

    # Generate a sample for each template by calling the generator
    from playthrough.question_generator import EquinoxQuestionGenerator
    gen = EquinoxQuestionGenerator()

    data = []
    for template in qs:
        sample_question = None
        sample_solution = None
        sample_answer = None

        # Try to generate a sample if the template is implemented
        if template.is_implemented:
            try:
                # Find the domain and template index
                domain_funcs = gen.registry.get(template.domain, [])
                for idx, func in enumerate(domain_funcs):
                    sample = func()
                    if sample["id"] == template.template_id:
                        sample_question = sample["question"]
                        sample_solution = sample.get("solution", "")
                        sample_answer = sample["answer"]
                        break
            except Exception:
                pass

        # Count how many questions use this template
        instance_count = Question.objects.filter(template_id=template.template_id).count()

        data.append({
            "id": template.id,
            "template_id": template.template_id,
            "domain": template.domain,
            "display_name": template.display_name,
            "template_text": template.template_text,
            "solution_template": template.solution_template,
            "base_difficulty": template.base_difficulty,
            "is_word_problem": template.is_word_problem,
            "is_verified": template.is_verified,
            "is_implemented": template.is_implemented,
            "is_active": template.is_active,
            "verified_by": template.verified_by.username if template.verified_by else None,
            "verified_at": template.verified_at.isoformat() if template.verified_at else None,
            "instance_count": instance_count,
            "sample_question": sample_question,
            "sample_solution": sample_solution,
            "sample_answer": sample_answer,
        })

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def instructor_toggle_template_verification(request, template_id):
    """
    Toggle the is_verified flag on a QuestionTemplate.
    Also cascades to all Questions linked to this template.
    """
    _require_instructor(request)

    template = get_object_or_404(QuestionTemplate, template_id=template_id)
    template.is_verified = not template.is_verified
    template.verified_by = request.user if template.is_verified else None
    template.verified_at = timezone.now() if template.is_verified else None
    template.save()

    # Cascade to all questions with this template_id
    Question.objects.filter(template_id=template_id).update(
        is_verified=template.is_verified
    )

    return Response({
        "template_id": template.template_id,
        "is_verified": template.is_verified,
        "message": f"Template '{template.template_id}' verification set to {template.is_verified}. "
                   f"All {Question.objects.filter(template_id=template_id).count()} linked questions updated.",
    })


# ---------------------------------------------------------------------------
# Instructor — Template Change Requests
# ---------------------------------------------------------------------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def instructor_template_change_requests(request):
    """
    GET:  List the current user's own template change requests.
    POST: Submit a new template change request (add/edit/delete).
    """
    _require_instructor(request)

    if request.method == 'POST':
        data = request.data
        change_type = data.get('change_type')
        
        if change_type not in ('add', 'edit', 'delete'):
            return Response({"error": "change_type must be 'add', 'edit', or 'delete'"},
                            status=status.HTTP_400_BAD_REQUEST)

        proposed_data = data.get('proposed_data', {})

        # For edit/delete, validate template exists
        template = None
        if change_type in ('edit', 'delete'):
            tid = proposed_data.get('template_id') or data.get('template_id')
            if tid:
                template = QuestionTemplate.objects.filter(template_id=tid).first()

        change_request = TemplateChangeRequest.objects.create(
            template=template,
            change_type=change_type,
            proposed_data=proposed_data,
            submitted_by=request.user,
        )

        return Response({
            "request_id": change_request.id,
            "message": f"Template {change_type} request submitted for admin review.",
        }, status=status.HTTP_201_CREATED)

    # GET - list user's own template change requests
    qs = TemplateChangeRequest.objects.filter(
        submitted_by=request.user
    ).select_related('template', 'reviewed_by')

    data = [{
        "id": cr.id,
        "change_type": cr.change_type,
        "proposed_data": cr.proposed_data,
        "status": cr.status,
        "reviewed_by": cr.reviewed_by.username if cr.reviewed_by else None,
        "reviewed_at": cr.reviewed_at.isoformat() if cr.reviewed_at else None,
        "review_notes": cr.review_notes,
        "template_id": cr.template.template_id if cr.template else None,
        "created_at": cr.created_at.isoformat(),
    } for cr in qs]

    return Response(data)


# ---------------------------------------------------------------------------
# Admin — Template Change Request Management
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_template_change_requests_list(request):
    """List all template change requests, optionally filtered by status."""
    _require_admin(request)

    qs = TemplateChangeRequest.objects.select_related(
        'submitted_by', 'reviewed_by', 'template'
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
        "template_id": cr.template.template_id if cr.template else None,
        "created_at": cr.created_at.isoformat(),
    } for cr in qs]

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_template_change_request_review(request, request_id):
    """Approve or reject a template change request."""
    _require_admin(request)

    change_request = get_object_or_404(TemplateChangeRequest, id=request_id)

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
            _apply_template_change_request(change_request)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    change_request.status = 'approved' if action == 'approve' else 'rejected'
    change_request.reviewed_by = request.user
    change_request.reviewed_at = timezone.now()
    change_request.review_notes = review_notes
    change_request.save()

    return Response({
        "message": f"Template change request {change_request.status}.",
        "request_id": change_request.id,
        "status": change_request.status,
    })


def _apply_template_change_request(change_request):
    """Apply the approved template change request to the QuestionTemplate table."""
    data = change_request.proposed_data

    if change_request.change_type == 'add':
        # Create a new template record (is_implemented=False — needs developer)
        QuestionTemplate.objects.create(
            template_id=data.get('template_id', ''),
            domain=data.get('domain', 'Arithmetic'),
            display_name=data.get('display_name', ''),
            template_text=data.get('template_text', ''),
            solution_template=data.get('solution_template', ''),
            base_difficulty=data.get('base_difficulty', 'Novice'),
            is_word_problem=data.get('is_word_problem', False),
            is_implemented=False,  # Developer needs to write the generator code
            is_active=True,
        )

    elif change_request.change_type == 'edit':
        template = change_request.template
        if not template:
            raise ValueError("Cannot edit: the template no longer exists.")
        if 'display_name' in data:
            template.display_name = data['display_name']
        if 'template_text' in data:
            template.template_text = data['template_text']
        if 'solution_template' in data:
            template.solution_template = data['solution_template']
        if 'base_difficulty' in data:
            template.base_difficulty = data['base_difficulty']
        if 'is_word_problem' in data:
            template.is_word_problem = data['is_word_problem']
        template.save()

    elif change_request.change_type == 'delete':
        template = change_request.template
        if not template:
            raise ValueError("Cannot delete: the template no longer exists.")
        # Soft-delete: mark as inactive instead of hard-deleting
        template.is_active = False
        template.save()

    else:
        raise ValueError(f"Unknown change type: {change_request.change_type}")


# ---------------------------------------------------------------------------
# Admin — Template Pending Count
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_template_pending_count(request):
    """Return the count of pending template change requests."""
    _require_admin(request)

    count = TemplateChangeRequest.objects.filter(status='pending').count()

    return Response({"template_pending_count": count})


# ---------------------------------------------------------------------------
# Instructor — Batch Verify Questions
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def instructor_batch_verify_questions(request):
    """
    Batch verify all questions matching the given filters.
    Body: { "topic_id": 1, "grade_level": 7, "source": "train" }
    All parameters are optional — omitting a filter means "all".
    """
    _require_instructor(request)

    data = request.data
    qs = Question.objects.all()

    if data.get('topic_id'):
        qs = qs.filter(topic_id=data['topic_id'])
    if data.get('grade_level'):
        qs = qs.filter(grade_level=data['grade_level'])
    if data.get('source'):
        qs = qs.filter(source=data['source'])

    count = qs.update(is_verified=True)

    return Response({
        "message": f"Verified {count} questions.",
        "count": count,
    })
