export type TemplateChoice = 'classic' | 'modern' | 'executive';

export type AccentColor = '#1E3A8A' | '#0F172A' | '#14532D' | '#7F1D1D';

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  gpa: string;
  coursework: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  techStack: string;
  projectUrl: string;
  description: string;
}

export interface SkillGroupItem {
  id: string;
  category: string;
  items: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueYear: string;
  credentialId: string;
}

export interface ResumeRecord {
  id: string;
  title: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  summary: string;
  templateChoice: TemplateChoice;
  accentColor: AccentColor;
  educations: EducationItem[];
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillGroupItem[];
  certifications: CertificationItem[];
  updatedAt: string;
}

export interface DjangoFileEntry {
  path: string;
  name: string;
  folder: string;
  language: string;
  lines: number;
  content: string;
}
