from django.urls import include, path
from . import views

urlpatterns = [
    path('register/', views.register_api, name='register'),
    path('login/', views.login_api, name='login'),
    path('logout/', views.logout_api, name='logout'),
    path('check-auth/', views.check_auth_status, name='check_auth'),
    path('onboarding/', views.onboarding_api, name='onboarding'),
    path('grade/', views.get_grade_api, name='get_grade'),
    path('grade/update/', views.update_grade_api, name='update_grade'),
    path('reset-achievements/', views.reset_achievements_api, name='reset_achievements'),
    path('delete-account/', views.delete_account_api, name='delete_account'),
    path('password/reset/', include('dj_rest_auth.urls')),
]
