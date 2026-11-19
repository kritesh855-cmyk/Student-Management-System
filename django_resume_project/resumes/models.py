from django.conf import settings
from django.db import models


class Resume(models.Model):
    """Primary Resume document owned by an authenticated user."""

    TEMPLATE_CLASSIC = "classic"
    TEMPLATE_MODERN = "modern"
    TEMPLATE_EXECUTIVE = "executive"

    TEMPLATE_CHOICES = [
        (TEMPLATE_CLASSIC, "Classic Academic"),
        (TEMPLATE_MODERN, "Modern Minimal"),
        (TEMPLATE_EXECUTIVE, "Executive Split"),
    ]

    ACCENT_NAVY = "#1E3A8A"
    ACCENT_SLATE = "#0F172A"
    ACCENT_FOREST = "#14532D"
    ACCENT_BURGUNDY = "#7F1D1D"

    ACCENT_CHOICES = [
        (ACCENT_NAVY, "Deep Navy"),
        (ACCENT_SLATE, "Charcoal Slate"),
        (ACCENT_FOREST, "Forest Ink"),
        (ACCENT_BURGUNDY, "Oxford Burgundy"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resumes",
    )
    title = models.CharField(
        max_length=120,
        help_text="Internal label, e.g., Software Engineer Placement 2026",
    )
    full_name = models.CharField(max_length=120)
    job_title = models.CharField(max_length=120, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    location = models.CharField(max_length=120, blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    summary = models.TextField(blank=True)
    template_choice = models.CharField(
        max_length=20,
        choices=TEMPLATE_CHOICES,
        default=TEMPLATE_CLASSIC,
    )
    accent_color = models.CharField(
        max_length=16,
        choices=ACCENT_CHOICES,
        default=ACCENT_NAVY,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.full_name} — {self.title}"


class Education(models.Model):
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="educations",
    )
    institution = models.CharField(max_length=160)
    degree = models.CharField(max_length=120)
    field_of_study = models.CharField(max_length=120, blank=True)
    start_year = models.CharField(max_length=10)
    end_year = models.CharField(max_length=20)
    gpa = models.CharField(max_length=30, blank=True)
    coursework = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.degree} at {self.institution}"


class Experience(models.Model):
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="experiences",
    )
    company = models.CharField(max_length=160)
    role = models.CharField(max_length=120)
    location = models.CharField(max_length=120, blank=True)
    start_date = models.CharField(max_length=30)
    end_date = models.CharField(max_length=30, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(
        help_text="Enter one bullet point per line for clean resume formatting.",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def bullet_points(self) -> list[str]:
        return [line.strip() for line in self.description.splitlines() if line.strip()]

    def __str__(self) -> str:
        return f"{self.role} — {self.company}"


class Project(models.Model):
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    title = models.CharField(max_length=160)
    tech_stack = models.CharField(max_length=200, blank=True)
    project_url = models.URLField(blank=True)
    description = models.TextField(
        help_text="Enter one achievement bullet per line.",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def bullet_points(self) -> list[str]:
        return [line.strip() for line in self.description.splitlines() if line.strip()]

    def __str__(self) -> str:
        return self.title


class Skill(models.Model):
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="skills",
    )
    category = models.CharField(
        max_length=80,
        help_text="e.g., Languages, Frameworks, Databases",
    )
    items = models.CharField(
        max_length=255,
        help_text="Comma-separated skills, e.g., Python, Django, PostgreSQL",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.category}: {self.items}"


class Certification(models.Model):
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="certifications",
    )
    name = models.CharField(max_length=180)
    issuer = models.CharField(max_length=140)
    issue_year = models.CharField(max_length=16, blank=True)
    credential_id = models.CharField(max_length=80, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.name} ({self.issuer})"
