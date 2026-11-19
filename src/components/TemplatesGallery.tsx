import React from 'react';
import { Check } from 'lucide-react';
import { ResumeRecord, TemplateChoice } from '../types/resume';
import { ResumePreview } from './ResumePreview';

interface TemplatesGalleryProps {
  resume: ResumeRecord;
  onSelectTemplate: (template: TemplateChoice) => void;
}

const TEMPLATE_META: {
  id: TemplateChoice;
  title: string;
  audience: string;
  description: string;
  djangoFile: string;
}[] = [
  {
    id: 'classic',
    title: 'Classic Academic',
    audience: 'Campus placements · Research internships · University CVs',
    description:
      'Traditional serif typography with centered header, ruled section dividers, and high ATS parser accuracy.',
    djangoFile: 'resumes/templates/resumes/templates_pdf/classic.html',
  },
  {
    id: 'modern',
    title: 'Modern Minimal',
    audience: 'Software engineering · Product startups · Tech roles',
    description:
      'Clean geometric sans hierarchy with crisp typographic contrast and left-aligned metadata.',
    djangoFile: 'resumes/templates/resumes/templates_pdf/modern.html',
  },
  {
    id: 'executive',
    title: 'Executive Split',
    audience: 'Full-stack portfolios · Data science · Lead roles',
    description:
      'Two-column editorial grid pairing a structured skills sidebar with a primary chronological experience track.',
    djangoFile: 'resumes/templates/resumes/templates_pdf/executive.html',
  },
];

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({
  resume,
  onSelectTemplate,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          ATS-Ready Resume Templates
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Each layout maps directly to a corresponding Django HTML/PDF template in the submitted codebase.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {TEMPLATE_META.map((tpl) => {
          const isActive = resume.templateChoice === tpl.id;
          const previewRecord: ResumeRecord = { ...resume, templateChoice: tpl.id };

          return (
            <div
              key={tpl.id}
              className={`bg-white rounded-lg border flex flex-col overflow-hidden transition-colors ${
                isActive ? 'border-blue-900' : 'border-slate-200'
              }`}
            >
              <div className="p-5 border-b border-slate-200 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-900">{tpl.title}</h2>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{tpl.audience}</p>
                  <p className="mt-2.5 text-sm text-slate-700 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono-code text-slate-500 truncate">
                    {tpl.djangoFile}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectTemplate(tpl.id)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'bg-blue-900 text-white hover:bg-blue-800'
                    }`}
                  >
                    {isActive ? 'Open in Builder' : 'Apply Template'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-100 p-4 h-[380px] overflow-hidden relative">
                <div className="origin-top-left scale-[0.44] w-[227%] pointer-events-none select-none shadow-sm">
                  <ResumePreview resume={previewRecord} compact />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
