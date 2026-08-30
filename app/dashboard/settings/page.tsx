'use client';

import { useState } from 'react';
import { Settings, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro'>('pro');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 w-full">
      <header className="pb-6 mb-8 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" />
          Settings & Subscription Tiers
        </h1>
        <p className="text-sm text-slate-400 mt-1">Configure your AI error solution preferences and account parameters.</p>
      </header>

      <div className="max-w-4xl space-y-8">
        {/* Tier Selector Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Error Intelligence Tier
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Configure how SnapTrace analyzes incoming runtime errors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Tier */}
            <div
              onClick={() => setSelectedTier('free')}
              className={`border rounded-xl p-5 cursor-pointer transition-all ${
                selectedTier === 'free'
                  ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-white">Freemium Tier</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Plain English Error Summaries</p>
                </div>
                {selectedTier === 'free' && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
              </div>
              <ul className="text-xs text-slate-400 space-y-2 mt-4">
                <li className="flex items-center gap-2">• Translates stack traces into human-readable summaries</li>
                <li className="flex items-center gap-2">• Basic uncaught error categorization</li>
                <li className="flex items-center gap-2">• Up to 10,000 telemetry events/month</li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div
              onClick={() => setSelectedTier('pro')}
              className={`border rounded-xl p-5 cursor-pointer transition-all ${
                selectedTier === 'pro'
                  ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">Pro Tier</h3>
                    <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">Active</span>
                  </div>
                  <p className="text-xs text-indigo-300 mt-0.5">Automated Code Patches & Root Cause Fixes</p>
                </div>
                {selectedTier === 'pro' && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
              </div>
              <ul className="text-xs text-slate-300 space-y-2 mt-4">
                <li className="flex items-center gap-2">• Generates automated before/after code fixes</li>
                <li className="flex items-center gap-2">• Root cause analysis & instant code suggestions</li>
                <li className="flex items-center gap-2">• Unlimited monthly error telemetry</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Summary */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Ingestion Security
          </h2>
          <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
            <p>• Cross-Origin Resource Sharing (CORS) is enabled on <code className="text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800">/api/v1/ingest</code> to accept client browser payloads.</p>
            <p>• Payloads are strictly verified using project API keys (<code className="text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800">sk_live_...</code>).</p>
          </div>
        </div>
      </div>
    </div>
  );
}