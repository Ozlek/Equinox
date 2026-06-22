from django.urls import include, path
from . import views

urlpatterns = [
    path('register/', views.register_api, name='register'),
    path('login/', views.login_api, name='login'),
    path('logout/', views.logout_api, name='logout'),
    path('check-auth/', views.check_auth_status, name='check_auth'),
    path('onboarding/', views.onboarding_api, name='onboarding'),
    path('password/reset/', include('dj_rest_auth.urls')),
]