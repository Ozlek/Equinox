from django.urls import path
from . import views

urlpatterns = [

    path('', views.topic_list_api, name='topic_list'),
    
    path('<int:topic_id>/', views.topic_detail_api, name='topic_detail'),

]