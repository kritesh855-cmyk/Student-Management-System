from io import BytesIO

from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Q
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import get_template
from xhtml2pdf import pisa

from .forms import (
    CertificationFormSet,
    EducationFormSet,
    ExperienceFormSet,
    ProjectFormSet,
    ResumeForm,
    SkillFormSet,
    UserRegistrationForm,
)
from .models import Resume


def register_view(request: HttpRequest) -> HttpResponse:
    if request.user.is_authenticated:
        return redirect("resumes:dashboard")

    if request.method == "POST":
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Account created successfully. Start building your resume.")
            return redirect("resumes:dashboard")
    else:
        form = UserRegistrationForm()

    return render(request, "registration/register.html", {"form": form})


@login_required
def dashboard_view(request: HttpRequest) -> HttpResponse:
    query = request.GET.get("q", "").strip()
    template_filter = request.GET.get("template", "").strip()

    resumes = Resume.objects.filter(owner=request.user)
    if query:
        resumes = resumes.filter(
            Q(title__icontains=query)
            | Q(full_name__icontains=query)
            | Q(job_title__icontains=query)
        )
    if template_filter:
        resumes = resumes.filter(template_choice=template_filter)

    return render(
        request,
        "resumes/dashboard.html",
        {
            "resumes": resumes,
            "query": query,
            "template_filter": template_filter,
            "template_choices": Resume.TEMPLATE_CHOICES,
        },
    )


def _build_formsets(request: HttpRequest, instance: Resume | None = None) -> dict:
    data = request.POST if request.method == "POST" else None
    return {
        "education_fs": EducationFormSet(data, instance=instance, prefix="edu"),
        "experience_fs": ExperienceFormSet(data, instance=instance, prefix="exp"),
        "project_fs": ProjectFormSet(data, instance=instance, prefix="proj"),
        "skill_fs": SkillFormSet(data, instance=instance, prefix="skill"),
        "certification_fs": CertificationFormSet(data, instance=instance, prefix="cert"),
    }


@login_required
def resume_create_view(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        form = ResumeForm(request.POST)
        formsets = _build_formsets(request)

        if form.is_valid() and all(fs.is_valid() for fs in formsets.values()):
            with transaction.atomic():
                resume = form.save(commit=False)
                resume.owner = request.user
                resume.save()
                for fs in formsets.values():
                    fs.instance = resume
                    fs.save()
            messages.success(request, f"Resume '{resume.title}' created.")
            return redirect("resumes:resume_preview", pk=resume.pk)
    else:
        form = ResumeForm()
        formsets = _build_formsets(request)

    return render(
        request,
        "resumes/resume_form.html",
        {"form": form, "mode": "Create", **formsets},
    )


@login_required
def resume_edit_view(request: HttpRequest, pk: int) -> HttpResponse:
    resume = get_object_or_404(Resume, pk=pk, owner=request.user)

    if request.method == "POST":
        form = ResumeForm(request.POST, instance=resume)
        formsets = _build_formsets(request, instance=resume)

        if form.is_valid() and all(fs.is_valid() for fs in formsets.values()):
            with transaction.atomic():
                form.save()
                for fs in formsets.values():
                    fs.save()
            messages.success(request, f"Resume '{resume.title}' updated.")
            return redirect("resumes:resume_preview", pk=resume.pk)
    else:
        form = ResumeForm(instance=resume)
        formsets = _build_formsets(request, instance=resume)

    return render(
        request,
        "resumes/resume_form.html",
        {"form": form, "resume": resume, "mode": "Edit", **formsets},
    )


def _get_template_path(resume: Resume) -> str:
    mapping = {
        Resume.TEMPLATE_CLASSIC: "resumes/templates_pdf/classic.html",
        Resume.TEMPLATE_MODERN: "resumes/templates_pdf/modern.html",
        Resume.TEMPLATE_EXECUTIVE: "resumes/templates_pdf/executive.html",
    }
    return mapping.get(resume.template_choice, "resumes/templates_pdf/classic.html")


@login_required
def resume_preview_view(request: HttpRequest, pk: int) -> HttpResponse:
    resume = get_object_or_404(
        Resume.objects.prefetch_related(
            "educations", "experiences", "projects", "skills", "certifications"
        ),
        pk=pk,
        owner=request.user,
    )
    return render(
        request,
        _get_template_path(resume),
        {"resume": resume, "is_pdf": False},
    )


@login_required
def resume_pdf_view(request: HttpRequest, pk: int) -> HttpResponse:
    resume = get_object_or_404(
        Resume.objects.prefetch_related(
            "educations", "experiences", "projects", "skills", "certifications"
        ),
        pk=pk,
        owner=request.user,
    )
    template = get_template(_get_template_path(resume))
    html = template.render({"resume": resume, "is_pdf": True})

    result = BytesIO()
    pdf_status = pisa.CreatePDF(html, dest=result)
    if pdf_status.err:
        return HttpResponse("Error generating PDF document.", status=500)

    safe_name = "_".join(resume.full_name.lower().split()) or "resume"
    response = HttpResponse(result.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{safe_name}_resume.pdf"'
    return response


@login_required
def resume_duplicate_view(request: HttpRequest, pk: int) -> HttpResponse:
    if request.method != "POST":
        return redirect("resumes:dashboard")

    source = get_object_or_404(Resume, pk=pk, owner=request.user)
    with transaction.atomic():
        educations = list(source.educations.all())
        experiences = list(source.experiences.all())
        projects = list(source.projects.all())
        skills = list(source.skills.all())
        certifications = list(source.certifications.all())

        source.pk = None
        source.title = f"{source.title} (Copy)"
        source.save()

        for item in educations:
            item.pk = None
            item.resume = source
            item.save()
        for item in experiences:
            item.pk = None
            item.resume = source
            item.save()
        for item in projects:
            item.pk = None
            item.resume = source
            item.save()
        for item in skills:
            item.pk = None
            item.resume = source
            item.save()
        for item in certifications:
            item.pk = None
            item.resume = source
            item.save()

    messages.success(request, f"Created copy '{source.title}'.")
    return redirect("resumes:resume_edit", pk=source.pk)


@login_required
def resume_delete_view(request: HttpRequest, pk: int) -> HttpResponse:
    resume = get_object_or_404(Resume, pk=pk, owner=request.user)
    if request.method == "POST":
        title = resume.title
        resume.delete()
        messages.success(request, f"Resume '{title}' deleted.")
        return redirect("resumes:dashboard")
    return render(request, "resumes/resume_confirm_delete.html", {"resume": resume})
