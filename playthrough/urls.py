from django.urls import path
from . import views

urlpatterns = [

    path('<int:topic_id>/', views.playthrough_api_view, name='playthrough'),
    path('playthrough/quit/', views.quit_playthrough_api_view, name='quit_playthrough'),
]