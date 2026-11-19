import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { motion } from 'motion/react';
import {
  Activity,
  Bot,
  Calendar,
  CheckSquare,
  FileText,
  Globe,
  LayoutDashboard,
  Loader2,
  Mail,
  Menu,
  Settings,
  ShieldAlert,
  Sparkles,
  Workflow,
  X,
} from 'lucide-react';
import { googleSignIn, initAuth, logout } from './lib/firebase';
import { apiFetch } from './lib/api';
import {
  ApprovalRecord,
  DashboardSection,
  TaskRecord,
  WorkflowPlanRecord,
} from './types/autopilot';
import { GoogleSignInButton } from './components/autopilot/GoogleSignInButton';
import { CommandConsole } from './components/autopilot/CommandConsole';
import { ApprovalModal } from './components/autopilot/ApprovalModal';
import {
  CalendarAgentView,
  DocumentsAgentView,
  EmailCenterView,
  ResearchAgentView,
} from './components/autopilot/WorkspaceViews';
import {
  ActivityHistoryView,
  AutomationsView,
  SettingsIntegrationsView,
  TasksView,
} from './components/autopilot/OperationsViews';

interface OverviewPayload {
  stats: {
    openTasks: number;
    pendingApprovals: number;
    verifiedPlans: number;
    activeAutomations: number;
  };
  recentPlans: WorkflowPlanRecord[];
  pendingApprovals: ApprovalRecord[];
  recentTasks: TaskRecord[];
}

const NAV_ITEMS: {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
  { id: 'automations', label: 'Automations', icon: Workflow },
  { id: 'email', label: 'Email Center', icon: Mail },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'research', label: 'Research', icon: Globe },
  { id: 'activity', label: 'Activity History', icon: Activity },
  { id: 'settings', label: 'Settings & Integrations', icon: Settings },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hasWorkspaceToken, setHasWorkspaceToken] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  const [section, setSection] = useState<DashboardSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [plans, setPlans] = useState<WorkflowPlanRecord[]>([]);
  const [activePlan, setActivePlan] = useState<WorkflowPlanRecord | null>(null);
  const [activeApproval, setActiveApproval] = useState<ApprovalRecord | null>(null);
  const [dailyReport, setDailyReport] = useState<string>('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const refreshData = useCallback(async () => {
    try {
      const [ov, pl] = await Promise.all([
        apiFetch<OverviewPayload>('/api/overview'),
        apiFetch<{ plans: WorkflowPlanRecord[] }>('/api/assistant/plans'),
      ]);
      setOverview(ov);
      setPlans(pl.plans || []);
      if (!activePlan && pl.plans?.length) {
        setActivePlan(pl.plans[0]);
      }
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : 'Unable to sync PostgreSQL workspace.'
      );
    }
  }, [activePlan]);

  useEffect(() => {
    const unsub = initAuth((firebaseUser, wsTokenPresent) => {
      setUser(firebaseUser);
      setHasWorkspaceToken(wsTokenPresent);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError('');
    try {
      const res = await googleSignIn();
      setUser(res.user);
      setHasWorkspaceToken(Boolean(res.accessToken));
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  const handleResolveApproval = async (
    approvalId: number,
    decision: 'approve' | 'reject',
    editedPayload?: Record<string, unknown>
  ) => {
    setGlobalError('');
    try {
      await apiFetch(`/api/approvals/${approvalId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ decision, editedPayload }),
      });
      await refreshData();
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : 'Unable to resolve approval.'
      );
      throw err;
    }
  };

  const handleGenerateDailyReport = async () => {
    setGeneratingReport(true);
    setGlobalError('');
    try {
      const data = await apiFetch<{ report: string }>('/api/reports/daily', {
        method: 'POST',
      });
      setDailyReport(data.report);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : 'Failed to generate daily report.'
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center text-slate-300 text-sm">
        Initializing AutoPilot OS...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#060813] relative overflow-hidden flex items-center justify-center p-6">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.18),transparent_45%)]" />

        <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              AutoPilot OS
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
              Your Personal AI. Your Digital Workforce.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Orchestrate specialized AI agents across Gmail, Google Calendar, Google Drive, and live Web Research—backed by PostgreSQL memory, bilingual Hindi/English voice commands, and mandatory Human Approval gates.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
              <div className="glass-panel rounded-lg p-3">
                <div className="font-semibold text-white">7 Specialized Agents</div>
                <div className="text-slate-400 mt-0.5">Orchestrator, Security, Email, Calendar, Docs, Research, Automation</div>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <div className="font-semibold text-white">Human-in-the-Loop</div>
                <div className="text-slate-400 mt-0.5">Zero silent email sends, calendar invites, or file mutations</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 glass-panel-elevated rounded-2xl p-7 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Sign In to Workspace</h2>
              <p className="text-xs text-slate-400 mt-1">
                Authenticate with Google to unlock PostgreSQL persistence and authorized Workspace agents.
              </p>
            </div>

            <GoogleSignInButton onClick={handleSignIn} loading={signingIn} />

            {authError && (
              <div className="rounded-lg bg-red-500/15 border border-red-400/30 p-3 text-xs text-red-200">
                {authError}
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              OAuth access tokens stay strictly in memory and are cleared immediately when you sign out.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentNav = NAV_ITEMS.find((n) => n.id === section);

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#080B1A] sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-base font-bold tracking-tight text-white">
            AutoPilot OS
          </div>
          <div className="text-[11px] text-indigo-300 mt-0.5">
            Personal AI Workforce
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            const pendingCount =
              item.id === 'activity' ? overview?.stats.pendingApprovals || 0 : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600/30 to-blue-600/20 text-white border border-indigo-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {pendingCount > 0 && (
                  <span className="text-[11px] font-mono-code text-amber-300 tabular-nums">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2 text-xs">
          <div className="truncate font-medium text-white">{user.email}</div>
          <div className="text-[11px] text-slate-400">
            Workspace: {hasWorkspaceToken ? 'Authorized' : 'Reconnect needed'}
          </div>
          <button
            type="button"
            onClick={handleSignIn}
            className="w-full py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-200 cursor-pointer"
          >
            {hasWorkspaceToken ? 'Refresh Workspace Token' : 'Connect Workspace'}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-[#080B1A] border-r border-white/10 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="font-bold text-white">AutoPilot OS</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="mt-3 space-y-1 flex-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                      section === item.id
                        ? 'bg-indigo-600/30 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[#060813]/85 backdrop-blur-xl border-b border-white/10 px-6 py-3.5 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md bg-white/5 text-slate-200"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-sm font-semibold text-white whitespace-nowrap truncate">
              {currentNav?.label}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setSection('assistant')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Orchestrator
            </button>
            <button
              type="button"
              onClick={() => setSection('email')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Gmail
            </button>
            <button
              type="button"
              onClick={() => setSection('calendar')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setSection('activity')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Approvals ({overview?.stats.pendingApprovals || 0})
            </button>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setSection('assistant')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Command
            </button>
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
            {globalError && (
              <div className="rounded-lg bg-red-500/15 border border-red-400/30 px-4 py-3 text-xs text-red-200 flex items-center justify-between gap-4">
                <span>{globalError}</span>
                <button
                  type="button"
                  onClick={() => setGlobalError('')}
                  className="underline font-semibold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            <motion.div
              key={section}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {section === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Strip */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: 'Open Tasks',
                        value: overview?.stats.openTasks ?? 0,
                        sub: 'Priority tracked',
                      },
                      {
                        label: 'Pending Approvals',
                        value: overview?.stats.pendingApprovals ?? 0,
                        sub: 'Awaiting your consent',
                      },
                      {
                        label: 'Verified Workflows',
                        value: overview?.stats.verifiedPlans ?? 0,
                        sub: 'Completed & audited',
                      },
                      {
                        label: 'Active Automations',
                        value: overview?.stats.activeAutomations ?? 0,
                        sub: 'Ready templates',
                      },
                    ].map((kpi) => (
                      <div key={kpi.label} className="glass-panel rounded-xl p-4">
                        <div className="text-xs text-slate-400">{kpi.label}</div>
                        <div className="text-2xl font-bold text-white tabular-nums mt-1">
                          {kpi.value}
                        </div>
                        <div className="text-[11px] text-indigo-300 mt-0.5">{kpi.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Primary AI Command Console */}
                  <CommandConsole
                    activePlan={activePlan}
                    onPlanCreated={(p) => setActivePlan(p)}
                    onPlanUpdated={(p) => setActivePlan(p)}
                    onRefreshData={refreshData}
                  />

                  {/* Daily Productivity Report + Pending Approvals */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 glass-panel rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            Daily Productivity & Decision Support Report
                          </h3>
                          <p className="text-xs text-slate-400">
                            Synthesized from your live tasks, workflows, and audit logs
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateDailyReport}
                          disabled={generatingReport}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {generatingReport ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling...
                            </>
                          ) : (
                            'Generate Report'
                          )}
                        </button>
                      </div>

                      {dailyReport ? (
                        <div className="rounded-lg bg-slate-950/60 border border-white/10 p-4 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {dailyReport}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-4">
                          Click "Generate Report" to compile today’s priorities, completed work, and pending decisions.
                        </p>
                      )}
                    </div>

                    <div className="lg:col-span-5 glass-panel rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">
                          Human Approval Queue
                        </h3>
                        <button
                          type="button"
                          onClick={() => setSection('activity')}
                          className="text-xs text-indigo-300 hover:text-indigo-200 cursor-pointer"
                        >
                          View All
                        </button>
                      </div>

                      {!overview?.pendingApprovals.length ? (
                        <p className="text-xs text-slate-400 py-4">
                          No risky actions awaiting approval right now.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {overview.pendingApprovals.map((app) => (
                            <div
                              key={app.id}
                              className="rounded-lg bg-slate-950/60 border border-amber-400/25 p-3 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{app.agent}</span>
                                </div>
                                <div className="text-xs text-white font-medium truncate mt-0.5">
                                  {app.title}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveApproval(app)}
                                className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold text-amber-200 cursor-pointer shrink-0"
                              >
                                Review
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {section === 'assistant' && (
                <div className="space-y-6">
                  <CommandConsole
                    activePlan={activePlan}
                    onPlanCreated={(p) => setActivePlan(p)}
                    onPlanUpdated={(p) => setActivePlan(p)}
                    onRefreshData={refreshData}
                  />

                  <div className="glass-panel rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-white">
                      Recent Multi-Agent Workflow Plans
                    </h3>
                    <div className="divide-y divide-white/10">
                      {plans.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setActivePlan(p)}
                          className="w-full text-left py-3 flex items-center justify-between gap-4 hover:bg-white/5 px-2 rounded cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate">
                              {p.prompt}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Plan #{p.id} · {p.steps.length} steps · {p.status.replace('_', ' ')}
                            </div>
                          </div>
                          <span className="text-xs text-indigo-300 shrink-0">Inspect</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {section === 'tasks' && <TasksView />}

              {section === 'automations' && (
                <AutomationsView
                  onExecutedPlan={(plan) => {
                    setActivePlan(plan);
                    setSection('assistant');
                    refreshData();
                  }}
                />
              )}

              {section === 'email' && (
                <EmailCenterView
                  hasWorkspaceToken={hasWorkspaceToken}
                  onReconnect={handleSignIn}
                  onOpenApproval={(a) => setActiveApproval(a)}
                />
              )}

              {section === 'calendar' && (
                <CalendarAgentView
                  hasWorkspaceToken={hasWorkspaceToken}
                  onReconnect={handleSignIn}
                  onOpenApproval={(a) => setActiveApproval(a)}
                />
              )}

              {section === 'documents' && (
                <DocumentsAgentView
                  hasWorkspaceToken={hasWorkspaceToken}
                  onReconnect={handleSignIn}
                />
              )}

              {section === 'research' && <ResearchAgentView />}

              {section === 'activity' && (
                <ActivityHistoryView onReviewApproval={(a) => setActiveApproval(a)} />
              )}

              {section === 'settings' && (
                <SettingsIntegrationsView
                  userEmail={user.email || ''}
                  hasWorkspaceToken={hasWorkspaceToken}
                  onReconnect={handleSignIn}
                  onDisconnect={() => logout()}
                />
              )}
            </motion.div>
          </div>
        </main>
      </div>

      {activeApproval && (
        <ApprovalModal
          approval={activeApproval}
          onClose={() => setActiveApproval(null)}
          onResolve={handleResolveApproval}
        />
      )}
    </div>
  );
}
