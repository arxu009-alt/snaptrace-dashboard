'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [aiKeySaved, setAiKeySaved] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testingAlert, setTestingAlert] = useState<boolean>(false);
  const [purging, setPurging] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || 'Authenticated User');
      }

      const savedAiKey = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_openai_key') : '';
      if (savedAiKey) {
        setOpenaiKey(savedAiKey);
        setAiKeySaved(true);
      }

      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

      if (projects && projects.length > 0) {
        const p = projects[0];
        setApiKey(p.api_key || '');
        setEmail(p.recipient_email || p.alert_email || '');
        setDiscordWebhook(p.discord_webhook_url || p.discord_webhook || '');
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, discordWebhook }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }

      setStatusMessage({ type: 'success', text: 'Alert notification channels saved successfully!' });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestAlert = async () => {
    if (!apiKey) {
      setStatusMessage({ type: 'error', text: 'No active project API key found.' });
      return;
    }

    setTestingAlert(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/v1/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey,
          message: 'SnapTrace System Alert: Live test notification',
          stackTrace: 'Error: Test alert triggered from Settings panel\n  at Settings.sendTestAlert (/dashboard/settings)',
          environment: 'production',
          url: window.location.href,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Test Alert Dispatched! Check your Discord channel and ${email || 'email inbox'}.`,
        });
      } else {
        throw new Error(data.error || 'Failed to send test alert');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setTestingAlert(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handlePurgeResolved = async () => {
    if (!confirm('Are you sure you want to permanently delete all resolved error logs?')) return;

    setPurging(true);
    try {
      const { error } = await supabase.from('errors').delete().eq('status', 'resolved');
      if (error) throw error;

      setStatusMessage({ type: 'success', text: 'All resolved error logs have been purged.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setPurging(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleSaveAiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (openaiKey.trim()) {
      localStorage.setItem('snaptrace_openai_key', openaiKey.trim());
      setAiKeySaved(true);
      setStatusMessage({ type: 'success', text: 'OpenAI API key saved for AI bug diagnosis!' });
    } else {
      localStorage.removeItem('snaptrace_openai_key');
      setAiKeySaved(false);
      setStatusMessage({ type: 'success', text: 'OpenAI key removed.' });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-8 font-sans selection:bg-yellow-400 selection:text-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Project Settings & Alert Channels</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Configure alert webhooks, BYOK AI copilot keys, and database maintenance tools.
          </p>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold border animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {loading ? (
          /* Custom SnapTrace Brand Pulse Loader */
          <div className="p-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="relative animate-pulse">
              <SnapTraceLogo size="lg" showText={false} />
            </div>
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">Loading Settings...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* 1. Account Profile Card */}
            <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>👤</span> Developer Account Profile
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Your authenticated developer session</p>
                </div>
                <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full text-[10px] font-bold uppercase font-mono">
                  Active Session
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#05070E] p-4 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold font-mono">Account Email</span>
                  <span className="text-slate-200 font-mono block font-semibold">{userEmail}</span>
                </div>
                <div className="bg-[#05070E] p-4 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold font-mono">Active Primary API Key</span>
                  <span className="text-yellow-300 font-mono block truncate">{apiKey || 'No key loaded'}</span>
                </div>
              </div>
            </div>

            {/* 2. Notification Channels Form */}
            <form onSubmit={handleSaveNotifications} className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🔔</span> Notification Channels (Discord & Email)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time exception alerts and deduplicated incident tags are dispatched here.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  disabled={testingAlert}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-yellow-400/30 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto shadow-sm"
                >
                  {testingAlert ? 'Firing Test...' : '🧪 Send Test Alert'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block font-mono">ALERT EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arxu1045@gmail.com"
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-yellow-400 transition"
                  />
                  <p className="text-[11px] text-slate-500 font-mono">
                    Incoming exceptions will trigger email notifications to this recipient.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block font-mono">DISCORD WEBHOOK URL</label>
                  <input
                    type="url"
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-yellow-400 font-mono transition"
                  />
                  <p className="text-[11px] text-slate-500 font-mono">
                    Formatted embeds with occurrence counts will post directly to this Discord channel.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Notification Channels →'}
                </button>
              </div>
            </form>

            {/* 3. BYOK AI Copilot Card */}
            <form onSubmit={handleSaveAiKey} className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>✨</span> BYOK AI Copilot Configuration
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Powers the "Analyze with AI" button inside the Exception Inspect Modal.
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                    aiKeySaved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {aiKeySaved ? '✓ AI Key Active' : 'No Key Set'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block font-mono">OPENAI API KEY (sk-...)</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-yellow-400 font-mono transition"
                />
                <p className="text-[11px] text-slate-500 font-mono">
                  Stored securely in your browser and used exclusively when you click "Analyze with AI".
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  Save AI Key
                </button>
              </div>
            </form>

            {/* 4. Database Maintenance & Purge Card */}
            <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-red-900/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800/80 pb-3">
                <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <span>🧹</span> Database Maintenance & Purge
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Clean up old telemetry records to keep your database fast and lightweight.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-200 font-semibold font-mono">Purge Resolved Errors</p>
                  <p className="text-[11px] text-slate-500">
                    Permanently deletes all exceptions that have been marked as resolved.
                  </p>
                </div>
                <button
                  onClick={handlePurgeResolved}
                  disabled={purging}
                  className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
                >
                  {purging ? 'Purging...' : 'Purge Resolved Logs'}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}