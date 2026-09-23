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

  // AI Copilot State
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [aiKey, setAiKey] = useState<string>('');
  const [showAiKey, setShowAiKey] = useState<boolean>(false);
  const [aiKeySaved, setAiKeySaved] = useState<boolean>(false);

  // Notification & Environment Alert Muting State
  const [email, setEmail] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [slackWebhook, setSlackWebhook] = useState<string>('');
  const [onlyProdAlerts, setOnlyProdAlerts] = useState<boolean>(false);
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

        const storageOnlyProdKey = 'snaptrace_only_prod_' + p.id;
        const savedOnlyProd = Boolean(
          p.only_production_alerts || 
          (typeof window !== 'undefined' && localStorage.getItem(storageOnlyProdKey) === 'true')
        );
        setOnlyProdAlerts(savedOnlyProd);
      } else {
        setProjectId('');
        setApiKey('No project created yet');
        setEmail(uEmail);
        setDiscordWebhook('');
        setSlackWebhook('');
        setOnlyProdAlerts(false);
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
        localStorage.setItem('snaptrace_slack_' + projectId, slackWebhook);
        localStorage.setItem('snaptrace_only_prod_' + projectId, String(onlyProdAlerts));
      }

      const updatePayload: any = {
        recipient_email: email,
        alert_email: email,
        discord_webhook_url: discordWebhook,
        discord_webhook: discordWebhook,
      };

      try {
        // Update database with safe column fallback
        const { error } = await supabase
          .from('projects')
          .update({ ...updatePayload, only_production_alerts: onlyProdAlerts })
          .eq('id', projectId);

        if (error) {
          // If the column doesn't exist yet in Supabase, update without it gracefully
          await supabase.from('projects').update(updatePayload).eq('id', projectId);
        }
      } catch (dbErr) {
        console.warn('DB update fallback:', dbErr);
      }

      setNotifSavedMsg('✓ Notification Channels & Alert Rules Saved!');
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-5">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <span>Project Settings & Developer Profile</span>
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Manage your developer identity, security credentials, notification webhooks, and BYOK AI keys.
          </p>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="relative animate-pulse">
              <SnapTraceLogo size="lg" showText={false} />
            </div>
            <p className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Loading Settings...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* 1. Subscription & Plan Status */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-zinc-100">Subscription & Plan Status</h2>
                    {isOwner ? (
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium rounded text-[10px] font-mono uppercase tracking-wider">
                        Owner Pro (Unlimited)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-800/70 text-zinc-300 border border-zinc-700/80 rounded text-[10px] font-medium font-mono uppercase tracking-wider">
                        Founder Beta Pass (Pro Unlocked)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {isOwner
                      ? 'Owner account with full unlimited access to all features.'
                      : 'All Starter Pro features are unlocked for early builders with full access to AI diagnostics and high-capacity monitoring.'}
                  </p>
                </div>

                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded font-medium self-start sm:self-auto">
                  Free Pro Tier Active ($0/mo)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Monthly Event Cap</span>
                  <span className="text-zinc-200 font-semibold">100,000 events</span>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Data Retention</span>
                  <span className="text-zinc-200 font-semibold">30 Days</span>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">In-Dashboard AI</span>
                  <span className="text-emerald-400 font-semibold">Unlimited Copilot Unlocked</span>
                </div>
              </div>
            </div>

            {/* 2. Developer Account Profile */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 text-zinc-200 font-semibold text-xs flex items-center justify-center border border-zinc-700 font-mono">
                    {userInitial}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Developer Account Profile
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Your authenticated developer identity & credentials</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded text-[10px] font-medium uppercase font-mono">
                  Active Session
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <form onSubmit={handleSaveDisplayName} className="bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium font-mono">
                      Developer Display Name
                    </span>
                    {nameSavedMsg && (
                      <span className="text-[10px] text-emerald-400 font-medium font-mono animate-in fade-in">
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
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition"
                    />
                    <button
                      type="submit"
                      disabled={savingName}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer font-mono border border-zinc-700 disabled:opacity-50"
                    >
                      {savingName ? 'Saving...' : 'Save Name'}
                    </button>
                  </div>
                </form>

                <div className="bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-800/80 space-y-1 flex flex-col justify-center">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium font-mono">
                    Account Email Address
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-200 font-mono text-xs font-medium truncate">{userEmail}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium font-mono">
                    Active Project API Key
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                  >
                    {showApiKey ? 'Hide Token' : 'Reveal Full Token'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-mono truncate select-all">
                    {displayToken}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition shrink-0 cursor-pointer font-mono border border-zinc-700"
                  >
                    {copiedKey ? '✓ Copied' : 'Copy Key'}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Security & Update Password */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Security & Update Password
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                    Change your account password directly without logging out.
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded text-[10px] font-medium uppercase font-mono">
                  Encrypted
                </span>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 font-mono">
                    <label className="text-xs font-medium text-zinc-300 block">
                      NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <label className="text-xs font-medium text-zinc-300 block">
                      CONFIRM NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {passwordMsg && (
                      <span
                        className={
                          'text-xs font-mono font-medium ' +
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
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition disabled:opacity-50 cursor-pointer font-mono shrink-0"
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* 4. Notification Channels & Alert Rules Form */}
            <form onSubmit={handleSaveNotifications} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Notification Channels & Alert Rules
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                    Real-time exception alerts, webhook destinations, and environment filtering.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {testAlertMsg && (
                    <span className={'text-xs font-mono font-medium ' + (testAlertMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400')}>
                      {testAlertMsg.text}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSendTestAlert}
                    disabled={testingAlert}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-xs font-medium rounded-lg transition cursor-pointer font-mono"
                  >
                    {testingAlert ? 'Firing Test...' : 'Send Test Alert'}
                  </button>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block font-mono">ALERT EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block font-mono">DISCORD WEBHOOK URL</label>
                  <input
                    type="url"
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300 block font-mono">SLACK WEBHOOK URL</label>
                    <span className="text-[10px] font-mono text-zinc-500">Incoming Webhook</span>
                  </div>
                  <input
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/services/T.../B.../..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition"
                  />
                </div>

                {/* ONLY ALERT ON PRODUCTION TOGGLE SWITCH */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-zinc-200 block font-mono">
                      ONLY ALERT ON PRODUCTION
                    </span>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Mutes Discord, Slack, and Email notifications from development & localhost. Errors will still be visible in your dashboard stream.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOnlyProdAlerts(!onlyProdAlerts)}
                    className={
                      'w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ' +
                      (onlyProdAlerts ? 'bg-zinc-200' : 'bg-zinc-800 border border-zinc-700')
                    }
                    title="Toggle production-only alert filter"
                  >
                    <div
                      className={
                        'w-3.5 h-3.5 rounded-full absolute top-[2px] transition-all ' +
                        (onlyProdAlerts ? 'bg-zinc-950 right-[3px]' : 'bg-zinc-400 left-[3px]')
                      }
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {notifSavedMsg && (
                  <span className="text-xs font-medium text-emerald-400 font-mono animate-in fade-in">
                    {notifSavedMsg}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingNotif}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition disabled:opacity-50 cursor-pointer font-mono"
                >
                  {savingNotif ? 'Saving...' : 'Save Notification Channels'}
                </button>
              </div>
            </form>

            {/* 5. BYOK AI Copilot */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    BYOK AI Copilot Configuration
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                    Powers the "Analyze with AI" button inside the Exception Inspect Modal.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {aiKeySaved ? 'AI Key Active' : 'Pro Unlocked'}
                </span>
              </div>

              <form onSubmit={handleSaveAiKey} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block font-mono">SELECT AI MODEL PROVIDER</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-medium focus:outline-none focus:border-zinc-500 cursor-pointer font-mono"
                  >
                    <option value="gemini">Google Gemini (Gemini 2.5 Flash Lite - Free)</option>
                    <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block font-mono">
                    {aiProvider === 'gemini' ? 'GOOGLE GEMINI API KEY (AQ... / AIza...)' : 'OPENAI API KEY (sk-...)'}
                  </label>
                  
                  <div className="relative">
                    <input
                      type={showAiKey ? 'text' : 'password'}
                      value={aiKey}
                      onChange={(e) => setAiKey(e.target.value)}
                      placeholder={aiProvider === 'gemini' ? 'Paste your Google Gemini Key here' : 'sk-proj-...'}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-16 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiKey(!showAiKey)}
                      className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer font-mono"
                    >
                      {showAiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  {aiSavedMsg && (
                    <span className="text-xs font-medium text-emerald-400 font-mono animate-in fade-in">
                      {aiSavedMsg}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={savingAi}
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-medium transition cursor-pointer font-mono"
                  >
                    {savingAi ? 'Saving...' : 'Save AI Configuration'}
                  </button>
                </div>
              </form>
            </div>

            {/* 6. Database Maintenance & Purge */}
            <div className="bg-zinc-950 border border-red-950/40 rounded-xl p-5 space-y-4">
              <div className="border-b border-zinc-800/80 pb-3">
                <h2 className="text-sm font-semibold text-red-400">
                  Database Maintenance & Purge
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                  Permanently deletes all exceptions that have been marked as resolved.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="space-y-0.5">
                  <p className="text-xs text-zinc-300 font-medium font-mono">Purge Resolved Errors</p>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Permanently deletes all exceptions that have been marked as resolved.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {purgeMsg && (
                    <span className="text-xs font-medium text-emerald-400 font-mono animate-in fade-in">
                      {purgeMsg}
                    </span>
                  )}
                  <button
                    onClick={handlePurgeResolved}
                    disabled={purging}
                    className="px-3 py-1.5 bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/50 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap font-mono"
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