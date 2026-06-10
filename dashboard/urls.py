from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard_api_view, name='dashboard'),
]