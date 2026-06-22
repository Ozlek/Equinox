from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.contrib.auth import login, logout, authenticate
from django.views.decorators.csrf import csrf_exempt
from .forms import RegisterForm
from .models import UserProfile

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
        login(request, user) 
        return Response({
            "authenticated": True,
            "username": user.username,
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
            "needs_onboarding": profile is None or not profile.has_completed_onboarding
        })
    return Response({"authenticated": False})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
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
