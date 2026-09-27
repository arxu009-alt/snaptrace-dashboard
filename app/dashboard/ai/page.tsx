'use client';

import { useState, useEffect } from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';

export default function AiCopilotPage() {
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [aiKey, setAiKey] = useState<string>('');
  const [showAiKey, setShowAiKey] = useState<boolean>(false);
  const [aiKeySaved, setAiKeySaved] = useState<boolean>(false);
  const [savingAi, setSavingAi] = useState<boolean>(false);
  const [aiSavedMsg, setAiSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedProvider = localStorage.getItem('snaptrace_ai_provider') as 'gemini' | 'openai' | null;
    const savedKey = localStorage.getItem('snaptrace_ai_key') || localStorage.getItem('snaptrace_openai_key') || '';
    if (savedProvider) setAiProvider(savedProvider);
    if (savedKey) {
      setAiKey(savedKey);
      setAiKeySaved(true);
    }
  }, []);

  const handleSaveAiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAi(true);
    if (aiKey.trim()) {
      localStorage.setItem('snaptrace_ai_provider', aiProvider);
      localStorage.setItem('snaptrace_ai_key', aiKey.trim());
      localStorage.setItem('snaptrace_openai_key', aiKey.trim());
      setAiKeySaved(true);
      setAiSavedMsg('AI key saved successfully.');
    } else {
      localStorage.removeItem('snaptrace_ai_key');
      localStorage.removeItem('snaptrace_openai_key');
      setAiKeySaved(false);
      setAiSavedMsg('Key removed.');
    }
    setSavingAi(false);
    setTimeout(() => setAiSavedMsg(null), 3000);
  };

  const inputCls = 'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <Cpu className="w-4 h-4 text-zinc-400" />
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">AI Copilot (BYOK)</h1>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Bring your own API key to power the in-dashboard AI diagnostics and 1-click Cursor/Claude prompt exports.
          </p>
        </div>

        {/* Provider & Key Configuration */}
        <form onSubmit={handleSaveAiKey} className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">BYOK AI Configuration</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Powers the &quot;Analyze with AI&quot; button inside the Exception Inspect Modal.</p>
              </div>
              <span className={'px-2 py-0.5 rounded text-[10px] font-medium uppercase font-mono border ' + (aiKeySaved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-900 text-zinc-400 border-zinc-800')}>
                {aiKeySaved ? 'AI Key Active' : 'No Key Set'}
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-zinc-400 block font-mono uppercase tracking-wider">Select AI Model Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as 'gemini' | 'openai')}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-medium focus:outline-none focus:border-zinc-500 cursor-pointer font-mono"
                >
                  <option value="gemini">Google Gemini 2.5 Flash Lite (Free tier available)</option>
                  <option value="openai">OpenAI GPT-4o / GPT-4o-mini</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-zinc-400 block font-mono uppercase tracking-wider">
                  {aiProvider === 'gemini' ? 'Google Gemini API Key (AIza... / AQ...)' : 'OpenAI API Key (sk-proj-...)'}
                </label>
                <div className="relative">
                  <input
                    type={showAiKey ? 'text' : 'password'}
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    placeholder={aiProvider === 'gemini' ? 'Paste your Google Gemini API key here' : 'sk-proj-...'}
                    className={inputCls + ' pr-14'}
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
            </div>
          </div>

          {/* How it works */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-100 pb-3 border-b border-zinc-800/80">How BYOK Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              {[
                { step: '01', title: 'Paste API Key', desc: 'Your key is stored only in localStorage — it never reaches our servers.' },
                { step: '02', title: 'Inspect Exception', desc: 'Click Inspect on any error in the Exception Logs stream.' },
                { step: '03', title: 'Analyze or Export', desc: 'Hit "Analyze with AI" for root-cause, or copy a 1-click prompt for Cursor / Claude Code.' },
              ].map((item) => (
                <div key={item.step} className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Step {item.step}</span>
                  <span className="text-zinc-200 font-semibold block text-xs">{item.title}</span>
                  <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {aiSavedMsg && (
              <span className="text-xs font-medium text-emerald-400 font-mono animate-in fade-in flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {aiSavedMsg}
              </span>
            )}
            <button
              type="submit"
              disabled={savingAi}
              className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition disabled:opacity-50 cursor-pointer font-mono"
            >
              {savingAi ? 'Saving...' : 'Save AI Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
