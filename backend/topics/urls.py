from django.urls import path
from . import views

urlpatterns = [

    path('', views.topic_list_api, name='topic_list'),
    
    path('<int:topic_id>/', views.topic_detail_api, name='topic_detail'),
    
    path('<int:topic_id>/lessons/', views.topic_lessons_api, name='topic_lessons'),

    path('all/', views.all_topics_api, name='all_topics'),

]
