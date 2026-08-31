'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [alertEmail, setAlertEmail] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1)
        .single();

      if (!error && data) {
        setProjectId(data.id);
        setAlertEmail(data.alert_email || '');
        setDiscordWebhook(data.discord_webhook || '');
        setApiKey(data.api_key || '');
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setSaving(true);
    setStatusMessage(null);

    const { error } = await supabase
      .from('projects')
      .update({
        alert_email: alertEmail,
        discord_webhook: discordWebhook,
      })
      .eq('id', projectId);

    setSaving(false);

    if (error) {
      setStatusMessage({ type: 'error', text: error.message });
    } else {
      setStatusMessage({ type: 'success', text: 'Project settings updated successfully.' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleRegenerateKey = async () => {
    if (!projectId || !confirm('Are you sure you want to regenerate your API key? The old key will stop working immediately.')) return;

    const newKey = `st_live_${crypto.randomUUID().replace(/-/g, '')}`;

    const { error } = await supabase
      .from('projects')
      .update({ api_key: newKey })
      .eq('id', projectId);

    if (error) {
      setStatusMessage({ type: 'error', text: error.message });
    } else {
      setApiKey(newKey);
      setStatusMessage({ type: 'success', text: 'New API key generated successfully.' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">Project Settings</h1>
          <p className="text-sm text-slate-400">Configure alert channels and manage API security credentials.</p>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-lg border text-sm font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading settings...</div>
        ) : (
          <div className="space-y-6">
            
            {/* Notification Channels Form */}
            <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white">Notification Channels</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Alert Email Address
                  </label>
                  <input
                    type="email"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder="e.g. dev-team@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Incoming exceptions will trigger email notifications to this recipient.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Discord Webhook URL
                  </label>
                  <input
                    type="url"
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time exception alerts will be posted as embedded messages to this Discord channel.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* API Key Management */}
            <div className="bg-slate-900 border border-red-900/40 rounded-xl p-6 space-y-4 shadow-xl">
              <div>
                <h2 className="text-lg font-semibold text-red-400">Regenerate API Key</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Regenerating your API key will immediately invalidate your current active key (<code className="text-purple-400 font-mono">{apiKey}</code>). Any applications using the old key will fail to log errors.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-medium text-sm rounded-lg transition"
                >
                  Regenerate Key
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}