from django.shortcuts import render
from .models import UserProgress

# Create your views here.
def progress_history(request):

    progress = UserProgress.objects.filter(
        user=request.user
    ).order_by('-completed_at')

    return render(request, 'users_progress/progress_history.html', {
        'progress': progress
    })

