from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page, name='home'),

    path('about/', views.about_page, name='about'),

    path('help/', views.help_page, name='help'),

    path('contact/', views.contact_page, name='contact'),
]