from django.urls import path
from . import views

urlpatterns = [

    path('<int:topic_id>/', views.playthrough_view, name='playthrough'),
    path('playthrough/quit/', views.quit_playthrough_view, name='quit_playthrough'),
]