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

    # ── Admin endpoints ──
    path('admin/users/', views.admin_users_list, name='admin_users_list'),
    path('admin/topics/', views.admin_topics_list, name='admin_topics_list'),
    path('admin/topics/<int:topic_id>/', views.admin_topic_detail, name='admin_topic_detail'),
    path('admin/questions/', views.admin_questions_list, name='admin_questions_list'),
    path('admin/questions/<int:question_id>/', views.admin_question_detail, name='admin_question_detail'),

    # ── Instructor endpoints ──
    path('instructor/questions/', views.instructor_questions_list, name='instructor_questions_list'),
    path('instructor/questions/<int:question_id>/', views.instructor_question_detail, name='instructor_question_detail'),
]