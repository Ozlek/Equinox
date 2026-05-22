from django.urls import path
from . import views

urlpatterns = [

    path('', views.topic_list, name='topic_list'),
    
    path('<int:topic_id>/', views.topic_detail, name='topic_detail'),

]