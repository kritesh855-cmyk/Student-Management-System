export type DashboardSection =
  | 'overview'
  | 'assistant'
  | 'tasks'
  | 'automations'
  | 'email'
  | 'calendar'
  | 'documents'
  | 'research'
  | 'activity'
  | 'settings';

export interface WorkflowStepItem {
  id: string;
  stepNumber: number;
  agent: string;
  action: string;
  description: string;
  requiresApproval: boolean;
  approvalType?: string;
  status: 'planned' | 'awaiting_approval' | 'running' | 'completed' | 'rejected' | 'failed';
  output?: string;
  verified?: boolean;
  payload?: Record<string, unknown>;
}

export interface WorkflowPlanRecord {
  id: number;
  prompt: string;
  language: string;
  summary: string;
  status: string;
  steps: WorkflowStepItem[];
  verificationSummary?: string;
  createdAt: string;
}

export interface TaskRecord {
  id: number;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  assignedAgent: string;
  dueAt?: string | null;
  createdAt: string;
}

export interface ApprovalRecord {
  id: number;
  planId?: number | null;
  agent: string;
  actionType: string;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  riskLevel: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  executionResult?: Record<string, unknown> | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface AutomationRecord {
  id: number;
  name: string;
  description: string;
  triggerType: string;
  stepsTemplate: Array<{ agent: string; instruction: string }>;
  status: string;
  lastRunAt?: string | null;
  lastStatus?: string | null;
  runCount: number;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  bodyPreview: string;
  injectionFlagged: boolean;
  injectionReasons: string[];
}

export interface CalendarEventRecord {
  id: string;
  summary: string;
  start: string;
  end: string;
  location: string;
  attendeesCount: number;
  status: string;
  htmlLink?: string;
}

export interface DriveFileRecord {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface DocumentRecord {
  id: number;
  title: string;
  source: string;
  mimeType: string;
  summary: string;
  extractedKeyPoints: string[];
  createdAt: string;
}

export interface ResearchReportRecord {
  id: number;
  query: string;
  summary: string;
  citations: Array<{ title: string; uri: string }>;
  freshnessNotes: string;
  createdAt: string;
}

export interface MemoryRecord {
  id: number;
  category: string;
  content: string;
  approved: boolean;
  createdAt: string;
}

export interface AuditLogRecord {
  id: number;
  actor: string;
  action: string;
  target: string;
  status: string;
  details: string;
  createdAt: string;
}
