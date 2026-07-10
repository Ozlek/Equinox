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
    path('admin/lessons/', views.admin_lessons_list, name='admin_lessons_list'),
    path('admin/lessons/<int:lesson_id>/', views.admin_lesson_detail, name='admin_lesson_detail'),
    path('admin/change-requests/pending-count/', views.admin_pending_count, name='admin_pending_count'),
    path('admin/lesson-change-requests/pending-count/', views.admin_lesson_pending_count, name='admin_lesson_pending_count'),
    path('admin/change-requests/', views.admin_change_requests_list, name='admin_change_requests_list'),
    path('admin/change-requests/<int:request_id>/review/', views.admin_change_request_review, name='admin_change_request_review'),
    path('admin/questions/<int:question_id>/toggle-verify/', views.admin_toggle_verification, name='admin_toggle_verification'),
    path('admin/lesson-change-requests/', views.admin_lesson_change_requests_list, name='admin_lesson_change_requests_list'),
    path('admin/lesson-change-requests/<int:request_id>/review/', views.admin_lesson_change_request_review, name='admin_lesson_change_request_review'),

    # ── Instructor endpoints ──
    path('instructor/questions/', views.instructor_questions_list, name='instructor_questions_list'),
    path('instructor/questions/<int:question_id>/', views.instructor_question_detail, name='instructor_question_detail'),
    path('instructor/my-change-requests/', views.instructor_my_change_requests, name='instructor_my_change_requests'),
    path('instructor/questions/<int:question_id>/toggle-verify/', views.instructor_toggle_verification, name='instructor_toggle_verification'),
    path('instructor/lessons/', views.instructor_lessons_list, name='instructor_lessons_list'),
    path('instructor/lessons/<int:lesson_id>/', views.instructor_lesson_detail, name='instructor_lesson_detail'),
    path('instructor/my-lesson-change-requests/', views.instructor_my_lesson_change_requests, name='instructor_my_lesson_change_requests'),
]
