'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Send, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';

interface ClientProject {
  id: string;
  name: string;
  api_key: string;
  discord_webhook_url?: string;
  slack_webhook_url?: string;
  recipient_email?: string;
  only_production_alerts?: boolean;
  plan_tier?: string;
}

export default function AlertsPage() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [slackWebhook, setSlackWebhook] = useState<string>('');
  const [onlyProdAlerts, setOnlyProdAlerts] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingNotif, setSavingNotif] = useState<boolean>(false);
  const [notifSavedMsg, setNotifSavedMsg] = useState<string | null>(null);

  // Individual test states
  const [testingDiscord, setTestingDiscord] = useState<boolean>(false);
  const [discordTestMsg, setDiscordTestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [testingSlack, setTestingSlack] = useState<boolean>(false);
  const [slackTestMsg, setSlackTestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [planTier, setPlanTier] = useState<string>('free');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null);

  const bindProject = useCallback((p: ClientProject) => {
    setSelectedProject(p);
    setSelectedProjectId(p.id);
    setEmail(p.recipient_email || (p as unknown as Record<string, string>).alert_email || '');
    setDiscordWebhook(p.discord_webhook_url || (p as unknown as Record<string, string>).discord_webhook || '');
    setSlackWebhook(p.slack_webhook_url || (p as unknown as Record<string, string>).slack_webhook || '');
    setOnlyProdAlerts(Boolean(p.only_production_alerts));
    setDiscordTestMsg(null);
    setSlackTestMsg(null);
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (currentUser?.email) {
        const ownerEmail = currentUser.email.toLowerCase();
        setIsOwner(ownerEmail === 'arxu1045@gmail.com' || ownerEmail === 'arxu009@gmail.com');
      }

      // Query Supabase projects table for the authenticated user
      let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (currentUser?.id) {
        query = query.eq('user_id', currentUser.id);
      }
      let { data, error } = await query;

      // Fallback query if no projects found with eq('user_id') (e.g. RLS handles auth filtering automatically)
      if ((!data || data.length === 0) && !error) {
        const fallback = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        if (fallback.data && fallback.data.length > 0) {
          data = fallback.data;
        }
      }

      if (data && data.length > 0) {
        const projectList = data as ClientProject[];
        setProjects(projectList);

        const paidProject = projectList.find((p) => p.plan_tier && p.plan_tier !== 'free');
        const ownerCheck = currentUser?.email && (currentUser.email.toLowerCase() === 'arxu1045@gmail.com' || currentUser.email.toLowerCase() === 'arxu009@gmail.com');
        const resolvedTier = ownerCheck ? 'agency_scale' : (paidProject?.plan_tier || projectList[0]?.plan_tier || 'free').toLowerCase();
        setPlanTier(resolvedTier);

        // If projects exist, automatically select the first project by default so webhook cards immediately display that client project's settings
        const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;
        const target = (savedProjectId && projectList.find((proj) => proj.id === savedProjectId)) || projectList[0];
        
        setSelectedProject(target);
        bindProject(target);
      } else {
        setProjects([]);
        setSelectedProject(null);
        setSelectedProjectId('');
      }
    } catch (err) {
      console.error('Failed to fetch projects in alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [bindProject]);

  useEffect(() => {
    fetchProjects();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProjects();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProjects]);

  const activeProject = selectedProject || projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleSelectProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    setSelectedProject(target);
    bindProject(target);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_selected_project_id', projectId);
      window.dispatchEvent(new Event('snaptrace_project_change'));
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !activeProject) {
      alert('Please select a client project first.');
      return;
    }

    setSavingNotif(true);
    setNotifSavedMsg(null);
    try {
      const updatePayload: Record<string, unknown> = {
        recipient_email: email.trim() || null,
        alert_email: email.trim() || null,
        discord_webhook_url: discordWebhook.trim() || null,
        discord_webhook: discordWebhook.trim() || null,
        slack_webhook_url: slackWebhook.trim() || null,
        slack_webhook: slackWebhook.trim() || null,
        only_production_alerts: onlyProdAlerts,
      };

      const { error } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', selectedProjectId);

      if (error) throw error;

      // Update local projects array so active indicator updates immediately
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProjectId
            ? {
                ...p,
                recipient_email: email.trim() || undefined,
                discord_webhook_url: discordWebhook.trim() || undefined,
                slack_webhook_url: slackWebhook.trim() || undefined,
                only_production_alerts: onlyProdAlerts,
              }
            : p
        )
      );

      setSelectedProject((prev) =>
        prev && prev.id === selectedProjectId
          ? {
              ...prev,
              recipient_email: email.trim() || undefined,
              discord_webhook_url: discordWebhook.trim() || undefined,
              slack_webhook_url: slackWebhook.trim() || undefined,
              only_production_alerts: onlyProdAlerts,
            }
          : prev
      );

      setNotifSavedMsg(`Alert destinations updated for ${activeProject.name}`);
      setTimeout(() => setNotifSavedMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Error saving notifications: ' + msg);
    } finally {
      setSavingNotif(false);
    }
  };

  const handleTestDiscord = async () => {
    if (!discordWebhook.trim()) {
      setDiscordTestMsg({ type: 'error', text: 'Please enter a Discord Webhook URL first.' });
      setTimeout(() => setDiscordTestMsg(null), 3000);
      return;
    }

    setTestingDiscord(true);
    setDiscordTestMsg(null);

    const projectName = selectedProject?.name || 'Client Project';
    try {
      const res = await fetch(discordWebhook.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: `[SnapTrace] Test ping for ${projectName}`,
              description: `Dedicated alert destination verified for **${projectName}**.\nCrash telemetry and error boundaries will be routed to this channel.`,
              color: 38655,
              fields: [
                { name: 'Client Build', value: projectName, inline: true },
                { name: 'Environment', value: 'production', inline: true },
                { name: 'Status', value: 'Active', inline: true },
              ],
              footer: { text: 'SnapTrace Fleet Monitor' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (res.ok || res.status === 204) {
        setDiscordTestMsg({ type: 'success', text: `Test ping sent to Discord for ${projectName}` });
      } else {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send';
      setDiscordTestMsg({ type: 'error', text: `Discord dispatch failed: ${msg}` });
    } finally {
      setTestingDiscord(false);
      setTimeout(() => setDiscordTestMsg(null), 4000);
    }
  };

  const handleTestSlack = async () => {
    if (!slackWebhook.trim()) {
      setSlackTestMsg({ type: 'error', text: 'Please enter a Slack Webhook URL first.' });
      setTimeout(() => setSlackTestMsg(null), 3000);
      return;
    }

    setTestingSlack(true);
    setSlackTestMsg(null);

    const projectName = selectedProject?.name || 'Client Project';
    try {
      await fetch(slackWebhook.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[SnapTrace] Test ping for ${projectName}: Dedicated incident routing verified.`,
        }),
        mode: 'no-cors',
      });

      setSlackTestMsg({ type: 'success', text: `Test payload dispatched to Slack for ${projectName}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send';
      setSlackTestMsg({ type: 'error', text: `Slack dispatch failed: ${msg}` });
    } finally {
      setTestingSlack(false);
      setTimeout(() => setSlackTestMsg(null), 4000);
    }
  };

  const isFreeTier = !isOwner && planTier === 'free';
  const inputCls = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono transition';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <Bell className="w-4 h-4 text-zinc-400" />
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Alert Destinations</h1>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Configure Discord webhooks, Slack routing, and email alert channels for live exception notifications.
          </p>
        </div>

        {/* Free Tier Upgrade Banner */}
        {isFreeTier && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold tracking-wide uppercase">
                  Agency Tier
                </span>
                <span className="text-xs font-medium text-zinc-200">
                  Agency Feature: Dedicated Slack & Discord webhooks per client project are unlocked on Agency Studio ($49/mo).
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                Forward critical production crashes directly into dedicated client channels.
              </p>
            </div>
            <a
              href="https://buy.polar.sh/polar_cl_jtE6KA0k5GWeMhuFWQGB9fsDhRt8rdTwDteFS0Qr44g"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition font-mono shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>Unlock Webhooks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase animate-pulse">Loading channels...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-12 text-center space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100">No Client Projects Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Create a client project first to configure isolated webhook and alert destinations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveNotifications} className="space-y-6">

            {/* 1. CLIENT PROJECT SELECTOR */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3 shadow-sm">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold block">
                CONFIGURE ALERTS FOR CLIENT PROJECT
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleSelectProject(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-600 transition cursor-pointer"
                  >
                    {projects.map((p) => {
                      const hasWebhooks = Boolean(p.discord_webhook_url || p.slack_webhook_url);
                      return (
                        <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-200">
                          {p.name} {hasWebhooks ? '• Webhooks Active' : '• No Webhooks'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedProject && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedProject.discord_webhook_url || selectedProject.slack_webhook_url
                            ? 'bg-emerald-500'
                            : 'bg-zinc-600'
                        }`}
                      />
                      <span>
                        {selectedProject.discord_webhook_url || selectedProject.slack_webhook_url
                          ? 'Routing Active'
                          : 'Not Configured'}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. DEDICATED DESTINATION CARDS */}
            <div className="space-y-4">

              {/* Card 1: Discord Alert Channel */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">Discord Alert Channel</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Formatted crash embeds dispatched directly to a dedicated Discord server channel.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {discordTestMsg && (
                      <span className={'flex items-center gap-1 text-[11px] font-mono ' + (discordTestMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400')}>
                        {discordTestMsg.type === 'success' ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                        {discordTestMsg.text}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleTestDiscord}
                      disabled={testingDiscord || !discordWebhook.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-medium rounded-lg transition cursor-pointer font-mono disabled:opacity-40"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testingDiscord ? 'Pinging...' : 'Test Ping'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-zinc-400 block font-mono uppercase tracking-wider">
                    Discord Webhook URL
                  </label>
                  <input
                    type="url"
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className={inputCls}
                  />
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Tagged with: <span className="text-zinc-400">[SnapTrace] Test ping for {selectedProject?.name || 'Client Project'}</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Slack Alert Channel */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">Slack Alert Channel</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Incoming webhook payload dispatched to client-specific Slack incident channels.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {slackTestMsg && (
                      <span className={'flex items-center gap-1 text-[11px] font-mono ' + (slackTestMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400')}>
                        {slackTestMsg.type === 'success' ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                        {slackTestMsg.text}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleTestSlack}
                      disabled={testingSlack || !slackWebhook.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-medium rounded-lg transition cursor-pointer font-mono disabled:opacity-40"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testingSlack ? 'Pinging...' : 'Test Ping'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-zinc-400 block font-mono uppercase tracking-wider">
                      Slack Incoming Webhook URL
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">Incoming Webhook</span>
                  </div>
                  <input
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/services/T.../B.../..."
                    className={inputCls}
                  />
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Formatted text payload tagged for <span className="text-zinc-400">{selectedProject?.name || 'Client Project'}</span>
                  </p>
                </div>
              </div>

              {/* Card 3: Email Notification Dispatch */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3.5 shadow-sm">
                <div className="pb-3 border-b border-zinc-800/80">
                  <h2 className="text-sm font-semibold text-zinc-100">Email Notification Dispatch</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Immediate crash summary emails dispatched via SMTP to the dedicated project lead.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-zinc-400 block font-mono uppercase tracking-wider">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alerts-team@clientdomain.com"
                    className={inputCls}
                  />
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Receives HTML incident reports with complete stack traces when errors trigger.
                  </p>
                </div>
              </div>

            </div>

            {/* Alert Rules Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="pb-3 border-b border-zinc-800/80 mb-4">
                <h2 className="text-sm font-semibold text-zinc-100">Alert Rules</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Control which environments trigger external notifications.</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-zinc-200 block font-mono uppercase">ONLY ALERT ON PRODUCTION</span>
                  <p className="text-[11px] text-zinc-400 max-w-sm">
                    Mutes Discord, Slack, and email notifications from development and localhost environments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOnlyProdAlerts(!onlyProdAlerts)}
                  aria-label="Toggle production-only alert filter"
                  className={'w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ' + (onlyProdAlerts ? 'bg-zinc-200' : 'bg-zinc-800 border border-zinc-700')}
                >
                  <div className={'w-3.5 h-3.5 rounded-full absolute top-[2px] transition-all ' + (onlyProdAlerts ? 'bg-zinc-950 right-[3px]' : 'bg-zinc-400 left-[3px]')} />
                </button>
              </div>
            </div>

            {/* Save Action & Feedback */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div>
                {notifSavedMsg && (
                  <span className="text-xs font-medium text-emerald-400 font-mono animate-in fade-in flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{notifSavedMsg}</span>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={savingNotif}
                className="bg-zinc-100 text-zinc-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white transition disabled:opacity-50 cursor-pointer shrink-0"
              >
                {savingNotif ? 'Saving...' : 'Save Alert Destinations'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
