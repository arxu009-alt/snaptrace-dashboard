'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import { Settings, Trash2 } from 'lucide-react';

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

  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const [purging, setPurging] = useState<boolean>(false);
  const [purgeMsg, setPurgeMsg] = useState<string | null>(null);

  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      const user = session.user;
      const uEmail = user.email || '';
      setUserEmail(uEmail);

      const meta = user.user_metadata;
      const currentName = meta?.full_name || meta?.name || meta?.user_name || uEmail.split('@')[0] || '';
      setDisplayName(currentName);

      const avatar = meta?.avatar_url || meta?.picture;
      setUserAvatarUrl(avatar || null);

      const { data: userProjects } = await supabase
        .from('projects')
        .select('id, api_key')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userProjects && userProjects.length > 0) {
        const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;
        const p = userProjects.find((proj) => proj.id === savedProjectId) || userProjects[0];
        setProjectId(p.id || '');
        setApiKey(p.api_key || '');
      } else {
        setProjectId('');
        setApiKey('No project created yet');
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
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
      if (error) throw error;
      setNameSavedMsg('Display name updated.');
      setTimeout(() => setNameSavedMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Failed to update display name: ' + msg);
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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      setPasswordMsg({ type: 'error', text: msg });
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

  const handlePurgeResolved = async () => {
    if (!confirm('Are you sure you want to permanently delete all resolved error logs?')) return;
    setPurging(true);
    try {
      const { error } = await supabase.from('errors').delete().eq('status', 'resolved');
      if (error) throw error;
      setPurgeMsg('All resolved logs purged.');
      setTimeout(() => setPurgeMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Purge failed: ' + msg);
    } finally {
      setPurging(false);
    }
  };

  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'D';
  const displayToken = showApiKey
    ? apiKey
    : (apiKey.slice(0, 10) + '••••••••••••••••' + apiKey.slice(-8));

  const inputCls = 'w-full glass-inner rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono transition';

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 p-6 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <Settings className="w-4 h-4 text-zinc-300" />
            <h1 className="text-xl font-bold tracking-tight text-white">Account Settings</h1>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Manage your developer identity, security credentials, and active API key.
          </p>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="relative animate-pulse">
              <SnapTraceLogo size="lg" showText={false} />
            </div>
            <p className="text-xs font-mono text-zinc-400 tracking-widest uppercase">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Developer Account Profile */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg glass-inner text-zinc-100 font-semibold text-xs flex items-center justify-center font-mono overflow-hidden shrink-0">
                    {userAvatarUrl ? (
                      <img
                        src={userAvatarUrl}
                        alt={displayName}
                        className="h-full w-full object-cover rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Developer Profile</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Your authenticated developer identity</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 glass-pill text-zinc-300 rounded text-[10px] font-medium uppercase font-mono">
                  Active Session
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <form onSubmit={handleSaveDisplayName} className="glass-inner p-3.5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium font-mono">Developer Display Name</span>
                    {nameSavedMsg && (
                      <span className="text-[10px] text-emerald-400 font-medium font-mono animate-in fade-in">{nameSavedMsg}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Muhammad Arslan"
                      className="flex-1 glass-inner rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono transition"
                    />
                    <button
                      type="submit"
                      disabled={savingName}
                      className="px-3 py-1.5 glass-inner glass-inner-hover text-zinc-200 hover:text-white rounded-lg text-xs font-medium transition shrink-0 cursor-pointer font-mono disabled:opacity-50"
                    >
                      {savingName ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>

                <div className="glass-inner p-3.5 rounded-lg space-y-1 flex flex-col justify-center">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium font-mono">Account Email Address</span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-200 font-mono text-xs font-medium truncate">{userEmail}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 ml-2">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Active API Key */}
              <div className="glass-inner p-3.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium font-mono">Active Project API Key</span>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                  >
                    {showApiKey ? 'Hide Token' : 'Reveal Full Token'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 glass-inner rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono truncate select-all">
                    {displayToken}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="px-3 py-1.5 glass-pill hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-medium rounded-lg transition shrink-0 cursor-pointer font-mono"
                  >
                    {copiedKey ? 'Copied' : 'Copy Key'}
                  </button>
                </div>
              </div>
            </div>

            {/* Security & Password */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">Security &amp; Update Password</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Change your account password without logging out.</p>
                </div>
                <span className="px-2 py-0.5 glass-pill text-zinc-300 rounded text-[10px] font-medium uppercase font-mono">
                  Encrypted
                </span>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 font-mono">
                    <label className="text-[10px] font-medium text-zinc-400 block uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <label className="text-[10px] font-medium text-zinc-400 block uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    {passwordMsg && (
                      <span className={'text-xs font-mono font-medium ' + (passwordMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400')}>
                        {passwordMsg.text}
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition disabled:opacity-50 cursor-pointer font-mono shrink-0 shadow-sm"
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Database Maintenance */}
            <div className="glass-panel border-red-500/20 rounded-xl p-5 space-y-4">
              <div className="border-b border-red-500/20 pb-3">
                <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Database Maintenance
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Permanently deletes all exceptions marked as resolved.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs text-zinc-200 font-medium font-mono">Purge Resolved Errors</p>
                  <p className="text-[11px] text-zinc-400">This action is irreversible. Unresolved errors are not affected.</p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {purgeMsg && (
                    <span className="text-xs font-medium text-emerald-400 font-mono animate-in fade-in">{purgeMsg}</span>
                  )}
                  <button
                    type="button"
                    onClick={handlePurgeResolved}
                    disabled={purging}
                    className="px-3 py-1.5 bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/50 text-xs font-medium rounded-lg transition cursor-pointer whitespace-nowrap font-mono disabled:opacity-50"
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