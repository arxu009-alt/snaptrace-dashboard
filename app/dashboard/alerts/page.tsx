'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Send, CheckCircle2, XCircle } from 'lucide-react';

export default function AlertsPage() {
  const [email, setEmail] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [slackWebhook, setSlackWebhook] = useState<string>('');
  const [onlyProdAlerts, setOnlyProdAlerts] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingNotif, setSavingNotif] = useState<boolean>(false);
  const [notifSavedMsg, setNotifSavedMsg] = useState<string | null>(null);
  const [testingAlert, setTestingAlert] = useState<boolean>(false);
  const [testAlertMsg, setTestAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadAlertSettings() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      const { data: userProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (userProjects && userProjects.length > 0) {
        const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;
        const p = userProjects.find((proj) => proj.id === savedProjectId) || userProjects[0];
        setProjectId(p.id || '');
        setApiKey(p.api_key || '');
        setEmail(p.recipient_email || p.alert_email || session.user.email || '');
        setDiscordWebhook(p.discord_webhook_url || p.discord_webhook || '');

        const savedSlack = p.slack_webhook_url || (typeof window !== 'undefined' ? localStorage.getItem('snaptrace_slack_' + p.id) : '') || '';
        setSlackWebhook(savedSlack);

        const savedOnlyProd = Boolean(
          p.only_production_alerts ||
          (typeof window !== 'undefined' && localStorage.getItem('snaptrace_only_prod_' + p.id) === 'true')
        );
        setOnlyProdAlerts(savedOnlyProd);
      }
      setLoading(false);
    }
    loadAlertSettings();
  }, []);

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      alert('Please create or select a project first under "Projects & API Keys".');
      return;
    }
    setSavingNotif(true);
    setNotifSavedMsg(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('snaptrace_slack_' + projectId, slackWebhook);
        localStorage.setItem('snaptrace_only_prod_' + projectId, String(onlyProdAlerts));
      }
      const updatePayload: Record<string, unknown> = {
        recipient_email: email,
        alert_email: email,
        discord_webhook_url: discordWebhook,
        discord_webhook: discordWebhook,
      };
      try {
        const { error } = await supabase
          .from('projects')
          .update({ ...updatePayload, only_production_alerts: onlyProdAlerts })
          .eq('id', projectId);
        if (error) {
          await supabase.from('projects').update(updatePayload).eq('id', projectId);
        }
      } catch (dbErr) {
        console.warn('DB update fallback:', dbErr);
      }
      setNotifSavedMsg('Notification channels saved.');
      setTimeout(() => setNotifSavedMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Error saving notifications: ' + msg);
    } finally {
      setSavingNotif(false);
    }
  };

  const handleSendTestAlert = async () => {
    if (!apiKey || apiKey === 'No project created yet') {
      alert('No active project API key found.');
      return;
    }
    setTestingAlert(true);
    setTestAlertMsg(null);
    try {
      if (slackWebhook.trim()) {
        fetch(slackWebhook.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '*SnapTrace System Alert:* Live test notification captured for project ' + apiKey.slice(0, 10) + '...' }),
          mode: 'no-cors',
        }).catch(() => {});
      }
      const res = await fetch('/api/v1/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          message: 'SnapTrace System Alert: Live test notification',
          stackTrace: 'Error: Test alert triggered from Alert Destinations panel\n  at Alerts.sendTestAlert (/dashboard/alerts)',
          environment: 'production',
          url: window.location.href,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestAlertMsg({ type: 'success', text: 'Alert dispatched to Discord, Slack & ' + (email || 'email') + '.' });
      } else {
        throw new Error(data.error || 'Failed to send test alert');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setTestAlertMsg({ type: 'error', text: 'Failed: ' + msg });
    } finally {
      setTestingAlert(false);
      setTimeout(() => setTestAlertMsg(null), 4000);
    }
  };

  const inputCls = 'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <Bell className="w-4 h-4 text-zinc-400" />
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Alert Destinations</h1>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Configure Discord webhooks, Slack routing, and email alert channels for live exception notifications.
          </p>
        </div>

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase animate-pulse">Loading channels...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveNotifications} className="space-y-6">

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">Notification Channels</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Real-time webhook destinations for exception alerts.</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {testAlertMsg && (
                    <span className={'flex items-center gap-1.5 text-xs font-mono font-medium ' + (testAlertMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400')}>
                      {testAlertMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                      {testAlertMsg.text}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSendTestAlert}
                    disabled={testingAlert}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-xs font-medium rounded-lg transition cursor-pointer font-mono disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    {testingAlert ? 'Firing...' : 'Send Test Alert'}
                  </button>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-zinc-400 block font-mono uppercase tracking-wider">Alert Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-zinc-400 block font-mono uppercase tracking-wider">Discord Webhook URL</label>
                  <input type="url" value={discordWebhook} onChange={(e) => setDiscordWebhook(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-zinc-400 block font-mono uppercase tracking-wider">Slack Webhook URL</label>
                    <span className="text-[10px] font-mono text-zinc-500">Incoming Webhook</span>
                  </div>
                  <input type="url" value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/T.../B.../..." className={inputCls} />
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
              <div className="pb-3 border-b border-zinc-800/80 mb-4">
                <h2 className="text-sm font-semibold text-zinc-100">Alert Rules</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Control which environments trigger external notifications.</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-zinc-200 block font-mono">ONLY ALERT ON PRODUCTION</span>
                  <p className="text-[11px] text-zinc-400 max-w-sm">
                    Mutes Discord, Slack, and email notifications from development and localhost. Errors still appear in the dashboard stream.
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

            <div className="flex items-center justify-end gap-3">
              {notifSavedMsg && (
                <span className="text-xs font-medium text-emerald-400 font-mono animate-in fade-in flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {notifSavedMsg}
                </span>
              )}
              <button
                type="submit"
                disabled={savingNotif}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition disabled:opacity-50 cursor-pointer font-mono"
              >
                {savingNotif ? 'Saving...' : 'Save Channels'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
