'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SettingsPage() {
  const [discordUrl, setDiscordUrl] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('discord_webhook_url, alert_email')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error(error.message);
        } else if (data) {
          setDiscordUrl(data.discord_webhook_url || '');
          setAlertEmail(data.alert_email || '');
        }
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Fetch the first project row ID
      const { data: project } = await supabase.from('projects').select('id').limit(1).single();

      if (!project) {
        throw new Error('No project found. Create a project first.');
      }

      const { error } = await supabase
        .from('projects')
        .update({
          discord_webhook_url: discordUrl.trim() || null,
          alert_email: alertEmail.trim() || null,
        })
        .eq('id', project.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Alert channels updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-400 p-8 flex items-center justify-center font-mono text-xs">
        Loading alert configuration...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Notification Settings</h1>
        <p className="text-sm text-gray-400 mb-8">
          Configure real-time alerts for critical exceptions captured by SnapTrace.
        </p>

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 text-xs font-mono border ${
              message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-200 mb-4 font-mono">
              Discord Webhook Integration
            </h2>
            <label className="block text-xs text-gray-400 mb-2">
              Discord Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3.5 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-red-500"
            />
            <p className="text-[11px] text-gray-500 mt-2">
              SnapTrace will dispatch formatted embed cards directly into your Discord channel upon new exception events.
            </p>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-200 mb-4 font-mono">
              Email Alert Dispatch
            </h2>
            <label className="block text-xs text-gray-400 mb-2">
              Recipient Email Address
            </label>
            <input
              type="email"
              placeholder="developer@example.com"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3.5 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-red-500"
            />
            <p className="text-[11px] text-gray-500 mt-2">
              Receive immediate email dispatches containing exception messages and runtime host metadata.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium text-xs py-2.5 rounded-lg transition-colors font-mono"
          >
            {saving ? 'Saving...' : 'Save Channel Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
}