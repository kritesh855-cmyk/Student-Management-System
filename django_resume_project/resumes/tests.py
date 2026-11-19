from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import Education, Experience, Project, Resume, Skill


class ResumeModelAndViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="student01",
            email="student01@college.edu",
            password="StrongPassword123!",
        )
        self.other_user = User.objects.create_user(
            username="student02",
            email="student02@college.edu",
            password="StrongPassword123!",
        )
        self.resume = Resume.objects.create(
            owner=self.user,
            title="Campus Placement 2026",
            full_name="Aarav Sharma",
            job_title="B.Tech Computer Science",
            email="aarav.sharma@college.edu",
            summary="Final-year CS student specializing in backend systems.",
            template_choice=Resume.TEMPLATE_CLASSIC,
        )
        Education.objects.create(
            resume=self.resume,
            institution="National Institute of Technology",
            degree="B.Tech",
            field_of_study="Computer Science",
            start_year="2022",
            end_year="2026",
            gpa="8.9 / 10.0",
        )
        Experience.objects.create(
            resume=self.resume,
            company="CloudScale Labs",
            role="Backend Intern",
            start_date="May 2025",
            end_date="Aug 2025",
            description="Built REST APIs in Django.\nReduced query latency by 35%.",
        )
        Project.objects.create(
            resume=self.resume,
            title="Distributed Task Queue",
            tech_stack="Python, Django, Redis",
            description="Designed worker scheduler with retry backoff.",
        )
        Skill.objects.create(
            resume=self.resume,
            category="Languages",
            items="Python, SQL, TypeScript",
        )

    def test_bullet_point_splitting(self):
        exp = self.resume.experiences.first()
        self.assertEqual(len(exp.bullet_points()), 2)

    def test_dashboard_requires_login(self):
        response = self.client.get(reverse("resumes:dashboard"))
        self.assertEqual(response.status_code, 302)

    def test_owner_can_preview_resume(self):
        self.client.login(username="student01", password="StrongPassword123!")
        response = self.client.get(
            reverse("resumes:resume_preview", args=[self.resume.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Aarav Sharma")

    def test_other_user_cannot_access_resume(self):
        self.client.login(username="student02", password="StrongPassword123!")
        response = self.client.get(
            reverse("resumes:resume_edit", args=[self.resume.pk])
        )
        self.assertEqual(response.status_code, 404)

    def test_cascade_delete_cleans_children(self):
        resume_id = self.resume.pk
        self.resume.delete()
        self.assertEqual(Education.objects.filter(resume_id=resume_id).count(), 0)
        self.assertEqual(Experience.objects.filter(resume_id=resume_id).count(), 0)
