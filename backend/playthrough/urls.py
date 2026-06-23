from django.urls import path
from . import views

urlpatterns = [
    path('sessions/', views.playthrough_api_view, name='playthrough'),
    path('sessions/<int:topic_id>/', views.playthrough_api_view, name='playthrough-topic'),
    path('quit/', views.quit_playthrough_api_view, name='quit-playthrough'),
    path('check-session/', views.check_active_session_api, name='check-session'),
    path('inventory/', views.user_inventory_api_view, name='user-inventory'),
    path('topics/<int:topic_id>/resources/', views.learning_resources_api, name='learning-resources'),
]
