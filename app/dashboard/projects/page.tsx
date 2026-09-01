'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Key, Copy, Check, RefreshCw } from 'lucide-react';

// Disable static prerendering at build time to prevent build-worker evaluation crashes
export const dynamic = 'force-dynamic';

interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    }

    fetchProjects();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Project API Keys</h1>
            <p className="text-sm text-slate-400">Manage integration credentials and project identifiers for SnapTrace</p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            ← Back to Overview
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading API keys...</div>
        ) : (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-sm text-slate-400">
                No active projects found. Check your Supabase database setup.
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                    <span className="text-xs text-slate-500 font-mono">
                      ID: {project.id}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      API Key
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-indigo-400 truncate">
                        {project.api_key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(project.api_key)}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition flex items-center gap-1.5 text-xs font-medium"
                      >
                        {copiedKey === project.api_key ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}