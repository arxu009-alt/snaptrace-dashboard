'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import Link from 'next/link';

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [aiKeySaved, setAiKeySaved] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [currentTier, setCurrentTier] = useState<string>('free');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testingAlert, setTestingAlert] = useState<boolean>(false);
  const [purging, setPurging] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Live Lemon Squeezy Checkout URLs
  const PRO_CHECKOUT_URL = 'https://snaptrace.lemonsqueezy.com/checkout/buy/b7355f43-3ece-4fa9-a91e-ba847f3cd52e';
  const TEAM_CHECKOUT_URL = 'https://snaptrace.lemonsqueezy.com/checkout/buy/913b182d-9db4-41c3-9c93-ed68d83eaae0';

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
        setProjectId(p.id || '');
        setApiKey(p.api_key || '');
        setEmail(p.recipient_email || p.alert_email || '');
        setDiscordWebhook(p.discord_webhook_url || p.discord_webhook || '');
        setCurrentTier(p.plan_tier || 'free');
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

  // Direct checkout link launcher with prefilled user email & metadata
  const handleUpgradeCheckout = (checkoutUrl: string) => {
    const finalUrl = `${checkoutUrl}?checkout[email]=${encodeURIComponent(userEmail)}&checkout[custom][project_id]=${encodeURIComponent(projectId)}`;
    window.open(finalUrl, '_blank');
  };

  const getTierBadge = () => {
    if (currentTier === 'team_scale') {
      return <span className="px-3 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold font-mono uppercase">Team Scale ($29/mo)</span>;
    }
    if (currentTier === 'starter_pro') {
      return <span className="px-3 py-1 bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 rounded-full text-xs font-bold font-mono uppercase">Starter Pro ($9/mo)</span>;
    }
    return <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-bold font-mono uppercase">Developer Free ($0/mo)</span>;
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-8 font-sans selection:bg-yellow-400 selection:text-slate-950 animate-in fade-in duration-200">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Project Settings & Subscription</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Manage your billing plan, notification webhooks, BYOK AI keys, and database maintenance.
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
          <div className="p-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="relative animate-pulse">
              <SnapTraceLogo size="lg" showText={false} />
            </div>
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">Loading Settings...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* 1. Subscription & Billing Plan Card */}
            <div className="bg-gradient-to-b from-[#0e1424] to-[#070b14] border-2 border-yellow-400/40 rounded-3xl p-6 shadow-2xl space-y-5 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">💎</span>
                    <h2 className="text-base font-bold text-white">Current Subscription Tier</h2>
                    {getTierBadge()}
                  </div>
                  <p className="text-xs text-slate-400">
                    {currentTier === 'free'
                      ? 'You are on the free tier (10,000 events/mo included).'
                      : 'Active Pro telemetry plan with unlimited BYOK AI diagnostics.'}
                  </p>
                </div>

                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 self-start sm:self-auto cursor-pointer"
                >
                  {currentTier === 'free' ? '⚡ Upgrade Plan ($9/mo) →' : 'Change Plan'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#05070E] rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Monthly Event Cap</span>
                  <span className="text-slate-200 font-semibold">{currentTier === 'team_scale' ? '1,000,000' : currentTier === 'starter_pro' ? '150,000' : '10,000'} events</span>
                </div>
                <div className="p-3 bg-[#05070E] rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Data Retention</span>
                  <span className="text-slate-200 font-semibold">{currentTier === 'team_scale' ? '90 Days' : currentTier === 'starter_pro' ? '30 Days' : '14 Days'}</span>
                </div>
                <div className="p-3 bg-[#05070E] rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">In-Dashboard AI</span>
                  <span className={currentTier === 'free' ? 'text-slate-400' : 'text-emerald-400 font-bold'}>
                    {currentTier === 'free' ? 'Prompt Export Only' : '✓ Unlimited Copilot Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Developer Account Profile */}
            <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>👤</span> Developer Account Profile
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Your authenticated credentials</p>
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
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold font-mono">Primary API Key</span>
                  <span className="text-yellow-300 font-mono block truncate">{apiKey || 'No key loaded'}</span>
                </div>
              </div>
            </div>

            {/* 3. Notification Channels Form */}
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

            {/* 4. BYOK AI Copilot Card */}
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

            {/* 5. Database Purge */}
            <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-red-900/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800/80 pb-3">
                <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <span>🧹</span> Database Maintenance & Purge
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Permanently deletes all exceptions that have been marked as resolved.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handlePurgeResolved}
                  disabled={purging}
                  className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {purging ? 'Purging...' : 'Purge Resolved Logs'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Upgrade Plan Modal with Direct Lemon Squeezy Integration */}
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans">
            <div className="bg-[#090D16] border-2 border-yellow-400/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>⚡</span> Upgrade SnapTrace Plan
                  </h3>
                  <p className="text-xs text-slate-400">Unlock higher event capacity and in-dashboard AI diagnosis.</p>
                </div>
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Starter Pro Option ($9/mo) */}
                <div className="bg-[#05070E] border-2 border-yellow-400 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-yellow-300 transition">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest font-mono">Most Popular</span>
                    <h4 className="text-base font-bold text-white">Starter Pro</h4>
                    <div className="text-2xl font-black text-white">$9 <span className="text-xs text-slate-400 font-normal">/ mo flat</span></div>
                    <ul className="space-y-1.5 text-xs text-slate-300 pt-2">
                      <li>✓ 150,000 events/mo</li>
                      <li>✓ 30-day retention</li>
                      <li>✓ In-Dashboard AI Copilot</li>
                      <li>✓ Unlimited projects</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => handleUpgradeCheckout(PRO_CHECKOUT_URL)}
                    className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
                  >
                    Upgrade to Starter Pro ($9) →
                  </button>
                </div>

                {/* Team Scale Option ($29/mo) */}
                <div className="bg-[#05070E] border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-purple-400 transition">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">High Traffic</span>
                    <h4 className="text-base font-bold text-white">Team Scale</h4>
                    <div className="text-2xl font-black text-white">$29 <span className="text-xs text-slate-400 font-normal">/ mo flat</span></div>
                    <ul className="space-y-1.5 text-xs text-slate-300 pt-2">
                      <li>✓ 1,000,000 events/mo</li>
                      <li>✓ 90-day retention</li>
                      <li>✓ Priority alert delivery</li>
                      <li>✓ Multi-seat team invites</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => handleUpgradeCheckout(TEAM_CHECKOUT_URL)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition"
                  >
                    Upgrade to Team Scale ($29) →
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}