'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);
  const [nameSavedMsg, setNameSavedMsg] = useState<string | null>(null);

  // Password Update State
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [aiKey, setAiKey] = useState<string>('');
  const [showAiKey, setShowAiKey] = useState<boolean>(false);
  const [aiKeySaved, setAiKeySaved] = useState<boolean>(false);

  // Notification State
  const [email, setEmail] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [slackWebhook, setSlackWebhook] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Feedback States
  const [loading, setLoading] = useState<boolean>(true);
  const [savingNotif, setSavingNotif] = useState<boolean>(false);
  const [notifSavedMsg, setNotifSavedMsg] = useState<string | null>(null);
  
  const [savingAi, setSavingAi] = useState<boolean>(false);
  const [aiSavedMsg, setAiSavedMsg] = useState<string | null>(null);

  const [testingAlert, setTestingAlert] = useState<boolean>(false);
  const [testAlertMsg, setTestAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [purging, setPurging] = useState<boolean>(false);
  const [purgeMsg, setPurgeMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const user = session.user;
      const uEmail = user.email || '';
      setUserEmail(uEmail);

      const currentName = user.user_metadata?.full_name || user.user_metadata?.name || uEmail.split('@')[0] || '';
      setDisplayName(currentName);

      const ownerCheck = uEmail.toLowerCase() === 'arxu1045@gmail.com' || uEmail.toLowerCase() === 'arxu009@gmail.com';
      setIsOwner(ownerCheck);

      const savedProvider = (typeof window !== 'undefined' ? localStorage.getItem('snaptrace_ai_provider') : 'gemini') as any;
      const savedKey = typeof window !== 'undefined' ? (localStorage.getItem('snaptrace_ai_key') || localStorage.getItem('snaptrace_openai_key')) : '';
      
      if (savedProvider) setAiProvider(savedProvider);
      if (savedKey) {
        setAiKey(savedKey);
        setAiKeySaved(true);
      }

      const { data: userProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userProjects && userProjects.length > 0) {
        const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;
        const p = userProjects.find((proj) => proj.id === savedProjectId) || userProjects[0];

        setProjectId(p.id || '');
        setApiKey(p.api_key || '');
        setEmail(p.recipient_email || p.alert_email || '');
        setDiscordWebhook(p.discord_webhook_url || p.discord_webhook || '');
        
        const storageSlackKey = 'snaptrace_slack_' + p.id;
        const savedSlack = p.slack_webhook_url || (typeof window !== 'undefined' ? localStorage.getItem(storageSlackKey) : '') || '';
        setSlackWebhook(savedSlack);
      } else {
        setProjectId('');
        setApiKey('No project created yet');
        setEmail(uEmail);
        setDiscordWebhook('');
        setSlackWebhook('');
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSavingName(true);
    setNameSavedMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() },
      });

      if (error) throw error;

      setNameSavedMsg('✓ Display name updated!');
      setTimeout(() => setNameSavedMsg(null), 3000);
    } catch (err: any) {
      alert('Failed to update display name: ' + err.message);
    } finally {
      setSavingName(false);
    }
  };

  // Secure Password Update Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match. Please re-enter.' });
      return;
    }

    setUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMsg({ type: 'success', text: '✓ Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3500);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      alert('Please create or select a project first under "API Keys & Projects".');
      return;
    }

    setSavingNotif(true);
    setNotifSavedMsg(null);

    try {
      if (typeof window !== 'undefined') {
        const storageSlackKey = 'snaptrace_slack_' + projectId;
        localStorage.setItem(storageSlackKey, slackWebhook);
      }

      const updatePayload: any = {
        recipient_email: email,
        alert_email: email,
        discord_webhook_url: discordWebhook,
        discord_webhook: discordWebhook,
      };

      try {
        await supabase.from('projects').update(updatePayload).eq('id', projectId);
      } catch (dbErr) {
        console.warn('DB update fallback:', dbErr);
      }

      setNotifSavedMsg('✓ Notification Channels Saved!');
      setTimeout(() => setNotifSavedMsg(null), 3000);
    } catch (err: any) {
      alert('Error saving notifications: ' + err.message);
    } finally {
      setSavingNotif(false);
    }
  };

  const handleSaveAiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAi(true);

    if (aiKey.trim()) {
      localStorage.setItem('snaptrace_ai_provider', aiProvider);
      localStorage.setItem('snaptrace_ai_key', aiKey.trim());
      localStorage.setItem('snaptrace_openai_key', aiKey.trim());
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
          body: JSON.stringify({
            text: '🚨 *SnapTrace System Alert:* Live test notification captured for project ' + apiKey.slice(0, 10) + '...',
          }),
          mode: 'no-cors',
        }).catch(() => {});
      }

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
          text: '✓ Alert Dispatched! Check Discord, Slack & ' + (email || 'email') + '.',
        });
      } else {
        throw new Error(data.error || 'Failed to send test alert');
      }
    } catch (err: any) {
      setTestAlertMsg({ type: 'error', text: 'Failed: ' + err.message });
    } finally {
      setTestingAlert(false);
      setTimeout(() => setTestAlertMsg(null), 4000);
    }
  };

  const handlePurgeResolved = async () => {
    if (!confirm('Are you sure you want to permanently delete all resolved error logs?')) return;

    setPurging(true);
    try {
      const { error } = await supabase.from('errors').delete().eq('status', 'resolved');
      if (error) throw error;

      setPurgeMsg('✓ All resolved error logs purged!');
      setTimeout(() => setPurgeMsg(null), 3000);
    } catch (err: any) {
      alert('Purge failed: ' + err.message);
    } finally {
      setPurging(false);
    }
  };

  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'M';
  const displayToken = showApiKey
    ? apiKey
    : (apiKey.slice(0, 10) + '••••••••••••••••' + apiKey.slice(-8));

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-8 font-sans selection:bg-yellow-400 selection:text-slate-950 animate-in fade-in duration-200">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Project Settings & Developer Profile</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Manage your developer identity, security credentials, notification webhooks, and BYOK AI keys.
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

            {/* 1. Subscription & Plan Status */}
            <div className="bg-gradient-to-b from-[#0e1424] to-[#070b14] border-2 border-yellow-400/40 rounded-3xl p-6 shadow-2xl space-y-5 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xl">💎</span>
                    <h2 className="text-base font-bold text-white">Subscription & Plan Status</h2>
                    {isOwner ? (
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black rounded-full text-xs font-mono uppercase tracking-wider shadow-sm">
                        👑 OWNER PRO (Unlimited)
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 rounded-full text-xs font-bold font-mono uppercase">
                        ⚡ FOUNDER BETA PASS (PRO UNLOCKED)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {isOwner
                      ? 'Owner account with full unlimited access to all features.'
                      : 'All Starter Pro features are 100% unlocked for early builders with full access to AI diagnostics and high-capacity monitoring.'}
                  </p>
                </div>

                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold self-start sm:self-auto">
                  ✓ Free Pro Tier Active ($0/mo)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#05070E] rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Monthly Event Cap</span>
                  <span className="text-slate-200 font-semibold">150,000 events</span>
                </div>
                <div className="p-3 bg-[#05070E] rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Data Retention</span>
                  <span className="text-slate-200 font-semibold">30 Days</span>
                </div>
                <div className="p-3 bg-[#05070E] rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">In-Dashboard AI</span>
                  <span className="text-emerald-400 font-bold">✓ Unlimited Copilot Unlocked</span>
                </div>
              </div>
            </div>

            {/* 2. Developer Account Profile */}
            <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md font-mono">
                    {userInitial}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      Developer Account Profile
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Your authenticated developer identity & credentials</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full text-[10px] font-bold uppercase font-mono">
                  Active Session
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Custom Developer Display Name Form */}
                <form onSubmit={handleSaveDisplayName} className="bg-[#05070E] p-4 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
                      Developer Display Name
                    </span>
                    {nameSavedMsg && (
                      <span className="text-[10px] text-emerald-400 font-bold font-mono animate-in fade-in">
                        {nameSavedMsg}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Muhammad Arslan"
                      className="flex-1 bg-[#090D16] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 font-mono transition"
                    />
                    <button
                      type="submit"
                      disabled={savingName}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-yellow-300 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer font-mono shadow-sm disabled:opacity-50"
                    >
                      {savingName ? 'Saving...' : 'Save Name'}
                    </button>
                  </div>
                </form>

                {/* Account Email */}
                <div className="bg-[#05070E] p-4 rounded-2xl border border-slate-800/80 space-y-1 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold font-mono">
                    Account Email Address
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-200 font-mono font-semibold truncate">{userEmail}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Verified
                    </span>
                  </div>
                </div>

              </div>

              {/* Masked API Key */}
              <div className="bg-[#05070E] p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
                    Active Project API Key
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] font-mono text-slate-400 hover:text-yellow-300 transition cursor-pointer"
                  >
                    {showApiKey ? '🙈 Hide Token' : '👁️ Reveal Full Token'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#090D16] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-yellow-300 font-mono truncate">
                    {displayToken}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer font-mono shadow-sm"
                  >
                    {copiedKey ? '✓ Copied' : 'Copy Key'}
                  </button>
                </div>
              </div>

            </div>

            {/* 🌟 3. NEW: SECURITY & UPDATE PASSWORD CARD */}
            <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🔐</span> Security & Update Password
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    Change your account password directly without logging out.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 rounded-full text-[10px] font-bold uppercase font-mono">
                  Encrypted
                </span>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 font-mono">
                    <label className="text-xs font-semibold text-slate-300 block">
                      NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                    />
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <label className="text-xs font-semibold text-slate-300 block">
                      CONFIRM NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {passwordMsg && (
                      <span
                        className={
                          'text-xs font-mono font-bold ' +
                          (passwordMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400')
                        }
                      >
                        {passwordMsg.text}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer font-mono shrink-0"
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password →'}
                  </button>
                </div>
              </form>
            </div>

            {/* 4. Notification Channels Form */}
            <form onSubmit={handleSaveNotifications} className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🔔</span> Notification Channels (Discord, Slack & Email)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time exception alerts and deduplicated incident tags are dispatched here.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {testAlertMsg && (
                    <span className={'text-xs font-mono font-bold ' + (testAlertMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400')}>
                      {testAlertMsg.text}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSendTestAlert}
                    disabled={testingAlert}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-yellow-400/30 text-xs font-bold rounded-xl transition cursor-pointer shadow-sm font-mono"
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
                    placeholder="you@company.com"
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block font-mono">SLACK WEBHOOK URL</label>
                    <span className="text-[10px] font-mono text-slate-500">Incoming Webhook</span>
                  </div>
                  <input
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/services/T.../B.../..."
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-yellow-400 font-mono transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {notifSavedMsg && (
                  <span className="text-xs font-bold text-emerald-400 font-mono animate-in fade-in">
                    {notifSavedMsg}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingNotif}
                  className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer font-mono"
                >
                  {savingNotif ? 'Saving...' : 'Save Notification Channels →'}
                </button>
              </div>
            </form>

            {/* 5. BYOK AI Copilot */}
            <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>✨</span> BYOK AI Copilot Configuration
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Powers the "Analyze with AI" button inside the Exception Inspect Modal.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {aiKeySaved ? '✓ AI Key Active' : '● Pro Unlocked'}
                </span>
              </div>

              <form onSubmit={handleSaveAiKey} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block font-mono">SELECT AI MODEL PROVIDER</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as any)}
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-yellow-300 font-bold focus:outline-none focus:border-yellow-400 cursor-pointer font-mono"
                  >
                    <option value="gemini">Google Gemini (Gemini 2.5 Flash Lite - Free)</option>
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block font-mono">
                    {aiProvider === 'gemini' ? 'GOOGLE GEMINI API KEY (AQ... / AIza...)' : 'OPENAI API KEY (sk-...)'}
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
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer font-mono"
                    >
                      {showAiKey ? '🙈 Hide' : '👁️ Show'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  {aiSavedMsg && (
                    <span className="text-xs font-bold text-emerald-400 font-mono animate-in fade-in">
                      {aiSavedMsg}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={savingAi}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-purple-600/20 font-mono"
                  >
                    {savingAi ? 'Saving...' : 'Save AI Configuration →'}
                  </button>
                </div>
              </form>
            </div>

            {/* 6. Database Maintenance & Purge */}
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
                    className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap font-mono"
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