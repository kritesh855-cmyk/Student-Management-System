import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import {
  ApprovalRecord,
  AuditLogRecord,
  AutomationRecord,
  MemoryRecord,
  TaskRecord,
  WorkflowPlanRecord,
} from '../../types/autopilot';

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('auto');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadTasks = async () => {
    const data = await apiFetch<{ tasks: TaskRecord[] }>('/api/tasks');
    setTasks(data.tasks || []);
  };

  useEffect(() => {
    loadTasks().catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data = await apiFetch<{ task: TaskRecord }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), priority }),
    });
    setTasks((prev) => [data.task, ...prev]);
    setTitle('');
  };

  const toggleStatus = async (task: TaskRecord) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    const data = await apiFetch<{ task: TaskRecord }>(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
  };

  const handleDelete = async (id: number) => {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const visible = tasks.filter((t) =>
    filterStatus === 'all' ? true : t.status === filterStatus
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">My Tasks & Priority Queue</h2>
          <p className="text-xs text-slate-400">
            AI priority detection automatically classifies urgent & critical deliverables
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
          {['all', 'pending', 'completed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize cursor-pointer whitespace-nowrap shrink-0 ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreate} className="glass-panel rounded-xl p-4 flex flex-wrap gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Add task (e.g., "Urgent: Review vendor contract before 5 PM")'
          className="flex-1 min-w-[220px] rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-white"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
        >
          <option value="auto">Auto Detect Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </form>

      <div className="glass-panel rounded-xl divide-y divide-white/10">
        {visible.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No tasks in this view. Plan a workflow or add a task above.
          </div>
        ) : (
          visible.map((task) => (
            <div key={task.id} className="p-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => toggleStatus(task)}
                className="flex items-start gap-3 text-left flex-1 cursor-pointer"
              >
                <CheckCircle2
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    task.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <div>
                  <div
                    className={`text-sm font-medium ${
                      task.status === 'completed'
                        ? 'line-through text-slate-500'
                        : 'text-white'
                    }`}
                  >
                    {task.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Priority: <span className="capitalize text-slate-200">{task.priority}</span> ·{' '}
                    {task.assignedAgent}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(task.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const AutomationsView: React.FC<{
  onExecutedPlan: (plan: WorkflowPlanRecord) => void;
}> = ({ onExecutedPlan }) => {
  const [automations, setAutomations] = useState<AutomationRecord[]>([]);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    const data = await apiFetch<{ automations: AutomationRecord[] }>('/api/automations');
    setAutomations(data.automations || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const handleRun = async (id: number) => {
    setRunningId(id);
    try {
      const data = await apiFetch<{
        automation: AutomationRecord;
        plan: WorkflowPlanRecord;
      }>(`/api/automations/${id}/run`, { method: 'POST' });
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? data.automation : a))
      );
      onExecutedPlan(data.plan);
    } finally {
      setRunningId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    const data = await apiFetch<{ automation: AutomationRecord }>('/api/automations', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        stepsTemplate: [
          { agent: 'Orchestrator Agent', instruction: description.trim() },
        ],
      }),
    });
    setAutomations((prev) => [data.automation, ...prev]);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Workflow Automation Engine</h2>
        <p className="text-xs text-slate-400">
          Reusable multi-agent workflows with safe execution tracking and approval gates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {automations.map((auto) => (
          <div key={auto.id} className="glass-panel rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs text-indigo-300 font-medium tabular-nums">
                Runs: {auto.runCount} · {auto.lastStatus ? `Last: ${auto.lastStatus}` : 'Ready'}
              </div>
              <h3 className="text-sm font-bold text-white">{auto.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{auto.description}</p>
            </div>
            <button
              type="button"
              onClick={() => handleRun(auto.id)}
              disabled={runningId === auto.id}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
            >
              {runningId === auto.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Execute Workflow
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="glass-panel rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Create Custom Automation Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow name"
            className="rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Multi-step instruction for the orchestrator..."
            className="md:col-span-2 rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Save Automation
        </button>
      </form>
    </div>
  );
};

export const ActivityHistoryView: React.FC<{
  onReviewApproval: (a: ApprovalRecord) => void;
}> = ({ onReviewApproval }) => {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);

  const load = async () => {
    const [aData, lData] = await Promise.all([
      apiFetch<{ approvals: ApprovalRecord[] }>('/api/approvals'),
      apiFetch<{ logs: AuditLogRecord[] }>('/api/audit-logs'),
    ]);
    setApprovals(aData.approvals || []);
    setLogs(lData.logs || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">
          Human Approval Center & Audit Trail
        </h2>
        <p className="text-xs text-slate-400">
          Every sensitive action and agent execution is logged to PostgreSQL for complete accountability
        </p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Approval Queue</h3>
          <span className="text-xs text-slate-400 tabular-nums">
            {approvals.filter((a) => a.status === 'pending').length} pending
          </span>
        </div>
        <div className="divide-y divide-white/10">
          {approvals.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No approval requests staged yet.
            </div>
          ) : (
            approvals.map((app) => (
              <div key={app.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">
                    {app.agent} · {app.actionType} ·{' '}
                    <span className="capitalize text-slate-200">{app.status}</span>
                  </div>
                  <div className="text-sm font-medium text-white mt-0.5">{app.title}</div>
                </div>
                {app.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => onReviewApproval(app)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-semibold text-amber-200 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Review & Decide
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Immutable Audit Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5">
                  <td className="py-2.5 px-4 font-mono-code text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-white whitespace-nowrap">
                    {log.actor}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">{log.action}</td>
                  <td className="py-2.5 px-4 capitalize text-indigo-300 whitespace-nowrap">
                    {log.status.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const SettingsIntegrationsView: React.FC<{
  userEmail: string;
  hasWorkspaceToken: boolean;
  onReconnect: () => void;
  onDisconnect: () => void;
}> = ({ userEmail, hasWorkspaceToken, onReconnect, onDisconnect }) => {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [category, setCategory] = useState('preference');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('en');

  const loadMemories = async () => {
    const data = await apiFetch<{ memories: MemoryRecord[] }>('/api/memories');
    setMemories(data.memories || []);
  };

  useEffect(() => {
    loadMemories().catch(() => {});
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const data = await apiFetch<{ memory: MemoryRecord }>('/api/memories', {
      method: 'POST',
      body: JSON.stringify({ category, content: content.trim() }),
    });
    setMemories((prev) => [data.memory, ...prev]);
    setContent('');
  };

  const handleDeleteMemory = async (id: number) => {
    await apiFetch(`/api/memories/${id}`, { method: 'DELETE' });
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    await apiFetch('/api/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ preferredLanguage: lang }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Settings, Security & Memory</h2>
        <p className="text-xs text-slate-400">
          Manage OAuth integrations, bilingual preferences, and approved semantic memory vectors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Google Workspace OAuth 2.0</h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              {hasWorkspaceToken ? 'Authorized in Memory' : 'Sign-In Active'}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Account: <strong className="text-white">{userEmail}</strong>
            <br />
            Access tokens are held strictly in memory and cleared on sign out.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReconnect}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
            >
              Authorize / Refresh Workspace
            </button>
            <button
              type="button"
              onClick={onDisconnect}
              className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 text-xs font-medium text-slate-200 cursor-pointer"
            >
              Revoke & Sign Out
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Assistant Language & Guardrails</h3>
          <div className="flex items-center gap-2">
            {[
              { id: 'en', label: 'English (Default)' },
              { id: 'hi', label: 'हिंदी (Hindi)' },
              { id: 'bilingual', label: 'Bilingual EN + HI' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleLanguageChange(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                  language === opt.id
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Security Agent blocks silent sending of emails, calendar mutations, and Drive writes. Untrusted external email/PDF content is sanitized against prompt injection.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Personal Knowledge Memory (Semantic Vector RAG)
          </h3>
          <p className="text-xs text-slate-400">
            Approved facts embedded via Gemini Embedding 2 and retrieved automatically during planning
          </p>
        </div>

        <form onSubmit={handleAddMemory} className="flex flex-wrap gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
          >
            <option value="preference">Preference</option>
            <option value="fact">Personal Fact</option>
            <option value="contact">Key Contact</option>
            <option value="context">Project Context</option>
          </select>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g., Prefer morning meetings between 10 AM and 12 PM IST."
            className="flex-1 min-w-[220px] rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
          >
            Save Memory
          </button>
        </form>

        <div className="divide-y divide-white/10">
          {memories.map((mem) => (
            <div key={mem.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-200">
                <span className="font-semibold text-indigo-300 capitalize">
                  [{mem.category}]
                </span>{' '}
                {mem.content}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteMemory(mem.id)}
                className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
