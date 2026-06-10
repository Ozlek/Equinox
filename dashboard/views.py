from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_api_view(request):
    """
    Delivers structural profile properties to populate the React Dashboard view.
    """
    user = request.user
    
    # Pack basic user info to customize the dashboard greeting
    data = {
        "username": user.username,
        "first_name": user.first_name if user.first_name else user.username,
        "email": user.email,
        "date_joined": user.date_joined.strftime("%B %Y"),
    }
    
    return Response(data)
