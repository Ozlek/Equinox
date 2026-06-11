from django.urls import path
from . import views

urlpatterns = [

    path('', views.progress_history_api, name='progress_history'),
    path('achievements/', views.user_achievements_api, name='user_achievements'),

]