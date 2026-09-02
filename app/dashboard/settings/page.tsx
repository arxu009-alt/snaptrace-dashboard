'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AlertSettingsPage() {
  const [email, setEmail] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProjectSettings() {
      // Fetch settings from any row that already has values configured
      const { data } = await supabase
        .from('projects')
        .select('recipient_email, discord_webhook_url')
        .not('recipient_email', 'is', null)
        .limit(1);

      if (data && data.length > 0) {
        setEmail(data[0].recipient_email || '');
        setDiscordWebhook(data[0].discord_webhook_url || '');
      } else {
        const { data: fallback } = await supabase
          .from('projects')
          .select('recipient_email, discord_webhook_url')
          .limit(1)
          .single();

        if (fallback) {
          setEmail(fallback.recipient_email || '');
          setDiscordWebhook(fallback.discord_webhook_url || '');
        }
      }
    }
    loadProjectSettings();
  }, []);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    // Apply notification settings across all project records
    const { error } = await supabase
      .from('projects')
      .update({
        recipient_email: email,
        discord_webhook_url: discordWebhook,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    setSaving(false);

    if (error) {
      setStatusMessage({ type: 'error', text: `Failed to save: ${error.message}` });
    } else {
      setStatusMessage({ type: 'success', text: 'Alert settings saved for all project API keys!' });
    }
  };

  return (
    <div className="p-8 text-white space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Project Settings</h1>
        <p className="text-gray-400 text-sm">Configure alert channels and manage API security credentials.</p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSaveChanges} className="bg-[#0f111a] border border-gray-800 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-200">Notification Channels</h2>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Alert Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="arxu1045@gmail.com"
            className="w-full bg-[#14182b] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition"
          />
          <p className="text-xs text-gray-500">Incoming exceptions will trigger email notifications to this recipient.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Discord Webhook URL
          </label>
          <input
            type="url"
            value={discordWebhook}
            onChange={(e) => setDiscordWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full bg-[#14182b] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition"
          />
          <p className="text-xs text-gray-500">Real-time exception alerts will be posted as embedded messages to this channel.</p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}