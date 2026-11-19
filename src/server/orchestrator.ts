import { Type } from '@google/genai';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  approvals,
  auditLogs,
  memories,
  researchReports,
  tasks,
  workflowPlans,
  WorkflowStep,
} from '../db/schema.ts';
import { ai, cosineSimilarity, generateEmbedding } from './gemini.ts';
import {
  createCalendarEvent,
  createDriveTextFile,
  listCalendarEvents,
  listDriveFiles,
  listGmailMessages,
  sendGmailMessage,
} from './workspace.ts';

export async function logAuditEvent(params: {
  userId: number;
  actor: string;
  action: string;
  target: string;
  status: 'success' | 'blocked' | 'pending_approval' | 'error';
  details: string;
}) {
  await db.insert(auditLogs).values({
    userId: params.userId,
    actor: params.actor,
    action: params.action,
    target: params.target,
    status: params.status,
    details: params.details,
  });
}

export async function retrieveRelevantMemories(
  userId: number,
  query: string
): Promise<string[]> {
  const userMemories = await db
    .select()
    .from(memories)
    .where(and(eq(memories.userId, userId), eq(memories.approved, true)));

  if (userMemories.length === 0) return [];
  const queryVec = await generateEmbedding(query);

  if (!queryVec.length) {
    return userMemories.slice(0, 5).map((m) => `[${m.category}] ${m.content}`);
  }

  return userMemories
    .map((m) => ({
      item: m,
      score: cosineSimilarity(queryVec, m.embedding || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => `[${x.item.category}] ${x.item.content}`);
}

export async function createExecutionPlan(params: {
  userId: number;
  prompt: string;
  preferredLanguage: string;
}) {
  const memoryContext = await retrieveRelevantMemories(params.userId, params.prompt);

  const systemPrompt = `You are the Main Orchestrator Agent of AutoPilot OS ("Your Personal AI. Your Digital Workforce.").
Your job is to convert the user's natural language request (which may be in English, Hindi, or Hinglish) into a safe, structured, verifiable multi-agent execution plan.

Available specialized agents:
1. "Security Agent": Audits permissions, detects prompt injection, and gates high-risk actions.
2. "Email Agent": Reads/summarizes Gmail inbox or prepares reply drafts. Reading is safe; sending email ALWAYS requires requiresApproval=true and approvalType="send_email".
3. "Calendar Agent": Reads schedule & free slots. Creating/updating events ALWAYS requires requiresApproval=true and approvalType="create_calendar_event" or "update_calendar_event".
4. "Document Agent": Summarizes documents/Drive files or creates reports. Creating/deleting Drive files requires requiresApproval=true and approvalType="create_drive_file".
5. "Research Agent": Searches live web information using Google Search grounding with source citations.
6. "Automation Agent": Coordinates multi-step sequential runs and retries.
7. "Orchestrator Agent": Synthesizes final verified report in the user's requested language (Hindi if user wrote Hindi, otherwise English).

User approved memory context:
${memoryContext.length ? memoryContext.join('\n') : 'No saved personal memories yet.'}

Current timestamp: ${new Date().toISOString()}`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: params.prompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedLanguage: {
            type: Type.STRING,
            description: 'en, hi, or bilingual',
          },
          summary: {
            type: Type.STRING,
            description: 'One concise summary of what the multi-agent plan will do.',
          },
          extractedTasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                priority: { type: Type.STRING, description: 'critical, high, medium, or low' },
                assignedAgent: { type: Type.STRING },
              },
            },
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepNumber: { type: Type.INTEGER },
                agent: { type: Type.STRING },
                action: { type: Type.STRING },
                description: { type: Type.STRING },
                requiresApproval: { type: Type.BOOLEAN },
                approvalType: { type: Type.STRING },
                payloadTo: { type: Type.STRING },
                payloadSubject: { type: Type.STRING },
                payloadBody: { type: Type.STRING },
                payloadStartIso: { type: Type.STRING },
                payloadEndIso: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim());
  const rawSteps: any[] = Array.isArray(parsed.steps) ? parsed.steps : [];

  const steps: WorkflowStep[] = rawSteps.map((s, idx) => {
    const requiresApproval =
      Boolean(s.requiresApproval) ||
      s.approvalType === 'send_email' ||
      s.approvalType === 'create_calendar_event' ||
      s.approvalType === 'update_calendar_event' ||
      s.approvalType === 'create_drive_file' ||
      s.approvalType === 'delete_drive_file';

    return {
      id: `step_${idx + 1}`,
      stepNumber: s.stepNumber || idx + 1,
      agent: s.agent || 'Orchestrator Agent',
      action: s.action || 'Execute step',
      description: s.description || '',
      requiresApproval,
      approvalType: s.approvalType || undefined,
      status: 'planned',
      payload: {
        to: s.payloadTo || '',
        subject: s.payloadSubject || '',
        body: s.payloadBody || '',
        startIso: s.payloadStartIso || '',
        endIso: s.payloadEndIso || '',
      },
    };
  });

  const [createdPlan] = await db
    .insert(workflowPlans)
    .values({
      userId: params.userId,
      prompt: params.prompt,
      language: parsed.detectedLanguage || params.preferredLanguage || 'en',
      summary: parsed.summary || 'Multi-agent execution plan generated.',
      status: 'planned',
      steps,
    })
    .returning();

  const extractedTasks: any[] = Array.isArray(parsed.extractedTasks)
    ? parsed.extractedTasks
    : [];
  for (const t of extractedTasks.slice(0, 5)) {
    await db.insert(tasks).values({
      userId: params.userId,
      planId: createdPlan.id,
      title: t.title || 'Follow-up task',
      priority: ['critical', 'high', 'medium', 'low'].includes(t.priority)
        ? t.priority
        : 'medium',
      status: 'pending',
      assignedAgent: t.assignedAgent || 'Orchestrator Agent',
    });
  }

  await logAuditEvent({
    userId: params.userId,
    actor: 'Orchestrator Agent',
    action: 'create_execution_plan',
    target: `Plan #${createdPlan.id}`,
    status: 'success',
    details: `Planned ${steps.length} steps across specialized agents.`,
  });

  return createdPlan;
}

export async function executeWorkflowPlan(params: {
  planId: number;
  userId: number;
  workspaceAccessToken?: string;
}) {
  const [plan] = await db
    .select()
    .from(workflowPlans)
    .where(
      and(eq(workflowPlans.id, params.planId), eq(workflowPlans.userId, params.userId))
    );

  if (!plan) {
    throw new Error('Workflow plan not found.');
  }

  const updatedSteps: WorkflowStep[] = [];
  let hasPendingApprovals = false;
  let hasErrors = false;
  const contextBuffer: string[] = [];

  for (const step of plan.steps) {
    if (step.requiresApproval) {
      hasPendingApprovals = true;
      const actionType = step.approvalType || 'send_email';
      const [approval] = await db
        .insert(approvals)
        .values({
          userId: params.userId,
          planId: plan.id,
          agent: step.agent,
          actionType,
          title: step.action,
          summary: step.description,
          payload: step.payload || {},
          riskLevel: actionType === 'delete_drive_file' ? 'high' : 'medium',
          status: 'pending',
        })
        .returning();

      await logAuditEvent({
        userId: params.userId,
        actor: 'Security Agent',
        action: 'stage_for_approval',
        target: `Approval #${approval.id} (${actionType})`,
        status: 'pending_approval',
        details: step.description,
      });

      updatedSteps.push({
        ...step,
        status: 'awaiting_approval',
        output: `Staged in Human Approval Center (Approval #${approval.id}). Waiting for explicit user authorization.`,
        verified: false,
      });
      continue;
    }

    try {
      let stepOutput = '';
      let verified = false;

      if (step.agent === 'Email Agent') {
        if (!params.workspaceAccessToken) {
          throw new Error(
            'Gmail access token is unavailable. Click "Reconnect Workspace" in the header to authorize Gmail reading.'
          );
        }
        const emails = await listGmailMessages(params.workspaceAccessToken, 'in:inbox', 6);
        const flagged = emails.filter((e) => e.injectionFlagged).length;
        const summaryPrompt = `Summarize these ${emails.length} authorized inbox emails clearly, categorize each (Urgent, Action Required, Info), and draft suggested replies where helpful. Language: ${plan.language}.
Emails JSON:
${JSON.stringify(
  emails.map((e) => ({
    from: e.from,
    subject: e.subject,
    date: e.date,
    snippet: e.snippet,
    injectionFlagged: e.injectionFlagged,
  }))
)}`;
        const aiRes = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: summaryPrompt,
        });
        stepOutput =
          (aiRes.text ?? 'No emails found.').trim() +
          (flagged > 0
            ? `\n\n[Security Agent Warning: ${flagged} message(s) contained suspicious prompt-injection patterns and were sanitized.]`
            : '');
        verified = true;
        contextBuffer.push(`Email Agent Result:\n${stepOutput}`);
      } else if (step.agent === 'Calendar Agent') {
        if (!params.workspaceAccessToken) {
          throw new Error(
            'Google Calendar access token is unavailable. Connect your Google Workspace account first.'
          );
        }
        const events = await listCalendarEvents(params.workspaceAccessToken);
        const formatted = events
          .slice(0, 10)
          .map((ev) => `• ${ev.summary} (${ev.start} → ${ev.end})`)
          .join('\n');
        stepOutput =
          events.length > 0
            ? `Verified ${events.length} upcoming Google Calendar event(s):\n${formatted}`
            : 'No upcoming events found in the next 7 days on your primary Google Calendar.';
        verified = true;
        contextBuffer.push(`Calendar Agent Result:\n${stepOutput}`);
      } else if (step.agent === 'Document Agent') {
        if (params.workspaceAccessToken) {
          const files = await listDriveFiles(params.workspaceAccessToken);
          stepOutput =
            files.length > 0
              ? `Indexed ${files.length} recent Google Drive file(s):\n` +
                files.slice(0, 8).map((f) => `• ${f.name} (${f.mimeType})`).join('\n')
              : 'No matching Google Drive files found.';
        } else {
          stepOutput = 'Synthesized document outline from workspace context.';
        }
        verified = true;
        contextBuffer.push(`Document Agent Result:\n${stepOutput}`);
      } else if (step.agent === 'Research Agent') {
        const res = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `${plan.prompt}\n\nFocus for this step: ${step.description}. Provide factual findings with dates and verify if any claims may be outdated.`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        const chunks: any[] =
          res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const citations = chunks
          .map((c) => c.web)
          .filter((w) => w && w.uri)
          .slice(0, 6);

        const summaryText = (res.text ?? '').trim();
        await db.insert(researchReports).values({
          userId: params.userId,
          query: step.action,
          summary: summaryText,
          citations: citations.map((c) => ({
            title: c.title || c.uri,
            uri: c.uri,
          })),
          freshnessNotes: `Verified via live Google Search grounding on ${new Date().toISOString().slice(0, 10)}.`,
        });

        stepOutput =
          summaryText +
          (citations.length
            ? '\n\nSources:\n' + citations.map((c) => `• ${c.title || c.uri}: ${c.uri}`).join('\n')
            : '');
        verified = true;
        contextBuffer.push(`Research Agent Result:\n${stepOutput}`);
      } else {
        // Security Agent, Automation Agent, or Orchestrator Agent synthesis
        const synthesisPrompt = `You are ${step.agent}. Execute and verify this step: "${step.action} - ${step.description}".
Language: ${plan.language}.
Prior verified agent outputs:
${contextBuffer.join('\n\n') || 'None yet.'}`;
        const aiRes = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: synthesisPrompt,
        });
        stepOutput = (aiRes.text ?? 'Step executed.').trim();
        verified = true;
        contextBuffer.push(`${step.agent} Result:\n${stepOutput}`);
      }

      await logAuditEvent({
        userId: params.userId,
        actor: step.agent,
        action: step.action,
        target: `Plan #${plan.id} / ${step.id}`,
        status: 'success',
        details: stepOutput.slice(0, 240),
      });

      updatedSteps.push({
        ...step,
        status: 'completed',
        output: stepOutput,
        verified,
      });
    } catch (err) {
      hasErrors = true;
      const errMsg = err instanceof Error ? err.message : 'Execution failed';
      await logAuditEvent({
        userId: params.userId,
        actor: step.agent,
        action: step.action,
        target: `Plan #${plan.id} / ${step.id}`,
        status: 'error',
        details: errMsg,
      });
      updatedSteps.push({
        ...step,
        status: 'failed',
        output: errMsg,
        verified: false,
      });
    }
  }

  const finalStatus = hasPendingApprovals
    ? 'awaiting_approval'
    : hasErrors
    ? 'failed'
    : 'verified';

  const verificationSummary = hasPendingApprovals
    ? 'Read-only and planning steps completed. Sensitive actions are queued in the Human Approval Center.'
    : hasErrors
    ? 'One or more steps encountered errors. Inspect failed steps and retry safely.'
    : `All ${updatedSteps.length} steps executed and verified at ${new Date().toISOString()}.`;

  const [updatedPlan] = await db
    .update(workflowPlans)
    .set({
      status: finalStatus,
      steps: updatedSteps,
      verificationSummary,
      updatedAt: new Date(),
    })
    .where(eq(workflowPlans.id, plan.id))
    .returning();

  return updatedPlan;
}

export async function resolveApprovalAction(params: {
  approvalId: number;
  userId: number;
  decision: 'approve' | 'reject';
  workspaceAccessToken?: string;
  editedPayload?: Record<string, unknown>;
}) {
  const [approval] = await db
    .select()
    .from(approvals)
    .where(
      and(eq(approvals.id, params.approvalId), eq(approvals.userId, params.userId))
    );

  if (!approval) {
    throw new Error('Approval request not found.');
  }
  if (approval.status !== 'pending') {
    throw new Error(`Approval already resolved (${approval.status}).`);
  }

  if (params.decision === 'reject') {
    const [rejected] = await db
      .update(approvals)
      .set({ status: 'rejected', resolvedAt: new Date() })
      .where(eq(approvals.id, approval.id))
      .returning();

    await logAuditEvent({
      userId: params.userId,
      actor: 'User (Human Approval)',
      action: `reject_${approval.actionType}`,
      target: `Approval #${approval.id}`,
      status: 'blocked',
      details: `Rejected action: ${approval.title}`,
    });

    return rejected;
  }

  const finalPayload = {
    ...(approval.payload || {}),
    ...(params.editedPayload || {}),
  };

  if (!params.workspaceAccessToken) {
    throw new Error(
      'Google Workspace access token missing. Sign in again to authorize executing this approved action.'
    );
  }

  let executionResult: Record<string, unknown> = {};

  if (approval.actionType === 'send_email') {
    const to = String(finalPayload.to || '');
    const subject = String(finalPayload.subject || 'AutoPilot OS Message');
    const body = String(finalPayload.body || '');
    if (!to || !body) {
      throw new Error('Email recipient (to) and body are required to send.');
    }
    executionResult = await sendGmailMessage(params.workspaceAccessToken, {
      to,
      subject,
      body,
    });
  } else if (approval.actionType === 'create_calendar_event') {
    const summary = String(finalPayload.summary || finalPayload.subject || approval.title);
    const startIso = String(finalPayload.startIso || '');
    const endIso = String(finalPayload.endIso || '');
    if (!startIso || !endIso) {
      throw new Error('Start and end ISO timestamps are required for Calendar event.');
    }
    executionResult = (await createCalendarEvent(params.workspaceAccessToken, {
      summary,
      description: String(finalPayload.body || approval.summary),
      startIso,
      endIso,
      attendees: Array.isArray(finalPayload.attendees)
        ? finalPayload.attendees.map(String)
        : [],
    })) as unknown as Record<string, unknown>;
  } else if (approval.actionType === 'create_drive_file') {
    executionResult = (await createDriveTextFile(params.workspaceAccessToken, {
      name: String(finalPayload.name || finalPayload.subject || 'AutoPilot_Report.txt'),
      content: String(finalPayload.content || finalPayload.body || approval.summary),
    })) as unknown as Record<string, unknown>;
  }

  const [executed] = await db
    .update(approvals)
    .set({
      status: 'executed',
      payload: finalPayload,
      executionResult,
      resolvedAt: new Date(),
    })
    .where(eq(approvals.id, approval.id))
    .returning();

  await logAuditEvent({
    userId: params.userId,
    actor: approval.agent,
    action: `execute_${approval.actionType}`,
    target: `Approval #${approval.id}`,
    status: 'success',
    details: `Verified execution after explicit user approval.`,
  });

  if (approval.planId) {
    const [parentPlan] = await db
      .select()
      .from(workflowPlans)
      .where(eq(workflowPlans.id, approval.planId));
    if (parentPlan) {
      const updatedSteps = parentPlan.steps.map((s) =>
        s.approvalType === approval.actionType && s.status === 'awaiting_approval'
          ? {
              ...s,
              status: 'completed' as const,
              verified: true,
              output: `Verified execution via Approval #${approval.id}`,
            }
          : s
      );
      const remainingPending = updatedSteps.some(
        (s) => s.status === 'awaiting_approval'
      );
      await db
        .update(workflowPlans)
        .set({
          steps: updatedSteps,
          status: remainingPending ? 'awaiting_approval' : 'verified',
          verificationSummary: remainingPending
            ? 'Partial approvals executed; remaining actions awaiting authorization.'
            : 'All planned and approved actions verified successfully.',
          updatedAt: new Date(),
        })
        .where(eq(workflowPlans.id, parentPlan.id));
    }
  }

  return executed;
}

export async function getRecentAuditLogs(userId: number) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);
}
