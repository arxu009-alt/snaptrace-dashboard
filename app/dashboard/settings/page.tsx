'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'claude'>('gemini');
  const [aiKey, setAiKey] = useState<string>('');
  const [showAiKey, setShowAiKey] = useState<boolean>(false);
  const [aiKeySaved, setAiKeySaved] = useState<boolean>(false);

  // Notification State
  const [email, setEmail] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Local Button Feedback States
  const [loading, setLoading] = useState<boolean>(true);
  const [savingNotif, setSavingNotif] = useState<boolean>(false);
  const [notifSavedMsg, setNotifSavedMsg] = useState<string | null>(null);
  
  const [savingAi, setSavingAi] = useState<boolean>(false);
  const [aiSavedMsg, setAiSavedMsg] = useState<string | null>(null);

  const [testingAlert, setTestingAlert] = useState<boolean>(false);
  const [testAlertMsg, setTestAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [purging, setPurging] = useState<boolean>(false);
  const [purgeMsg, setPurgeMsg] = useState<string | null>(null);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Live Lemon Squeezy Checkout URLs
  const PRO_CHECKOUT_URL = 'https://snaptrace.lemonsqueezy.com/checkout/buy/b7355f43-3ece-4fa9-a91e-ba847f3cd52e';
  const TEAM_CHECKOUT_URL = 'https://snaptrace.lemonsqueezy.com/checkout/buy/913b182d-9db4-41c3-9c93-ed68d83eaae0';

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const uEmail = user.email || '';
        setUserEmail(uEmail);

        if (uEmail.toLowerCase() === 'arxu1045@gmail.com' || uEmail.toLowerCase() === 'arxu009@gmail.com') {
          setIsOwner(true);
        }
      }

      // Load AI Configuration
      const savedProvider = (typeof window !== 'undefined' ? localStorage.getItem('snaptrace_ai_provider') : 'gemini') as any;
      const savedKey = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_ai_key') || localStorage.getItem('snaptrace_openai_key') : '';
      
      if (savedProvider) setAiProvider(savedProvider);
      if (savedKey) {
        setAiKey(savedKey);
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

  // 1. Save Notifications with Inline Button Feedback
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotif(true);
    setNotifSavedMsg(null);

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

      setNotifSavedMsg('✓ Notification Channels Saved!');
      setTimeout(() => setNotifSavedMsg(null), 3000);
    } catch (err: any) {
      alert(`Error saving notifications: ${err.message}`);
    } finally {
      setSavingNotif(false);
    }
  };

  // 2. Save AI Key with Inline Button Feedback
  const handleSaveAiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAi(true);

    if (aiKey.trim()) {
      localStorage.setItem('snaptrace_ai_provider', aiProvider);
      localStorage.setItem('snaptrace_ai_key', aiKey.trim());
      localStorage.setItem('snaptrace_openai_key', aiKey.trim()); // backwards compat
      setAiKeySaved(true);
      setAiSavedMsg('✓ AI Key Saved Successfully!');
    } else {
      localStorage.removeItem('snaptrace_ai_key');
      localStorage.removeItem('snaptrace_openai_key');
      setAiKeySaved(false);
      setAiSavedMsg('Key Removed.');
    }

    setSavingAi(false);
    setTimeout(() => setAiSavedMsg(null), 3000);
  };

  // 3. Send Test Alert with Inline Feedback
  const handleSendTestAlert = async () => {
    if (!apiKey) {
      alert('No active project API key found.');
      return;
    }

    setTestingAlert(true);
    setTestAlertMsg(null);

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
        setTestAlertMsg({
          type: 'success',
          text: `✓ Alert Dispatched! Check Discord & ${email || 'email'}.`,
        });
      } else {
        throw new Error(data.error || 'Failed to send test alert');
      }
    } catch (err: any) {
      setTestAlertMsg({ type: 'error', text: `Failed: ${err.message}` });
    } finally {
      setTestingAlert(false);
      setTimeout(() => setTestAlertMsg(null), 4000);
    }
  };

  // 4. Purge Logs with Inline Feedback
  const handlePurgeResolved = async () => {
    if (!confirm('Are you sure you want to permanently delete all resolved error logs?')) return;

    setPurging(true);
    try {
      const { error } = await supabase.from('errors').delete().eq('status', 'resolved');
      if (error) throw error;

      setPurgeMsg('✓ All resolved error logs purged!');
      setTimeout(() => setPurgeMsg(null), 3000);
    } catch (err: any) {
      alert(`Purge failed: ${err.message}`);
    } finally {
      setPurging(false);
    }
  };

  const handleUpgradeCheckout = (checkoutUrl: string) => {
    const finalUrl = `${checkoutUrl}?checkout[email]=${encodeURIComponent(userEmail)}&checkout[custom][project_id]=${encodeURIComponent(projectId)}`;
    window.open(finalUrl, '_blank');
  };

  const getTierBadge = () => {
    if (isOwner) {
      return (
        <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black rounded-full text-xs font-mono uppercase tracking-wider shadow-sm">
          👑 OWNER PRO (Unlimited)
        </span>
      );
    }
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
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xl">💎</span>
                    <h2 className="text-base font-bold text-white">Subscription & Plan Status</h2>
                    {getTierBadge()}
                  </div>
                  <p className="text-xs text-slate-400">
                    {isOwner
                      ? 'Owner account with full unlimited access to all features.'
                      : currentTier === 'free'
                      ? 'You are on the free tier (10,000 events/mo included).'
                      : 'Active Pro telemetry subscription with in-dashboard AI diagnostics.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleUpgradeCheckout(PRO_CHECKOUT_URL)}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 cursor-pointer"
                  >
                    ⚡ Starter Pro ($9/mo)
                  </button>
                  <button
                    onClick={() => handleUpgradeCheckout(TEAM_CHECKOUT_URL)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    👑 Team Scale ($29/mo)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#05070E] rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Monthly Event Cap</span>
                  <span className="text-slate-200 font-semibold">
                    {isOwner ? 'Unlimited (Owner)' : currentTier === 'team_scale' ? '1,000,000' : currentTier === 'starter_pro' ? '150,000' : '10,000'} events
                  </span>
                </div>
                <div className="p-3 bg-[#05070E] rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Data Retention</span>
                  <span className="text-slate-200 font-semibold">
                    {isOwner ? '90 Days' : currentTier === 'team_scale' ? '90 Days' : currentTier === 'starter_pro' ? '30 Days' : '14 Days'}
                  </span>
                </div>
                <div className="p-3 bg-[#05070E] rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">In-Dashboard AI</span>
                  <span className={isOwner || currentTier !== 'free' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {isOwner || currentTier !== 'free' ? '✓ Unlimited Copilot Active' : 'Prompt Export Only'}
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

            {/* 3. Notification Channels Form with INLINE SAVE FEEDBACK */}
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

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {testAlertMsg && (
                    <span className={`text-xs font-mono font-bold ${testAlertMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {testAlertMsg.text}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSendTestAlert}
                    disabled={testingAlert}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-yellow-400/30 text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                  >
                    {testingAlert ? 'Firing Test...' : '🧪 Send Test Alert'}
                  </button>
                </div>
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

              {/* Direct Inline Feedback beside Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {notifSavedMsg && (
                  <span className="text-xs font-bold text-emerald-400 font-mono animate-in fade-in">
                    {notifSavedMsg}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingNotif}
                  className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingNotif ? 'Saving...' : 'Save Notification Channels →'}
                </button>
              </div>
            </form>

            {/* 4. BYOK AI Copilot Card (Single Clean Input + Provider Selector + Inline Save) */}
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

              <div className="space-y-3">
                
                {/* Provider Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block font-mono">SELECT AI MODEL PROVIDER</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as any)}
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-yellow-300 font-bold focus:outline-none focus:border-yellow-400 cursor-pointer"
                  >
                    <option value="gemini">Google Gemini (100% Free - Gemini 1.5 Flash)</option>
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="claude">Anthropic Claude</option>
                  </select>
                </div>

                {/* Single Input Box with Eye Toggle */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block font-mono">
                    {aiProvider === 'gemini' ? 'GOOGLE GEMINI API KEY (AIza... / AQ...)' : aiProvider === 'openai' ? 'OPENAI API KEY (sk-...)' : 'ANTHROPIC CLAUDE API KEY (sk-ant...)'}
                  </label>
                  
                  <div className="relative">
                    <input
                      type={showAiKey ? 'text' : 'password'}
                      value={aiKey}
                      onChange={(e) => setAiKey(e.target.value)}
                      placeholder={aiProvider === 'gemini' ? 'Paste your Google Gemini Key here' : 'sk-proj-...'}
                      className="w-full bg-[#05070E] border border-slate-800 rounded-xl pl-4 pr-12 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiKey(!showAiKey)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      {showAiKey ? '🙈 Hide' : '👁️ Show'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Stored securely in your local browser storage and used directly when you click "Analyze with AI".
                  </p>
                </div>

              </div>

              {/* Direct Inline Feedback beside Save Button */}
              <div className="flex items-center justify-end gap-3 pt-1">
                {aiSavedMsg && (
                  <span className="text-xs font-bold text-emerald-400 font-mono animate-in fade-in">
                    {aiSavedMsg}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingAi}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  {savingAi ? 'Saving...' : 'Save AI Configuration →'}
                </button>
              </div>
            </form>

            {/* 5. Database Purge with INLINE FEEDBACK */}
            <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-red-900/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800/80 pb-3">
                <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <span>🧹</span> Database Maintenance & Purge
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Permanently deletes all exceptions that have been marked as resolved.
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-200 font-semibold font-mono">Purge Resolved Errors</p>
                  <p className="text-[11px] text-slate-500">
                    Permanently deletes all exceptions that have been marked as resolved.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {purgeMsg && (
                    <span className="text-xs font-bold text-emerald-400 font-mono animate-in fade-in">
                      {purgeMsg}
                    </span>
                  )}
                  <button
                    onClick={handlePurgeResolved}
                    disabled={purging}
                    className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
                  >
                    {purging ? 'Purging...' : 'Purge Resolved Logs'}
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