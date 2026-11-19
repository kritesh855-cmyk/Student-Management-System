from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Resume",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(help_text="Internal label, e.g., Software Engineer Placement 2026", max_length=120)),
                ("full_name", models.CharField(max_length=120)),
                ("job_title", models.CharField(blank=True, max_length=120)),
                ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(blank=True, max_length=30)),
                ("location", models.CharField(blank=True, max_length=120)),
                ("linkedin_url", models.URLField(blank=True)),
                ("github_url", models.URLField(blank=True)),
                ("portfolio_url", models.URLField(blank=True)),
                ("summary", models.TextField(blank=True)),
                (
                    "template_choice",
                    models.CharField(
                        choices=[
                            ("classic", "Classic Academic"),
                            ("modern", "Modern Minimal"),
                            ("executive", "Executive Split"),
                        ],
                        default="classic",
                        max_length=20,
                    ),
                ),
                (
                    "accent_color",
                    models.CharField(
                        choices=[
                            ("#1E3A8A", "Deep Navy"),
                            ("#0F172A", "Charcoal Slate"),
                            ("#14532D", "Forest Ink"),
                            ("#7F1D1D", "Oxford Burgundy"),
                        ],
                        default="#1E3A8A",
                        max_length=16,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="resumes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-updated_at"]},
        ),
        migrations.CreateModel(
            name="Skill",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("category", models.CharField(help_text="e.g., Languages, Frameworks, Databases", max_length=80)),
                ("items", models.CharField(help_text="Comma-separated skills, e.g., Python, Django, PostgreSQL", max_length=255)),
                ("order", models.PositiveIntegerField(default=0)),
                ("resume", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="skills", to="resumes.resume")),
            ],
            options={"ordering": ["order", "id"]},
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=160)),
                ("tech_stack", models.CharField(blank=True, max_length=200)),
                ("project_url", models.URLField(blank=True)),
                ("description", models.TextField(help_text="Enter one achievement bullet per line.")),
                ("order", models.PositiveIntegerField(default=0)),
                ("resume", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="projects", to="resumes.resume")),
            ],
            options={"ordering": ["order", "id"]},
        ),
        migrations.CreateModel(
            name="Experience",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("company", models.CharField(max_length=160)),
                ("role", models.CharField(max_length=120)),
                ("location", models.CharField(blank=True, max_length=120)),
                ("start_date", models.CharField(max_length=30)),
                ("end_date", models.CharField(blank=True, max_length=30)),
                ("is_current", models.BooleanField(default=False)),
                ("description", models.TextField(help_text="Enter one bullet point per line for clean resume formatting.")),
                ("order", models.PositiveIntegerField(default=0)),
                ("resume", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="experiences", to="resumes.resume")),
            ],
            options={"ordering": ["order", "id"]},
        ),
        migrations.CreateModel(
            name="Education",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("institution", models.CharField(max_length=160)),
                ("degree", models.CharField(max_length=120)),
                ("field_of_study", models.CharField(blank=True, max_length=120)),
                ("start_year", models.CharField(max_length=10)),
                ("end_year", models.CharField(max_length=20)),
                ("gpa", models.CharField(blank=True, max_length=30)),
                ("coursework", models.CharField(blank=True, max_length=255)),
                ("order", models.PositiveIntegerField(default=0)),
                ("resume", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="educations", to="resumes.resume")),
            ],
            options={"ordering": ["order", "id"]},
        ),
        migrations.CreateModel(
            name="Certification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=180)),
                ("issuer", models.CharField(max_length=140)),
                ("issue_year", models.CharField(blank=True, max_length=16)),
                ("credential_id", models.CharField(blank=True, max_length=80)),
                ("order", models.PositiveIntegerField(default=0)),
                ("resume", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="certifications", to="resumes.resume")),
            ],
            options={"ordering": ["order", "id"]},
        ),
    ]
