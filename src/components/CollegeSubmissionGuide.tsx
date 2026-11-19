import React, { useState } from 'react';
import { Check, ChevronDown, Copy, Download } from 'lucide-react';

const SETUP_COMMANDS = `# 1. Unzip django_resume_creator.zip and enter the directory
cd django_resume_project

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate      # Windows: venv\\Scripts\\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations & automated tests
python manage.py migrate
python manage.py test resumes

# 5. Create an admin user and launch the server
python manage.py createsuperuser
python manage.py runserver`;

const SCHEMA_TABLES = [
  {
    model: 'Resume',
    fields: 'id (PK), owner (FK -> User), title, full_name, job_title, email, phone, location, summary, template_choice, accent_color, updated_at',
    relation: 'Parent document (1:N owner)',
  },
  {
    model: 'Education',
    fields: 'id (PK), resume (FK -> Resume), institution, degree, field_of_study, start_year, end_year, gpa, coursework, order',
    relation: 'CASCADE on Resume delete',
  },
  {
    model: 'Experience',
    fields: 'id (PK), resume (FK -> Resume), company, role, location, start_date, end_date, is_current, description, order',
    relation: 'CASCADE on Resume delete',
  },
  {
    model: 'Project',
    fields: 'id (PK), resume (FK -> Resume), title, tech_stack, project_url, description, order',
    relation: 'CASCADE on Resume delete',
  },
  {
    model: 'Skill',
    fields: 'id (PK), resume (FK -> Resume), category, items, order',
    relation: 'CASCADE on Resume delete',
  },
  {
    model: 'Certification',
    fields: 'id (PK), resume (FK -> Resume), name, issuer, issue_year, credential_id, order',
    relation: 'CASCADE on Resume delete',
  },
];

const VIVA_QA = [
  {
    q: 'Why does Django follow the MVT pattern instead of MVC?',
    a: 'In Django MVT (Model-View-Template), the Model manages database schema and ORM queries (models.py), the Template handles presentation (HTML/CSS), and the View acts as the request-response controller (views.py). Django itself handles the URL dispatcher routing (urls.py).',
  },
  {
    q: 'How are multiple Education, Experience, and Project rows saved simultaneously in one form?',
    a: 'Using Django inlineformset_factory in resumes/forms.py. Each child model gets a formset bound to the parent Resume instance. On POST, all formsets are validated and saved together inside a transaction.atomic() block so partial failures never corrupt database state.',
  },
  {
    q: 'How do you prevent one student from editing or downloading another student’s resume?',
    a: 'Every protected view uses the @login_required decorator and queries with get_object_or_404(Resume, pk=pk, owner=request.user). If another user tries to access the primary key, Django returns a 404 Not Found response.',
  },
  {
    q: 'How is the PDF generated on the server in Python Django?',
    a: 'The view renders a dedicated print-ready HTML template (classic.html, modern.html, or executive.html) using get_template().render(...) and converts the HTML string into a binary PDF stream via xhtml2pdf (pisa.CreatePDF) returned with Content-Type: application/pdf.',
  },
  {
    q: 'How does the database prevent N+1 query performance issues during resume preview?',
    a: 'The preview and PDF views use Resume.objects.prefetch_related("educations", "experiences", "projects", "skills", "certifications") to fetch all related child tables in batched SQL queries instead of querying inside template loops.',
  },
  {
    q: 'What security protections are active by default in this Django project?',
    a: 'CSRF tokens ({% csrf_token %}) on all state-changing POST forms, Django PBKDF2 password hashing, SQL injection protection via parameterized ORM queries, and automatic HTML escaping in templates against XSS.',
  },
];

export const CollegeSubmissionGuide: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleCopyCommands = async () => {
    await navigator.clipboard.writeText(SETUP_COMMANDS);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            College Submission Report & Viva Guide
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Architecture documentation, normalized schema reference, setup instructions, and viva preparation.
          </p>
        </div>
        <a
          href="/api/django-project/download"
          download="django_resume_creator.zip"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          Download Django ZIP
        </a>
      </div>

      {/* Section 1: MVT Architecture */}
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-base font-bold text-slate-900">
          01. Django MVT Request-Response Architecture
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Systematic separation of concerns across URL routing, business logic, relational ORM, and printable templates.
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
          {[
            {
              step: '1. URL Router',
              file: 'resumes/urls.py',
              detail: 'Dispatches authenticated routes like /resumes/<pk>/edit/ and /pdf/.',
            },
            {
              step: '2. View Controller',
              file: 'resumes/views.py',
              detail: 'Enforces @login_required, ownership checks, and atomic saves.',
            },
            {
              step: '3. Formsets',
              file: 'resumes/forms.py',
              detail: 'Validates ResumeForm and 5 inline child formsets simultaneously.',
            },
            {
              step: '4. ORM Models',
              file: 'resumes/models.py',
              detail: '6 normalized SQLite/PostgreSQL tables with ForeignKey cascades.',
            },
            {
              step: '5. HTML & PDF',
              file: 'templates_pdf/*.html',
              detail: 'Renders Classic, Modern, or Executive templates via xhtml2pdf.',
            },
          ].map((node) => (
            <div
              key={node.step}
              className="border border-slate-200 rounded-md p-3.5 bg-slate-50 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-blue-900">{node.step}</div>
                <div className="mt-1 text-[11px] font-mono-code text-slate-600">
                  {node.file}
                </div>
                <p className="mt-2 text-xs text-slate-700 leading-relaxed">{node.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Database ER Table */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            02. Normalized Relational Database Schema
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Defined in <span className="font-mono-code text-xs">resumes/models.py</span> with initial migration <span className="font-mono-code text-xs">0001_initial.py</span>.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-5">Model Table</th>
                <th className="py-3 px-5">Columns & Attributes</th>
                <th className="py-3 px-5">Referential Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {SCHEMA_TABLES.map((row) => (
                <tr key={row.model} className="hover:bg-slate-50/60">
                  <td className="py-3 px-5 font-semibold text-slate-900 whitespace-nowrap align-top">
                    {row.model}
                  </td>
                  <td className="py-3 px-5 font-mono-code text-xs text-slate-700 leading-relaxed">
                    {row.fields}
                  </td>
                  <td className="py-3 px-5 text-xs text-slate-600 whitespace-nowrap align-top">
                    {row.relation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Local Setup Instructions */}
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              03. Local Execution & Testing Commands
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Run these commands on your laptop during your college demonstration.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCommands}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedCmd ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Commands
              </>
            )}
          </button>
        </div>

        <pre className="bg-slate-950 text-slate-100 p-4 rounded-md overflow-x-auto font-mono-code text-xs leading-6">
          {SETUP_COMMANDS}
        </pre>
      </section>

      {/* Section 4: Viva Questions */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            04. College Viva Preparation Questions
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Key architectural questions commonly asked during academic project evaluations.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {VIVA_QA.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-900">
                    {idx + 1}. {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-sm text-slate-700 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
