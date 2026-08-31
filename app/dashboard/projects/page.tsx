'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'js' | 'nextjs'>('nextjs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1)
        .single();

      if (!error && data) {
        setProject(data);
      }
      setLoading(false);
    }
    fetchProject();
  }, []);

  const apiKey = project?.api_key || 'YOUR_SNAPTRACE_API_KEY';

  const snippets = {
    nextjs: `// app/api/example/route.ts or global error boundary
try {
  // Your application code
} catch (error: any) {
  await fetch('https://snaptrace-dashboard.vercel.app/api/v1/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: '${apiKey}',
      message: error.message,
      stack: error.stack,
      environment: process.env.NODE_ENV || 'production',
      url: typeof window !== 'undefined' ? window.location.href : 'Server Side',
    }),
  });
}`,
    js: `// Standard JavaScript / Fetch API
window.addEventListener('error', (event) => {
  fetch('https://snaptrace-dashboard.vercel.app/api/v1/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: '${apiKey}',
      message: event.message,
      stack: event.error ? event.error.stack : '',
      environment: 'production',
      url: window.location.href,
    }),
  });
});`,
  };

  const copyToClipboard = (text: string, type: 'key' | 'snippet') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">Projects & API Keys</h1>
          <p className="text-sm text-slate-400">Manage your credentials and integrate SnapTrace into your applications.</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading project configuration...</div>
        ) : (
          <>
            {/* API Key Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-white">{project?.name || 'Default Project'}</h2>
                  <p className="text-xs text-slate-400">Active API key for event ingestion</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full">
                  Active
                </span>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 p-3 rounded-lg">
                <code className="text-xs font-mono text-purple-400 flex-1 truncate">
                  {apiKey}
                </code>
                <button
                  onClick={() => copyToClipboard(apiKey, 'key')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs text-white font-medium rounded transition"
                >
                  {copiedKey ? 'Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>

            {/* Quickstart Snippet Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-white">Integration Setup</h2>
                  <p className="text-xs text-slate-400">Copy and paste this snippet into your project catch block</p>
                </div>
                
                {/* Language Switcher */}
                <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setSelectedLang('nextjs')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                      selectedLang === 'nextjs'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Next.js / Node
                  </button>
                  <button
                    onClick={() => setSelectedLang('js')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                      selectedLang === 'js'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Browser JS
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
                  {snippets[selectedLang]}
                </pre>
                <button
                  onClick={() => copyToClipboard(snippets[selectedLang], 'snippet')}
                  className="absolute top-3 right-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium rounded transition"
                >
                  {copiedSnippet ? 'Copied Snippet!' : 'Copy Snippet'}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}