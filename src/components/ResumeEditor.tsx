import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  AccentColor,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeRecord,
  SkillGroupItem,
  TemplateChoice,
} from '../types/resume';

interface ResumeEditorProps {
  resume: ResumeRecord;
  onChange: (updated: ResumeRecord) => void;
}

type SectionTab =
  | 'profile'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications';

const ACCENT_OPTIONS: { value: AccentColor; label: string }[] = [
  { value: '#1E3A8A', label: 'Deep Navy' },
  { value: '#0F172A', label: 'Charcoal Slate' },
  { value: '#14532D', label: 'Forest Ink' },
  { value: '#7F1D1D', label: 'Oxford Burgundy' },
];

const TEMPLATE_OPTIONS: { value: TemplateChoice; label: string }[] = [
  { value: 'classic', label: 'Classic Academic' },
  { value: 'modern', label: 'Modern Minimal' },
  { value: 'executive', label: 'Executive Split' },
];

const inputCls =
  'w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-colors';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(target, 0, item);
  return copy;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ resume, onChange }) => {
  const [activeTab, setActiveTab] = useState<SectionTab>('profile');

  const tabs: { id: SectionTab; label: string; count?: number }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'education', label: 'Education', count: resume.educations.length },
    { id: 'experience', label: 'Experience', count: resume.experiences.length },
    { id: 'projects', label: 'Projects', count: resume.projects.length },
    { id: 'skills', label: 'Skills', count: resume.skills.length },
    { id: 'certifications', label: 'Certifications', count: resume.certifications.length },
  ];

  const updateField = <K extends keyof ResumeRecord>(key: K, value: ResumeRecord[K]) => {
    onChange({ ...resume, [key]: value });
  };

  const addEducation = () => {
    const newItem: EducationItem = {
      id: `edu_${Date.now()}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
      gpa: '',
      coursework: '',
    };
    updateField('educations', [...resume.educations, newItem]);
  };

  const addExperience = () => {
    const newItem: ExperienceItem = {
      id: `exp_${Date.now()}`,
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    };
    updateField('experiences', [...resume.experiences, newItem]);
  };

  const addProject = () => {
    const newItem: ProjectItem = {
      id: `proj_${Date.now()}`,
      title: '',
      techStack: '',
      projectUrl: '',
      description: '',
    };
    updateField('projects', [...resume.projects, newItem]);
  };

  const addSkill = () => {
    const newItem: SkillGroupItem = {
      id: `skill_${Date.now()}`,
      category: '',
      items: '',
    };
    updateField('skills', [...resume.skills, newItem]);
  };

  const addCertification = () => {
    const newItem: CertificationItem = {
      id: `cert_${Date.now()}`,
      name: '',
      issuer: '',
      issueYear: '',
      credentialId: '',
    };
    updateField('certifications', [...resume.certifications, newItem]);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Segmented Section Selector */}
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="ml-1.5 text-slate-400 tabular-nums">({tab.count})</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-5 space-y-5">
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Resume Document Label</label>
                <input
                  type="text"
                  value={resume.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className={inputCls}
                  placeholder="e.g., Campus Placement — Software Engineer"
                />
              </div>

              <div>
                <label className={labelCls}>Full Name</label>
                <input
                  type="text"
                  value={resume.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Headline / Degree Target</label>
                <input
                  type="text"
                  value={resume.jobTitle}
                  onChange={(e) => updateField('jobTitle', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Email Address</label>
                <input
                  type="email"
                  value={resume.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Phone Number</label>
                <input
                  type="text"
                  value={resume.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Location</label>
                <input
                  type="text"
                  value={resume.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>GitHub URL</label>
                <input
                  type="url"
                  value={resume.githubUrl}
                  onChange={(e) => updateField('githubUrl', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>LinkedIn URL</label>
                <input
                  type="url"
                  value={resume.linkedinUrl}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Portfolio URL</label>
                <input
                  type="url"
                  value={resume.portfolioUrl}
                  onChange={(e) => updateField('portfolioUrl', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Template Layout</label>
                <select
                  value={resume.templateChoice}
                  onChange={(e) => updateField('templateChoice', e.target.value as TemplateChoice)}
                  className={inputCls}
                >
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Accent Ink</label>
                <div className="flex items-center gap-2 pt-1">
                  {ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField('accentColor', opt.value)}
                      title={opt.label}
                      className={`h-8 px-2.5 text-xs font-medium rounded-md border flex items-center gap-1.5 cursor-pointer transition-colors ${
                        resume.accentColor === opt.value
                          ? 'border-slate-900 bg-slate-100 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-sm inline-block shrink-0"
                        style={{ backgroundColor: opt.value }}
                      />
                      <span className="hidden xl:inline">{opt.label.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Objective / Profile Summary</label>
                <textarea
                  rows={4}
                  value={resume.summary}
                  onChange={(e) => updateField('summary', e.target.value)}
                  className={inputCls}
                  placeholder="Concise 2–3 sentence summary highlighting your specialization, tools, and engineering focus."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Ordered chronologically from most recent degree.
              </p>
              <button
                type="button"
                onClick={addEducation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            </div>

            {resume.educations.length === 0 && (
              <div className="py-8 text-center border border-dashed border-slate-300 rounded-md text-sm text-slate-500">
                No education entries yet. Click "Add Education" to begin.
              </div>
            )}

            {resume.educations.map((edu, index) => (
              <div key={edu.id} className="pt-4 border-t border-slate-200 first:border-t-0 first:pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Entry {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateField('educations', moveItem(resume.educations, index, -1))}
                      disabled={index === 0}
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('educations', moveItem(resume.educations, index, 1))}
                      disabled={index === resume.educations.length - 1}
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'educations',
                          resume.educations.filter((item) => item.id !== edu.id)
                        )
                      }
                      className="p-1.5 text-red-600 hover:text-red-700 cursor-pointer"
                      aria-label="Remove education"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Institution / University</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) =>
                        updateField(
                          'educations',
                          resume.educations.map((it) =>
                            it.id === edu.id ? { ...it, institution: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) =>
                        updateField(
                          'educations',
                          resume.educations.map((it) =>
                            it.id === edu.id ? { ...it, degree: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Field of Study</label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy}
                      onChange={(e) =>
                        updateField(
                          'educations',
                          resume.educations.map((it) =>
                            it.id === edu.id ? { ...it, fieldOfStudy: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Start Year</label>
                      <input
                        type="text"
                        value={edu.startYear}
                        onChange={(e) =>
                          updateField(
                            'educations',
                            resume.educations.map((it) =>
                              it.id === edu.id ? { ...it, startYear: e.target.value } : it
                            )
                          )
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>End Year</label>
                      <input
                        type="text"
                        value={edu.endYear}
                        onChange={(e) =>
                          updateField(
                            'educations',
                            resume.educations.map((it) =>
                              it.id === edu.id ? { ...it, endYear: e.target.value } : it
                            )
                          )
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>CGPA / Percentage</label>
                    <input
                      type="text"
                      value={edu.gpa}
                      onChange={(e) =>
                        updateField(
                          'educations',
                          resume.educations.map((it) =>
                            it.id === edu.id ? { ...it, gpa: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Relevant Coursework</label>
                    <input
                      type="text"
                      value={edu.coursework}
                      onChange={(e) =>
                        updateField(
                          'educations',
                          resume.educations.map((it) =>
                            it.id === edu.id ? { ...it, coursework: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Enter one bullet point per line in the description box.
              </p>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>

            {resume.experiences.length === 0 && (
              <div className="py-8 text-center border border-dashed border-slate-300 rounded-md text-sm text-slate-500">
                No internships or roles listed yet.
              </div>
            )}

            {resume.experiences.map((exp, index) => (
              <div key={exp.id} className="pt-4 border-t border-slate-200 first:border-t-0 first:pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Role {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateField('experiences', moveItem(resume.experiences, index, -1))}
                      disabled={index === 0}
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('experiences', moveItem(resume.experiences, index, 1))}
                      disabled={index === resume.experiences.length - 1}
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'experiences',
                          resume.experiences.filter((item) => item.id !== exp.id)
                        )
                      }
                      className="p-1.5 text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Role / Title</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) =>
                        updateField(
                          'experiences',
                          resume.experiences.map((it) =>
                            it.id === exp.id ? { ...it, role: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Company / Organization</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) =>
                        updateField(
                          'experiences',
                          resume.experiences.map((it) =>
                            it.id === exp.id ? { ...it, company: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Location</label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) =>
                        updateField(
                          'experiences',
                          resume.experiences.map((it) =>
                            it.id === exp.id ? { ...it, location: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Start Date</label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateField(
                            'experiences',
                            resume.experiences.map((it) =>
                              it.id === exp.id ? { ...it, startDate: e.target.value } : it
                            )
                          )
                        }
                        className={inputCls}
                        placeholder="May 2025"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>End Date</label>
                      <input
                        type="text"
                        value={exp.endDate}
                        disabled={exp.isCurrent}
                        onChange={(e) =>
                          updateField(
                            'experiences',
                            resume.experiences.map((it) =>
                              it.id === exp.id ? { ...it, endDate: e.target.value } : it
                            )
                          )
                        }
                        className={`${inputCls} disabled:bg-slate-100`}
                        placeholder={exp.isCurrent ? 'Present' : 'Aug 2025'}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.isCurrent}
                        onChange={(e) =>
                          updateField(
                            'experiences',
                            resume.experiences.map((it) =>
                              it.id === exp.id ? { ...it, isCurrent: e.target.checked } : it
                            )
                          )
                        }
                        className="rounded border-slate-300"
                      />
                      Currently working here
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Impact Bullet Points (one per line)</label>
                    <textarea
                      rows={3}
                      value={exp.description}
                      onChange={(e) =>
                        updateField(
                          'experiences',
                          resume.experiences.map((it) =>
                            it.id === exp.id ? { ...it, description: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Highlight capstone, Django, and engineering projects.
              </p>
              <button
                type="button"
                onClick={addProject}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {resume.projects.length === 0 && (
              <div className="py-8 text-center border border-dashed border-slate-300 rounded-md text-sm text-slate-500">
                No projects added yet.
              </div>
            )}

            {resume.projects.map((proj, index) => (
              <div key={proj.id} className="pt-4 border-t border-slate-200 first:border-t-0 first:pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Project {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateField('projects', moveItem(resume.projects, index, -1))}
                      disabled={index === 0}
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('projects', moveItem(resume.projects, index, 1))}
                      disabled={index === resume.projects.length - 1}
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'projects',
                          resume.projects.filter((item) => item.id !== proj.id)
                        )
                      }
                      className="p-1.5 text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Project Title</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) =>
                        updateField(
                          'projects',
                          resume.projects.map((it) =>
                            it.id === proj.id ? { ...it, title: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tech Stack</label>
                    <input
                      type="text"
                      value={proj.techStack}
                      onChange={(e) =>
                        updateField(
                          'projects',
                          resume.projects.map((it) =>
                            it.id === proj.id ? { ...it, techStack: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                      placeholder="Python, Django, SQLite"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Repository / Demo URL</label>
                    <input
                      type="url"
                      value={proj.projectUrl}
                      onChange={(e) =>
                        updateField(
                          'projects',
                          resume.projects.map((it) =>
                            it.id === proj.id ? { ...it, projectUrl: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Key Achievements (one per line)</label>
                    <textarea
                      rows={3}
                      value={proj.description}
                      onChange={(e) =>
                        updateField(
                          'projects',
                          resume.projects.map((it) =>
                            it.id === proj.id ? { ...it, description: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Group technical skills by category for rapid ATS scanning.
              </p>
              <button
                type="button"
                onClick={addSkill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Skill Group
              </button>
            </div>

            {resume.skills.map((skill, index) => (
              <div key={skill.id} className="pt-4 border-t border-slate-200 first:border-t-0 first:pt-0 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <label className={labelCls}>Category {index + 1}</label>
                  <input
                    type="text"
                    value={skill.category}
                    onChange={(e) =>
                      updateField(
                        'skills',
                        resume.skills.map((it) =>
                          it.id === skill.id ? { ...it, category: e.target.value } : it
                        )
                      )
                    }
                    className={inputCls}
                    placeholder="Languages"
                  />
                </div>
                <div className="sm:col-span-7">
                  <label className={labelCls}>Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={skill.items}
                    onChange={(e) =>
                      updateField(
                        'skills',
                        resume.skills.map((it) =>
                          it.id === skill.id ? { ...it, items: e.target.value } : it
                        )
                      )
                    }
                    className={inputCls}
                    placeholder="Python, SQL, TypeScript"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        'skills',
                        resume.skills.filter((item) => item.id !== skill.id)
                      )
                    }
                    className="p-2 text-red-600 hover:text-red-700 cursor-pointer"
                    aria-label="Remove skill group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600">
                Include verified industry or academic certifications.
              </p>
              <button
                type="button"
                onClick={addCertification}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 rounded-md hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certification
              </button>
            </div>

            {resume.certifications.map((cert, index) => (
              <div key={cert.id} className="pt-4 border-t border-slate-200 first:border-t-0 first:pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Certification {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        'certifications',
                        resume.certifications.filter((item) => item.id !== cert.id)
                      )
                    }
                    className="p-1 text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Certificate Name</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) =>
                        updateField(
                          'certifications',
                          resume.certifications.map((it) =>
                            it.id === cert.id ? { ...it, name: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Issuing Organization</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) =>
                        updateField(
                          'certifications',
                          resume.certifications.map((it) =>
                            it.id === cert.id ? { ...it, issuer: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Issue Year</label>
                    <input
                      type="text"
                      value={cert.issueYear}
                      onChange={(e) =>
                        updateField(
                          'certifications',
                          resume.certifications.map((it) =>
                            it.id === cert.id ? { ...it, issueYear: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Credential ID</label>
                    <input
                      type="text"
                      value={cert.credentialId}
                      onChange={(e) =>
                        updateField(
                          'certifications',
                          resume.certifications.map((it) =>
                            it.id === cert.id ? { ...it, credentialId: e.target.value } : it
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
