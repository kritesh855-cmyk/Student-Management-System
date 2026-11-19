import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  agent:
    | 'Orchestrator Agent'
    | 'Security Agent'
    | 'Email Agent'
    | 'Calendar Agent'
    | 'Document Agent'
    | 'Research Agent'
    | 'Automation Agent';
  action: string;
  description: string;
  requiresApproval: boolean;
  approvalType?:
    | 'send_email'
    | 'create_calendar_event'
    | 'update_calendar_event'
    | 'create_drive_file'
    | 'delete_drive_file';
  status: 'planned' | 'awaiting_approval' | 'running' | 'completed' | 'rejected' | 'failed';
  output?: string;
  verified?: boolean;
  payload?: Record<string, unknown>;
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('owner'),
  preferredLanguage: text('preferred_language').notNull().default('en'),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workflowPlans = pgTable('workflow_plans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  prompt: text('prompt').notNull(),
  language: text('language').notNull().default('en'),
  summary: text('summary').notNull(),
  status: text('status').notNull().default('planned'),
  steps: jsonb('steps').$type<WorkflowStep[]>().notNull().default([]),
  verificationSummary: text('verification_summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  planId: integer('plan_id').references(() => workflowPlans.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description').default(''),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('pending'),
  assignedAgent: text('assigned_agent').notNull().default('Orchestrator Agent'),
  dueAt: text('due_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const approvals = pgTable('approvals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  planId: integer('plan_id').references(() => workflowPlans.id, {
    onDelete: 'cascade',
  }),
  agent: text('agent').notNull(),
  actionType: text('action_type').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  riskLevel: text('risk_level').notNull().default('high'),
  status: text('status').notNull().default('pending'),
  executionResult: jsonb('execution_result').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

export const automations = pgTable('automations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  triggerType: text('trigger_type').notNull().default('manual'),
  stepsTemplate: jsonb('steps_template')
    .$type<Array<{ agent: string; instruction: string }>>()
    .notNull()
    .default([]),
  status: text('status').notNull().default('active'),
  lastRunAt: timestamp('last_run_at'),
  lastStatus: text('last_status'),
  runCount: integer('run_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const memories = pgTable('memories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  category: text('category').notNull().default('preference'),
  content: text('content').notNull(),
  embedding: jsonb('embedding').$type<number[]>().default([]),
  approved: boolean('approved').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  source: text('source').notNull().default('uploaded'),
  driveFileId: text('drive_file_id'),
  mimeType: text('mime_type').default('text/plain'),
  summary: text('summary').default(''),
  extractedKeyPoints: jsonb('extracted_key_points').$type<string[]>().default([]),
  content: text('content').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const researchReports = pgTable('research_reports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  query: text('query').notNull(),
  summary: text('summary').notNull(),
  findings: jsonb('findings')
    .$type<Array<{ heading: string; detail: string; reliability: string }>>()
    .default([]),
  citations: jsonb('citations')
    .$type<Array<{ title: string; uri: string }>>()
    .default([]),
  freshnessNotes: text('freshness_notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  target: text('target').notNull(),
  status: text('status').notNull().default('success'),
  details: text('details').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  workflowPlans: many(workflowPlans),
  tasks: many(tasks),
  approvals: many(approvals),
  automations: many(automations),
  memories: many(memories),
  documents: many(documents),
  researchReports: many(researchReports),
  auditLogs: many(auditLogs),
}));
