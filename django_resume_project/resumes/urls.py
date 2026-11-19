from django.urls import path

from . import views

app_name = "resumes"

urlpatterns = [
    path("", views.dashboard_view, name="dashboard"),
    path("register/", views.register_view, name="register"),
    path("resumes/create/", views.resume_create_view, name="resume_create"),
    path("resumes/<int:pk>/edit/", views.resume_edit_view, name="resume_edit"),
    path("resumes/<int:pk>/preview/", views.resume_preview_view, name="resume_preview"),
    path("resumes/<int:pk>/pdf/", views.resume_pdf_view, name="resume_pdf"),
    path("resumes/<int:pk>/duplicate/", views.resume_duplicate_view, name="resume_duplicate"),
    path("resumes/<int:pk>/delete/", views.resume_delete_view, name="resume_delete"),
]
