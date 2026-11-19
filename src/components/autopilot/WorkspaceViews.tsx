import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import {
  ApprovalRecord,
  CalendarEventRecord,
  DocumentRecord,
  DriveFileRecord,
  GmailMessageItem,
  ResearchReportRecord,
} from '../../types/autopilot';

interface WorkspaceReconnectProps {
  hasWorkspaceToken: boolean;
  onReconnect: () => void;
}

const WorkspacePromptBanner: React.FC<{ onReconnect: () => void }> = ({ onReconnect }) => (
  <div className="glass-panel rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-400/30">
    <div>
      <h3 className="text-sm font-semibold text-white">
        Workspace Session Required
      </h3>
      <p className="text-xs text-slate-300 mt-1">
        Your in-memory Google Workspace access token is not active for this tab session. Re-authorize with Google to read live Gmail, Calendar, or Drive items.
      </p>
    </div>
    <button
      type="button"
      onClick={onReconnect}
      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
    >
      Reconnect Google Workspace
    </button>
  </div>
);

export const EmailCenterView: React.FC<
  WorkspaceReconnectProps & { onOpenApproval: (a: ApprovalRecord) => void }
> = ({ hasWorkspaceToken, onReconnect, onOpenApproval }) => {
  const [messages, setMessages] = useState<GmailMessageItem[]>([]);
  const [query, setQuery] = useState('in:inbox');
  const [loading, setLoading] = useState(false);
  const [draftingId, setDraftingId] = useState('');
  const [error, setError] = useState('');

  const fetchInbox = async () => {
    if (!hasWorkspaceToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ messages: GmailMessageItem[] }>(
        `/api/workspace/gmail/messages?q=${encodeURIComponent(query)}`
      );
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch Gmail messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasWorkspaceToken) {
      fetchInbox();
    }
  }, [hasWorkspaceToken]);

  const handleDraftReply = async (msg: GmailMessageItem) => {
    setDraftingId(msg.id);
    setError('');
    try {
      const data = await apiFetch<{ approval: ApprovalRecord }>(
        '/api/workspace/gmail/draft-reply',
        {
          method: 'POST',
          body: JSON.stringify({
            from: msg.from,
            subject: msg.subject,
            snippet: msg.bodyPreview || msg.snippet,
          }),
        }
      );
      onOpenApproval(data.approval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to prepare reply draft.');
    } finally {
      setDraftingId('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Smart Email Agent</h2>
          <p className="text-xs text-slate-400">
            Authorized Gmail reader with prompt-injection screening · Replies require explicit Human Approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gmail search query (e.g. is:unread)"
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white w-56"
          />
          <button
            type="button"
            onClick={fetchInbox}
            disabled={!hasWorkspaceToken || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Gmail
          </button>
        </div>
      </div>

      {!hasWorkspaceToken && <WorkspacePromptBanner onReconnect={onReconnect} />}
      {error && (
        <div className="rounded-lg bg-red-500/15 border border-red-400/30 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {hasWorkspaceToken && (
        <div className="space-y-3">
          {loading && (
            <div className="glass-panel rounded-xl p-8 text-center text-xs text-slate-400">
              Scanning authorized Gmail threads...
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="glass-panel rounded-xl p-8 text-center text-xs text-slate-400">
              No messages matched "{query}".
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="glass-panel rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate font-medium text-slate-200">{msg.from}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums shrink-0">{msg.date.slice(0, 22)}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{msg.subject}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {msg.injectionFlagged && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-300">
                      <ShieldAlert className="w-3.5 h-3.5" /> Sanitized
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDraftReply(msg)}
                    disabled={draftingId === msg.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {draftingId === msg.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Prepare Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{msg.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CalendarAgentView: React.FC<
  WorkspaceReconnectProps & { onOpenApproval: (a: ApprovalRecord) => void }
> = ({ hasWorkspaceToken, onReconnect, onOpenApproval }) => {
  const [events, setEvents] = useState<CalendarEventRecord[]>([]);
  const [freeSlots, setFreeSlots] = useState<Array<{ start: string; end: string }>>([]);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState(`${targetDate}T10:00:00Z`);
  const [newEnd, setNewEnd] = useState(`${targetDate}T10:45:00Z`);
  const [staging, setStaging] = useState(false);

  const loadCalendar = async () => {
    if (!hasWorkspaceToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{
        events: CalendarEventRecord[];
        freeSlots: Array<{ start: string; end: string }>;
      }>(`/api/workspace/calendar/events?date=${encodeURIComponent(targetDate)}`);
      setEvents(data.events || []);
      setFreeSlots(data.freeSlots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch Calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasWorkspaceToken) loadCalendar();
  }, [hasWorkspaceToken, targetDate]);

  const handleStageMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setStaging(true);
    try {
      const data = await apiFetch<{ approval: ApprovalRecord }>('/api/approvals/stage', {
        method: 'POST',
        body: JSON.stringify({
          agent: 'Calendar Agent',
          actionType: 'create_calendar_event',
          title: `Schedule "${newTitle.trim()}"`,
          summary: `Create Google Calendar event from ${newStart} to ${newEnd}.`,
          payload: {
            summary: newTitle.trim(),
            startIso: newStart,
            endIso: newEnd,
          },
          riskLevel: 'medium',
        }),
      });
      setNewTitle('');
      onOpenApproval(data.approval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stage calendar event.');
    } finally {
      setStaging(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Calendar Agent</h2>
          <p className="text-xs text-slate-400">
            Live Google Calendar synchronization, free slot detection, and approval-gated scheduling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white tabular-nums"
          />
          <button
            type="button"
            onClick={loadCalendar}
            disabled={!hasWorkspaceToken || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {!hasWorkspaceToken && <WorkspacePromptBanner onReconnect={onReconnect} />}
      {error && (
        <div className="rounded-lg bg-red-500/15 border border-red-400/30 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {hasWorkspaceToken && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 glass-panel rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Upcoming Events</h3>
            {events.length === 0 ? (
              <p className="text-xs text-slate-400 py-6">No events scheduled in the upcoming 7 days.</p>
            ) : (
              <div className="divide-y divide-white/10">
                {events.map((ev) => (
                  <div key={ev.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{ev.summary}</div>
                      <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                        {ev.start.slice(0, 16).replace('T', ' ')} → {ev.end.slice(11, 16)}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </div>
                    </div>
                    {ev.htmlLink && (
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 shrink-0"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="glass-panel rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">
                Open Slots on <span className="tabular-nums">{targetDate}</span>
              </h3>
              {freeSlots.length === 0 ? (
                <p className="text-xs text-slate-400">No open blocks detected between 09:00 and 18:00.</p>
              ) : (
                <div className="space-y-2">
                  {freeSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewStart(slot.start);
                        setNewEnd(slot.end);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-950/60 hover:bg-indigo-500/15 border border-white/10 text-xs text-slate-200 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2 tabular-nums">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                        {slot.start.slice(11, 16)} – {slot.end.slice(11, 16)}
                      </span>
                      <span className="text-indigo-300 font-medium">Use Slot</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleStageMeeting} className="glass-panel rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Propose New Event</h3>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Meeting title"
                className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="rounded-lg bg-slate-950 border border-white/15 px-2.5 py-2 text-[11px] text-white font-mono-code"
                />
                <input
                  type="text"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="rounded-lg bg-slate-950 border border-white/15 px-2.5 py-2 text-[11px] text-white font-mono-code"
                />
              </div>
              <button
                type="submit"
                disabled={staging || !newTitle.trim()}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
              >
                {staging ? 'Staging...' : 'Stage for Approval'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const DocumentsAgentView: React.FC<WorkspaceReconnectProps> = ({
  hasWorkspaceToken,
  onReconnect,
}) => {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFileRecord[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      const saved = await apiFetch<{ documents: DocumentRecord[] }>('/api/documents');
      setDocs(saved.documents || []);
      if (hasWorkspaceToken) {
        const drive = await apiFetch<{ files: DriveFileRecord[] }>(
          '/api/workspace/drive/files'
        );
        setDriveFiles(drive.files || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
    }
  };

  useEffect(() => {
    loadAll();
  }, [hasWorkspaceToken]);

  const handleAnalyzeText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setAnalyzing(true);
    setError('');
    try {
      const data = await apiFetch<{ document: DocumentRecord }>('/api/documents/analyze', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim() || 'Executive Notes',
          content: content.trim(),
        }),
      });
      setDocs((prev) => [data.document, ...prev]);
      setTitle('');
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    setError('');
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const data = await apiFetch<{ document: DocumentRecord }>('/api/documents/analyze', {
        method: 'POST',
        body: JSON.stringify({
          title: file.name,
          mimeType: file.type || 'application/pdf',
          fileBase64: base64,
        }),
      });
      setDocs((prev) => [data.document, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeDriveFile = async (file: DriveFileRecord) => {
    setAnalyzing(true);
    setError('');
    try {
      const data = await apiFetch<{ document: DocumentRecord }>('/api/documents/analyze', {
        method: 'POST',
        body: JSON.stringify({
          title: file.name,
          driveFileId: file.id,
          mimeType: file.mimeType,
        }),
      });
      setDocs((prev) => [data.document, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to summarize Drive file.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Document Intelligence Agent</h2>
          <p className="text-xs text-slate-400">
            Summarize PDFs, analyze Google Drive files, and extract structured action items
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0">
          <Upload className="w-3.5 h-3.5" />
          Upload PDF
          <input
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handlePdfUpload}
            className="hidden"
          />
        </label>
      </div>

      {!hasWorkspaceToken && <WorkspacePromptBanner onReconnect={onReconnect} />}
      {error && (
        <div className="rounded-lg bg-red-500/15 border border-red-400/30 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form onSubmit={handleAnalyzeText} className="lg:col-span-5 glass-panel rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Analyze Text or Report</h3>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
          />
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste contract, meeting transcript, or research notes to summarize..."
            className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-white"
          />
          <button
            type="submit"
            disabled={analyzing || !content.trim()}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? 'Analyzing...' : 'Summarize & Extract Key Points'}
          </button>
        </form>

        <div className="lg:col-span-7 glass-panel rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Google Drive Files</h3>
          {driveFiles.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">
              {hasWorkspaceToken
                ? 'No recent Drive files found.'
                : 'Connect Google Workspace to browse your Google Drive.'}
            </p>
          ) : (
            <div className="divide-y divide-white/10 max-h-64 overflow-y-auto">
              {driveFiles.map((file) => (
                <div key={file.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{file.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{file.mimeType}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAnalyzeDriveFile(file)}
                    disabled={analyzing}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-indigo-300 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Summarize
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Analyzed Knowledge Archive</h3>
        {docs.map((doc) => (
          <div key={doc.id} className="glass-panel rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FileText className="w-4 h-4 text-indigo-400" />
                {doc.title}
              </div>
              <span className="text-xs text-slate-400 tabular-nums">
                {doc.source} · {new Date(doc.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {doc.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ResearchAgentView: React.FC = () => {
  const [reports, setReports] = useState<ResearchReportRecord[]>([]);
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ reports: ResearchReportRecord[] }>('/api/research')
      .then((d) => setReports(d.reports || []))
      .catch(() => {});
  }, []);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || running) return;
    setRunning(true);
    setError('');
    try {
      const data = await apiFetch<{ report: ResearchReportRecord }>('/api/research/run', {
        method: 'POST',
        body: JSON.stringify({ query: query.trim() }),
      });
      setReports((prev) => [data.report, ...prev]);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research execution failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Web Research Agent</h2>
        <p className="text-xs text-slate-400">
          Live Google Search grounding with multi-source synthesis, source citations, and freshness verification
        </p>
      </div>

      <form onSubmit={handleResearch} className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter research topic to compare live web sources..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-white/15 text-sm text-white"
          />
        </div>
        <button
          type="submit"
          disabled={running || !query.trim()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          {running ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Researching...
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5" /> Run Grounded Research
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-500/15 border border-red-400/30 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {reports.map((rep) => (
          <div key={rep.id} className="glass-panel rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">{rep.query}</h3>
              <span className="text-xs text-slate-400 tabular-nums">{rep.freshnessNotes}</span>
            </div>
            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {rep.summary}
            </p>
            {rep.citations && rep.citations.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1">
                <div className="text-[11px] font-semibold text-indigo-300">Verified Citations</div>
                <div className="flex flex-wrap gap-3">
                  {rep.citations.map((c, idx) => (
                    <a
                      key={idx}
                      href={c.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-300 hover:text-blue-200 underline inline-flex items-center gap-1"
                    >
                      {c.title} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
