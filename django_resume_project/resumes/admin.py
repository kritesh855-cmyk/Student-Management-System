from django.contrib import admin

from .models import (
    Certification,
    Education,
    Experience,
    Project,
    Resume,
    Skill,
)


class EducationInline(admin.TabularInline):
    model = Education
    extra = 1


class ExperienceInline(admin.TabularInline):
    model = Experience
    extra = 1


class ProjectInline(admin.TabularInline):
    model = Project
    extra = 1


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 1


class CertificationInline(admin.TabularInline):
    model = Certification
    extra = 1


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("title", "full_name", "owner", "template_choice", "updated_at")
    list_filter = ("template_choice", "updated_at")
    search_fields = ("title", "full_name", "email", "owner__username")
    inlines = [
        EducationInline,
        ExperienceInline,
        ProjectInline,
        SkillInline,
        CertificationInline,
    ]
