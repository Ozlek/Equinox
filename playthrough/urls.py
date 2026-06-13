from django.urls import path
from . import views

urlpatterns = [

    path('<int:topic_id>/', views.playthrough_api_view, name='playthrough'),
    path('quit/', views.quit_playthrough_api_view, name='quit_playthrough'),
    path('check_active/', views.check_active_session_api, name='check_playthrough_session'),
]