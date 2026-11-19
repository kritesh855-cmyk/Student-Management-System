from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.forms import inlineformset_factory

from .models import (
    Certification,
    Education,
    Experience,
    Project,
    Resume,
    Skill,
)

INPUT_CLASS = "fc-input"
TEXTAREA_CLASS = "fc-textarea"
SELECT_CLASS = "fc-select"


class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=60, required=True)
    last_name = forms.CharField(max_length=60, required=True)

    class Meta:
        model = User
        fields = ("username", "first_name", "last_name", "email", "password1", "password2")


class ResumeForm(forms.ModelForm):
    class Meta:
        model = Resume
        fields = [
            "title",
            "full_name",
            "job_title",
            "email",
            "phone",
            "location",
            "linkedin_url",
            "github_url",
            "portfolio_url",
            "summary",
            "template_choice",
            "accent_color",
        ]
        widgets = {
            "title": forms.TextInput(attrs={"class": INPUT_CLASS, "placeholder": "e.g., Campus Placement Resume 2026"}),
            "full_name": forms.TextInput(attrs={"class": INPUT_CLASS, "placeholder": "Full Legal Name"}),
            "job_title": forms.TextInput(attrs={"class": INPUT_CLASS, "placeholder": "Software Engineering Graduate"}),
            "email": forms.EmailInput(attrs={"class": INPUT_CLASS, "placeholder": "student@university.edu"}),
            "phone": forms.TextInput(attrs={"class": INPUT_CLASS, "placeholder": "+91 98765 43210"}),
            "location": forms.TextInput(attrs={"class": INPUT_CLASS, "placeholder": "Bengaluru, India"}),
            "linkedin_url": forms.URLInput(attrs={"class": INPUT_CLASS, "placeholder": "https://linkedin.com/in/username"}),
            "github_url": forms.URLInput(attrs={"class": INPUT_CLASS, "placeholder": "https://github.com/username"}),
            "portfolio_url": forms.URLInput(attrs={"class": INPUT_CLASS, "placeholder": "https://portfolio.dev"}),
            "summary": forms.Textarea(attrs={"class": TEXTAREA_CLASS, "rows": 4}),
            "template_choice": forms.Select(attrs={"class": SELECT_CLASS}),
            "accent_color": forms.Select(attrs={"class": SELECT_CLASS}),
        }


class EducationForm(forms.ModelForm):
    class Meta:
        model = Education
        fields = ["institution", "degree", "field_of_study", "start_year", "end_year", "gpa", "coursework", "order"]
        widgets = {
            "institution": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "degree": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "field_of_study": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "start_year": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "end_year": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "gpa": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "coursework": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "order": forms.NumberInput(attrs={"class": INPUT_CLASS, "min": 0}),
        }


class ExperienceForm(forms.ModelForm):
    class Meta:
        model = Experience
        fields = ["company", "role", "location", "start_date", "end_date", "is_current", "description", "order"]
        widgets = {
            "company": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "role": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "location": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "start_date": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "end_date": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "description": forms.Textarea(attrs={"class": TEXTAREA_CLASS, "rows": 3}),
            "order": forms.NumberInput(attrs={"class": INPUT_CLASS, "min": 0}),
        }


class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ["title", "tech_stack", "project_url", "description", "order"]
        widgets = {
            "title": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "tech_stack": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "project_url": forms.URLInput(attrs={"class": INPUT_CLASS}),
            "description": forms.Textarea(attrs={"class": TEXTAREA_CLASS, "rows": 3}),
            "order": forms.NumberInput(attrs={"class": INPUT_CLASS, "min": 0}),
        }


class SkillForm(forms.ModelForm):
    class Meta:
        model = Skill
        fields = ["category", "items", "order"]
        widgets = {
            "category": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "items": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "order": forms.NumberInput(attrs={"class": INPUT_CLASS, "min": 0}),
        }


class CertificationForm(forms.ModelForm):
    class Meta:
        model = Certification
        fields = ["name", "issuer", "issue_year", "credential_id", "order"]
        widgets = {
            "name": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "issuer": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "issue_year": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "credential_id": forms.TextInput(attrs={"class": INPUT_CLASS}),
            "order": forms.NumberInput(attrs={"class": INPUT_CLASS, "min": 0}),
        }


EducationFormSet = inlineformset_factory(
    Resume, Education, form=EducationForm, extra=1, can_delete=True
)
ExperienceFormSet = inlineformset_factory(
    Resume, Experience, form=ExperienceForm, extra=1, can_delete=True
)
ProjectFormSet = inlineformset_factory(
    Resume, Project, form=ProjectForm, extra=1, can_delete=True
)
SkillFormSet = inlineformset_factory(
    Resume, Skill, form=SkillForm, extra=1, can_delete=True
)
CertificationFormSet = inlineformset_factory(
    Resume, Certification, form=CertificationForm, extra=1, can_delete=True
)
