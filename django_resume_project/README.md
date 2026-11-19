# Systematic Resume Creator — Python Django (MVT Architecture)

A structured, full-stack **Resume Creator Web Application** built with **Python 3.11+** and **Django 5.x** following the **Model-View-Template (MVT)** architectural pattern. Designed for academic submission with normalized relational models, Django Inline Formsets, user authentication, CRUD workflows, admin configuration, automated unit tests, and PDF export.

---

## 1. Key Features

- **User Authentication & Ownership Isolation**: Registration, login, and logout using Django's built-in `django.contrib.auth` system. Users can only view, edit, duplicate, or export their own resumes.
- **Normalized Relational Schema**: Six interconnected models (`Resume`, `Education`, `Experience`, `Project`, `Skill`, `Certification`) linked with `ForeignKey` cascade relationships.
- **Atomic Multi-Section Formsets**: Simultaneous creation and editing of parent `Resume` records and nested child entries via `inlineformset_factory` inside `transaction.atomic()`.
- **Multiple ATS-Friendly Templates**: Switch seamlessly between **Classic Academic**, **Modern Minimal**, and **Executive Split** layouts.
- **One-Click PDF Export**: Server-side HTML-to-PDF rendering using `xhtml2pdf` with `@page` A4 print dimensions, plus browser print fallback.
- **Django Admin Integration**: Customized `ModelAdmin` with `TabularInline` editors for Education, Experience, Projects, Skills, and Certifications.
- **Automated Test Suite**: Unit and integration tests in `resumes/tests.py` covering models, form validation, cascade deletes, and access control.

---

## 2. Project Directory Structure

```text
django_resume_project/
├── manage.py
├── requirements.txt
├── README.md
├── resume_builder/                  # Django Project Configuration
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── resumes/                         # Core Resume Application (MVT)
    ├── __init__.py
    ├── admin.py                     # Admin inline registrations
    ├── apps.py
    ├── forms.py                     # ModelForms & Inline Formsets
    ├── models.py                    # Relational SQLite/PostgreSQL schema
    ├── tests.py                     # Unit & view test suite
    ├── urls.py                      # App-level URL routing
    ├── views.py                     # Business logic & PDF export
    ├── migrations/
    │   ├── __init__.py
    │   └── 0001_initial.py
    ├── static/
    │   └── resumes/
    │       └── css/
    │           └── style.css
    └── templates/
        ├── base.html
        ├── registration/
        │   ├── login.html
        │   └── register.html
        └── resumes/
            ├── dashboard.html
            ├── resume_confirm_delete.html
            ├── resume_form.html
            └── templates_pdf/
                ├── classic.html
                ├── executive.html
                └── modern.html
```

---

## 3. Local Installation & Execution Guide

### Prerequisites
- Python **3.10 or higher**
- `pip` (Python package manager)

### Step-by-Step Setup

1. **Create and activate a virtual environment**
   ```bash
   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate

   # Windows (PowerShell)
   python -m venv venv
   venv\Scripts\Activate.ps1
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Apply database migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create an administrator account (optional, for `/admin/`)**
   ```bash
   python manage.py createsuperuser
   ```

5. **Run the automated test suite**
   ```bash
   python manage.py test resumes
   ```

6. **Start the development server**
   ```bash
   python manage.py runserver
   ```
   Open `http://127.0.0.1:8000/` in your browser.

---

## 4. Database Entity-Relationship Overview

- `auth.User` **1 ──< N** `Resume` (`owner`)
- `Resume` **1 ──< N** `Education`
- `Resume` **1 ──< N** `Experience`
- `Resume` **1 ──< N** `Project`
- `Resume` **1 ──< N** `Skill`
- `Resume` **1 ──< N** `Certification`

Every child entity uses `on_delete=models.CASCADE` and an integer `order` field for deterministic section sorting.
