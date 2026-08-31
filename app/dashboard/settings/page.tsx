'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [discordUrl, setDiscordUrl] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from('projects')
        .select('discord_webhook, alert_email')
        .limit(1)
        .maybeSingle();

      if (data) {
        if (data.discord_webhook) setDiscordUrl(data.discord_webhook);
        if (data.alert_email) setAlertEmail(data.alert_email);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');

    // Update first project row
    const { data: project } = await supabase.from('projects').select('id').limit(1).single();

    if (!project) {
      setStatusMsg('Error: No project found in Supabase.');
      return;
    }

    const { error } = await supabase
      .from('projects')
      .update({
        discord_webhook: discordUrl,
        alert_email: alertEmail,
      })
      .eq('id', project.id);

    if (error) {
      setStatusMsg(`Error saving settings: ${error.message}`);
    } else {
      setStatusMsg('Alert channels updated successfully.');
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-400 font-mono text-sm">Loading preferences...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-white font-sans">
      {statusMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm">
          {statusMsg}
        </div>
      )}

      {/* Discord Integration */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Discord Webhook Integration</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Discord Webhook URL</label>
          <input
            type="text"
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
        <p className="text-xs text-gray-500">
          SnapTrace will dispatch formatted embed cards directly into your Discord channel upon new exception events.
        </p>
      </div>

      {/* Email Integration */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Email Alert Dispatch</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Recipient Email Address</label>
          <input
            type="email"
            value={alertEmail}
            onChange={(e) => setAlertEmail(e.target.value)}
            placeholder="developer@example.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
        <p className="text-xs text-gray-500">
          Receive immediate email dispatches containing exception messages and runtime host metadata.
        </p>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
      >
        Save Channel Preferences
      </button>
    </div>
  );
}