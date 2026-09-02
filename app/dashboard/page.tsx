'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

interface ErrorLog {
  id: number;
  message: string;
  environment: string;
  created_at: string;
}

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [totalErrors, setTotalErrors] = useState(0);
  const [prodErrors, setProdErrors] = useState(0);
  const [devErrors, setDevErrors] = useState(0);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [projectKey, setProjectKey] = useState<string>('');
  const [selectedProjectLabel, setSelectedProjectLabel] = useState<string>('All Projects');

  const loadDashboardData = useCallback(async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      setLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    setLoading(true);

    // 1. Identify logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 2. Fetch all user projects
    const { data: userProjects } = await supabase
      .from('projects')
      .select('id, name, api_key')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!userProjects || userProjects.length === 0) {
      setProjectKey('No API Key Created Yet');
      setTotalErrors(0);
      setProdErrors(0);
      setDevErrors(0);
      setRecentErrors([]);
      setLoading(false);
      return;
    }

    const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : 'all';
    const isAll = !savedProjectId || savedProjectId === 'all';
    const userProjectIds = userProjects.map((p) => p.id);

    let errorQuery = supabase
      .from('errors')
      .select('id, message, environment, created_at')
      .order('created_at', { ascending: false });

    if (isAll) {
      // Combined feed across all projects
      setSelectedProjectLabel('All Projects (Combined)');
      setProjectKey(userProjects[0].api_key); // Shows default primary key
      errorQuery = errorQuery.in('project_id', userProjectIds);
    } else {
      // Filtered to one specific project
      const activeProject = userProjects.find((p) => p.id === savedProjectId) || userProjects[0];
      setSelectedProjectLabel(activeProject.name);
      setProjectKey(activeProject.api_key);
      errorQuery = errorQuery.eq('project_id', activeProject.id);
    }

    const { data: errors, error } = await errorQuery;

    if (!error && errors) {
      setTotalErrors(errors.length);
      setProdErrors(errors.filter((e) => e.environment === 'production').length);
      setDevErrors(errors.filter((e) => e.environment === 'development').length);
      setRecentErrors(errors.slice(0, 5));
    } else {
      setTotalErrors(0);
      setProdErrors(0);
      setDevErrors(0);
      setRecentErrors([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();

    window.addEventListener('snaptrace_project_change', loadDashboardData);
    return () => {
      window.removeEventListener('snaptrace_project_change', loadDashboardData);
    };
  }, [loadDashboardData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System Overview</h1>
            <p className="text-sm text-slate-400">
              Live status for <span className="text-purple-400 font-semibold">{selectedProjectLabel}</span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Ingestion Active
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading metrics dashboard...</div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 shadow-xl">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ingested Errors</span>
                <div className="text-3xl font-extrabold text-white">{totalErrors}</div>
                <p className="text-xs text-slate-500">{selectedProjectLabel}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 shadow-xl">
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Production Errors</span>
                <div className="text-3xl font-extrabold text-red-400">{prodErrors}</div>
                <p className="text-xs text-slate-500">High-priority live issues</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 shadow-xl">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Development Logs</span>
                <div className="text-3xl font-extrabold text-amber-400">{devErrors}</div>
                <p className="text-xs text-slate-500">Local and staging exceptions</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 shadow-xl">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Rate Limit Window</span>
                <div className="text-3xl font-extrabold text-purple-400">5 min</div>
                <p className="text-xs text-slate-500">Duplicate alert suppression</p>
              </div>
            </div>

            {/* Quick Actions & Recent Errors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Recent Ingested Errors */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Recent Exceptions</h2>
                  <Link
                    href="/dashboard/errors"
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium transition"
                  >
                    View All Logs →
                  </Link>
                </div>

                {recentErrors.length === 0 ? (
                  <p className="text-xs text-slate-500">No errors logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentErrors.map((err) => (
                      <div
                        key={err.id}
                        className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                      >
                        <div className="space-y-1 truncate max-w-md">
                          <p className="font-medium text-slate-200 truncate">{err.message}</p>
                          <p className="text-slate-500 font-mono text-[11px]">
                            {new Date(err.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            err.environment === 'production'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {err.environment}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Links & Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
                <div>
                  <h2 className="text-lg font-semibold text-white">Quick Shortcuts</h2>
                  <p className="text-xs text-slate-400 mt-1">Jump to common configuration views</p>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/dashboard/projects"
                    className="block p-3 bg-slate-950 hover:bg-slate-800/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition"
                  >
                    🔑 Get API Key & Integration Code
                  </Link>
                  <Link
                    href="/dashboard/integrations"
                    className="block p-3 bg-slate-950 hover:bg-slate-800/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition"
                  >
                    ⚡ Multi-Stack Language Snippets
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="block p-3 bg-slate-950 hover:bg-slate-800/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition"
                  >
                    ⚙️ Configure Discord & Email Alerts
                  </Link>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Primary Project Key
                  </span>
                  <code className="text-[11px] font-mono text-purple-400 block truncate bg-slate-950 p-2 rounded border border-slate-800">
                    {projectKey || 'Loading...'}
                  </code>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}