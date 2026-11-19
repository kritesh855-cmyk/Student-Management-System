import React from 'react';
import { ResumeRecord } from '../types/resume';

interface ResumePreviewProps {
  resume: ResumeRecord;
  compact?: boolean;
}

function splitBullets(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resume, compact = false }) => {
  const accent = resume.accentColor || '#1E3A8A';

  const contactItems = [
    resume.email,
    resume.phone,
    resume.location,
  ].filter(Boolean);

  const linkItems = [
    resume.linkedinUrl,
    resume.githubUrl,
    resume.portfolioUrl,
  ].filter(Boolean);

  if (resume.templateChoice === 'executive') {
    return (
      <div
        className={`resume-a4-sheet bg-white text-slate-900 font-sans-resume ${
          compact ? 'text-[10px] leading-relaxed' : 'text-[12.5px] leading-[1.48]'
        }`}
      >
        <div className="grid grid-cols-12 min-h-[1040px] border border-slate-200 print:border-none">
          <aside className="col-span-4 bg-slate-50 border-r border-slate-200 p-7 print:bg-slate-50">
            <h1
              className="text-xl font-bold tracking-tight leading-snug break-words"
              style={{ color: accent }}
            >
              {resume.fullName || 'Your Name'}
            </h1>
            {resume.jobTitle && (
              <p className="mt-1 text-xs font-medium text-slate-600">{resume.jobTitle}</p>
            )}

            <div className="mt-6">
              <h2
                className="text-[10.5px] font-bold uppercase tracking-wider pb-1 border-b border-slate-300"
                style={{ color: accent }}
              >
                Contact
              </h2>
              <div className="mt-2 space-y-1 text-[11px] text-slate-700 break-all">
                {contactItems.map((item, i) => (
                  <div key={i}>{item}</div>
                ))}
                {linkItems.map((link, i) => (
                  <div key={i} className="text-slate-600">
                    {link.replace(/^https?:\/\//, '')}
                  </div>
                ))}
              </div>
            </div>

            {resume.skills.length > 0 && (
              <div className="mt-6">
                <h2
                  className="text-[10.5px] font-bold uppercase tracking-wider pb-1 border-b border-slate-300"
                  style={{ color: accent }}
                >
                  Technical Skills
                </h2>
                <div className="mt-2.5 space-y-2.5 text-[11px]">
                  {resume.skills.map((skill) => (
                    <div key={skill.id}>
                      <div className="font-semibold text-slate-900">{skill.category}</div>
                      <div className="text-slate-700 mt-0.5">{skill.items}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resume.certifications.length > 0 && (
              <div className="mt-6">
                <h2
                  className="text-[10.5px] font-bold uppercase tracking-wider pb-1 border-b border-slate-300"
                  style={{ color: accent }}
                >
                  Certifications
                </h2>
                <div className="mt-2.5 space-y-2 text-[11px]">
                  {resume.certifications.map((cert) => (
                    <div key={cert.id}>
                      <div className="font-semibold text-slate-900">{cert.name}</div>
                      <div className="text-slate-600">
                        {cert.issuer}
                        {cert.issueYear ? ` · ${cert.issueYear}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="col-span-8 p-7 space-y-5">
            {resume.summary && (
              <section>
                <h2
                  className="text-[11px] font-bold uppercase tracking-wider pb-1 border-b border-slate-200"
                  style={{ color: accent }}
                >
                  Profile Summary
                </h2>
                <p className="mt-2 text-slate-700">{resume.summary}</p>
              </section>
            )}

            {resume.experiences.length > 0 && (
              <section>
                <h2
                  className="text-[11px] font-bold uppercase tracking-wider pb-1 border-b border-slate-200"
                  style={{ color: accent }}
                >
                  Experience
                </h2>
                <div className="mt-2.5 space-y-3.5">
                  {resume.experiences.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-semibold text-slate-900">
                          {exp.role} — {exp.company}
                        </span>
                        <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                          {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      {exp.location && (
                        <div className="text-[11px] text-slate-500">{exp.location}</div>
                      )}
                      <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-700">
                        {splitBullets(exp.description).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {resume.projects.length > 0 && (
              <section>
                <h2
                  className="text-[11px] font-bold uppercase tracking-wider pb-1 border-b border-slate-200"
                  style={{ color: accent }}
                >
                  Projects
                </h2>
                <div className="mt-2.5 space-y-3">
                  {resume.projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-semibold text-slate-900">{proj.title}</span>
                        {proj.techStack && (
                          <span className="text-[11px] text-slate-500 text-right">
                            {proj.techStack}
                          </span>
                        )}
                      </div>
                      <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-700">
                        {splitBullets(proj.description).map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {resume.educations.length > 0 && (
              <section>
                <h2
                  className="text-[11px] font-bold uppercase tracking-wider pb-1 border-b border-slate-200"
                  style={{ color: accent }}
                >
                  Education
                </h2>
                <div className="mt-2.5 space-y-2.5">
                  {resume.educations.map((edu) => (
                    <div key={edu.id}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-semibold text-slate-900">{edu.institution}</span>
                        <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                          {edu.startYear} – {edu.endYear}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-slate-700">
                        <span>
                          {edu.degree}
                          {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                        </span>
                        {edu.gpa && <span className="text-[11px] tabular-nums">GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (resume.templateChoice === 'modern') {
    return (
      <div
        className={`resume-a4-sheet bg-white text-slate-900 font-sans-resume p-10 min-h-[1040px] ${
          compact ? 'text-[10px] leading-relaxed' : 'text-[12.5px] leading-[1.48]'
        }`}
      >
        <header className="pb-4 border-b-2" style={{ borderColor: accent }}>
          <h1 className="text-[26px] font-bold tracking-tight text-slate-950 leading-tight">
            {resume.fullName || 'Your Name'}
          </h1>
          {resume.jobTitle && (
            <p className="text-sm font-semibold mt-0.5" style={{ color: accent }}>
              {resume.jobTitle}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-slate-600">
            {contactItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden="true">·</span>}
                <span>{item}</span>
              </React.Fragment>
            ))}
            {linkItems.map((link, i) => (
              <React.Fragment key={`l_${i}`}>
                <span aria-hidden="true">·</span>
                <span>{link.replace(/^https?:\/\//, '')}</span>
              </React.Fragment>
            ))}
          </div>
        </header>

        <div className="mt-5 space-y-5">
          {resume.summary && (
            <section>
              <h2
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5"
                style={{ color: accent }}
              >
                Profile
              </h2>
              <p className="text-slate-700">{resume.summary}</p>
            </section>
          )}

          {resume.experiences.length > 0 && (
            <section>
              <h2
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2"
                style={{ color: accent }}
              >
                Experience
              </h2>
              <div className="space-y-3.5">
                {resume.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="font-semibold text-slate-900">
                        {exp.role} <span className="font-normal text-slate-600">· {exp.company}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                        {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-700">
                      {splitBullets(exp.description).map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resume.projects.length > 0 && (
            <section>
              <h2
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2"
                style={{ color: accent }}
              >
                Selected Projects
              </h2>
              <div className="space-y-3">
                {resume.projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-semibold text-slate-900">{proj.title}</span>
                      {proj.techStack && (
                        <span className="text-[11px] text-slate-500">{proj.techStack}</span>
                      )}
                    </div>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-700">
                      {splitBullets(proj.description).map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resume.educations.length > 0 && (
            <section>
              <h2
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2"
                style={{ color: accent }}
              >
                Education
              </h2>
              <div className="space-y-2">
                {resume.educations.map((edu) => (
                  <div key={edu.id} className="flex items-baseline justify-between gap-4">
                    <div>
                      <span className="font-semibold text-slate-900">{edu.institution}</span>
                      <span className="text-slate-700">
                        {' '}
                        — {edu.degree}
                        {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                      </span>
                      {edu.gpa && <span className="text-slate-600 tabular-nums"> · GPA {edu.gpa}</span>}
                    </div>
                    <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {edu.startYear} – {edu.endYear}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resume.skills.length > 0 && (
            <section>
              <h2
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5"
                style={{ color: accent }}
              >
                Technical Skills
              </h2>
              <div className="space-y-1 text-slate-700">
                {resume.skills.map((skill) => (
                  <div key={skill.id}>
                    <span className="font-semibold text-slate-900">{skill.category}:</span>{' '}
                    {skill.items}
                  </div>
                ))}
              </div>
            </section>
          )}

          {resume.certifications.length > 0 && (
            <section>
              <h2
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1.5"
                style={{ color: accent }}
              >
                Certifications
              </h2>
              <div className="space-y-1 text-slate-700">
                {resume.certifications.map((cert) => (
                  <div key={cert.id}>
                    <span className="font-semibold text-slate-900">{cert.name}</span> — {cert.issuer}
                    {cert.issueYear ? ` (${cert.issueYear})` : ''}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // Default: Classic Academic (ATS Standard Serif)
  return (
    <div
      className={`resume-a4-sheet bg-white text-slate-900 font-serif-resume p-10 min-h-[1040px] ${
        compact ? 'text-[10.5px] leading-relaxed' : 'text-[13px] leading-[1.46]'
      }`}
    >
      <header className="text-center pb-3">
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: accent }}>
          {resume.fullName || 'Your Name'}
        </h1>
        {resume.jobTitle && (
          <p className="text-[12.5px] text-slate-700 mt-0.5">{resume.jobTitle}</p>
        )}
        <div className="mt-1.5 flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 text-[11.5px] text-slate-700">
          {contactItems.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span aria-hidden="true">·</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
        {linkItems.length > 0 && (
          <div className="mt-0.5 flex flex-wrap justify-center items-center gap-x-2 text-[11px] text-slate-600">
            {linkItems.map((link, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden="true">·</span>}
                <span>{link.replace(/^https?:\/\//, '')}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-4 mt-2">
        {resume.summary && (
          <section>
            <h2
              className="text-[12px] font-bold uppercase tracking-wider pb-0.5 border-b mb-1.5"
              style={{ color: accent, borderColor: accent }}
            >
              Objective & Summary
            </h2>
            <p className="text-slate-800">{resume.summary}</p>
          </section>
        )}

        {resume.educations.length > 0 && (
          <section>
            <h2
              className="text-[12px] font-bold uppercase tracking-wider pb-0.5 border-b mb-2"
              style={{ color: accent, borderColor: accent }}
            >
              Education
            </h2>
            <div className="space-y-2.5">
              {resume.educations.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between gap-4 font-bold text-slate-900">
                    <span>{edu.institution}</span>
                    <span className="text-[11.5px] font-normal tabular-nums whitespace-nowrap">
                      {edu.startYear} – {edu.endYear}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 italic text-slate-700 text-[12px]">
                    <span>
                      {edu.degree}
                      {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                    </span>
                    {edu.gpa && <span className="not-italic tabular-nums">CGPA / Score: {edu.gpa}</span>}
                  </div>
                  {edu.coursework && (
                    <p className="text-[11.5px] text-slate-700 mt-0.5">
                      <span className="font-semibold">Relevant Coursework:</span> {edu.coursework}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.experiences.length > 0 && (
          <section>
            <h2
              className="text-[12px] font-bold uppercase tracking-wider pb-0.5 border-b mb-2"
              style={{ color: accent, borderColor: accent }}
            >
              Experience
            </h2>
            <div className="space-y-3">
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between gap-4 font-bold text-slate-900">
                    <span>
                      {exp.role} — {exp.company}
                    </span>
                    <span className="text-[11.5px] font-normal tabular-nums whitespace-nowrap">
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  {exp.location && (
                    <div className="italic text-[11.5px] text-slate-600">{exp.location}</div>
                  )}
                  <ul className="mt-1 list-disc pl-5 space-y-0.5 text-slate-800">
                    {splitBullets(exp.description).map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.projects.length > 0 && (
          <section>
            <h2
              className="text-[12px] font-bold uppercase tracking-wider pb-0.5 border-b mb-2"
              style={{ color: accent, borderColor: accent }}
            >
              Academic & Technical Projects
            </h2>
            <div className="space-y-3">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-bold text-slate-900">{proj.title}</span>
                    {proj.techStack && (
                      <span className="text-[11.5px] italic text-slate-600 text-right">
                        {proj.techStack}
                      </span>
                    )}
                  </div>
                  <ul className="mt-1 list-disc pl-5 space-y-0.5 text-slate-800">
                    {splitBullets(proj.description).map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.skills.length > 0 && (
          <section>
            <h2
              className="text-[12px] font-bold uppercase tracking-wider pb-0.5 border-b mb-1.5"
              style={{ color: accent, borderColor: accent }}
            >
              Technical Skills
            </h2>
            <div className="space-y-1 text-slate-800">
              {resume.skills.map((skill) => (
                <div key={skill.id}>
                  <span className="font-bold">{skill.category}:</span> {skill.items}
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.certifications.length > 0 && (
          <section>
            <h2
              className="text-[12px] font-bold uppercase tracking-wider pb-0.5 border-b mb-1.5"
              style={{ color: accent, borderColor: accent }}
            >
              Certifications & Achievements
            </h2>
            <div className="space-y-1 text-slate-800">
              {resume.certifications.map((cert) => (
                <div key={cert.id}>
                  <span className="font-bold">{cert.name}</span> — {cert.issuer}
                  {cert.issueYear ? ` (${cert.issueYear})` : ''}
                  {cert.credentialId ? ` · ID: ${cert.credentialId}` : ''}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
