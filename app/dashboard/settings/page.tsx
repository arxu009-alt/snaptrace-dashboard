'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  // User Profile State
  const [userEmail, setUserEmail] = useState<string>('');
  
  // AI Key State
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [aiKeySaved, setAiKeySaved] = useState<boolean>(false);
  
  // Notification State
  const [email, setEmail] = useState<string>('');
  const [discordWebhook, setDiscordWebhook] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);

      // 1. Get logged-in user info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || 'Authenticated User');
      }

      // 2. Load stored OpenAI key from localStorage
      const savedAiKey = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_openai_key') : '';
      if (savedAiKey) {
        setOpenaiKey(savedAiKey);
        setAiKeySaved(true);
      }

      // 3. Load Project Settings (Email & Discord)
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

  // Save Notifications to Backend
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

  // Save AI Key to Browser Storage
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
    <div className="p-8 text-white space-y-8 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Project & Account Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage alert channels, AI diagnosis keys, and account preferences.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs font-mono">Loading settings panel...</div>
      ) : (
        <div className="space-y-6">

          {/* 1. Account Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>👤</span> Account Profile
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Your authenticated SnapTrace account</p>
              </div>
              <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-bold uppercase">
                Active Session
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Account Email</span>
                <span className="text-slate-200 font-mono mt-1 block font-semibold">{userEmail}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Active Project API Key</span>
                <span className="text-purple-400 font-mono mt-1 block truncate">{apiKey || 'No key loaded'}</span>
              </div>
            </div>
          </div>

          {/* 2. BYOK AI Copilot Card */}
          <form onSubmit={handleSaveAiKey} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>✨</span> AI Bug Diagnosis (BYOK - Bring Your Own Key)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Powers the "Analyze with AI" button inside the Exception Inspect Modal.
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  aiKeySaved
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {aiKeySaved ? '✓ AI Key Active' : 'No Key Set'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                OpenAI API Key (sk-...)
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono transition"
              />
              <p className="text-[11px] text-slate-500">
                Your key is stored securely in your browser and is only used to generate fix recommendations when you click "Analyze with AI".
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-lg shadow-purple-600/20"
              >
                Save AI Configuration
              </button>
            </div>
          </form>

          {/* 3. Notification Channels Card (Preserved 100%) */}
          <form onSubmit={handleSaveNotifications} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span>🔔</span> Notification Channels (Discord & Email)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Where real-time crash reports and deduplicated alerts are dispatched.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Alert Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arxu1045@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition"
                />
                <p className="text-[11px] text-slate-500">
                  New crash events will trigger HTML alert notifications to this address.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Discord Webhook URL
                </label>
                <input
                  type="url"
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono transition"
                />
                <p className="text-[11px] text-slate-500">
                  Formatted embeds with occurrence counts will post to this channel.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-lg shadow-purple-600/20"
              >
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </div>
          </form>

        </div>
      )}
    </div>
  );
}