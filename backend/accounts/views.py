from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.views.decorators.csrf import csrf_exempt
from .forms import RegisterForm
from .models import UserProfile

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@csrf_exempt
def login_api(request):
    """
    Authenticate user and create session.
    """
    form = AuthenticationForm(data=request.data)
    if form.is_valid():
        user = form.get_user()
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
        "errors": form.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@csrf_exempt
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
    if not grade_level or not (1 <= int(grade_level) <= 10):
        return Response({"error": "Invalid grade level."}, status=status.HTTP_400_BAD_REQUEST)
 
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.grade_level = int(grade_level)
    profile.has_completed_onboarding = True
    profile.save()
 
    return Response({"success": True})