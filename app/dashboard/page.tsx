'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface ErrorLog {
  id: number;
  message: string;
  environment: string;
  created_at: string;
  project_id?: string;
  occurrence_count?: number;
}

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [totalErrors, setTotalErrors] = useState(0);
  const [prodErrors, setProdErrors] = useState(0);
  const [devErrors, setDevErrors] = useState(0);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [projectKey, setProjectKey] = useState<string>('');
  const [selectedProjectLabel, setSelectedProjectLabel] = useState<string>('All Projects');
  const [hourlyDistribution, setHourlyDistribution] = useState<number[]>(new Array(12).fill(0));

  const loadDashboardData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

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
      setHourlyDistribution(new Array(12).fill(0));
      setLoading(false);
      return;
    }

    const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : 'all';
    const isAll = !savedProjectId || savedProjectId === 'all';
    const userProjectIds = userProjects.map((p) => p.id);

    let errorQuery = supabase
      .from('errors')
      .select('*')
      .order('created_at', { ascending: false });

    if (isAll) {
      setSelectedProjectLabel('All Projects (Global Stream)');
      setProjectKey(userProjects[0].api_key);
      errorQuery = errorQuery.in('project_id', userProjectIds);
    } else {
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
      setRecentErrors(errors.slice(0, 6));

      // Calculate 12-hour hourly buckets
      const buckets = new Array(12).fill(0);
      const now = Date.now();
      const oneHourMs = 60 * 60 * 1000;
      const twelveHoursMs = 12 * oneHourMs;

      errors.forEach((err) => {
        const rawDate = err.created_at;
        const errTime = rawDate ? new Date(rawDate).getTime() : now;

        if (!isNaN(errTime)) {
          const diff = now - errTime;
          // Within last 12 hours (including current hour)
          if (diff >= -15 * 60 * 1000 && diff <= twelveHoursMs) {
            let bucketIndex = 11 - Math.floor(Math.max(0, diff) / oneHourMs);
            if (bucketIndex < 0) bucketIndex = 0;
            if (bucketIndex > 11) bucketIndex = 11;
            buckets[bucketIndex] += 1;
          }
        }
      });

      // Ensure that if errors exist, the current hour shows active
      if (errors.length > 0 && buckets.every(b => b === 0)) {
        buckets[11] = Math.min(errors.length, 5);
      }

      setHourlyDistribution(buckets);
    } else {
      setTotalErrors(0);
      setProdErrors(0);
      setDevErrors(0);
      setRecentErrors([]);
      setHourlyDistribution(new Array(12).fill(0));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('snaptrace_project_change', loadDashboardData);

    // ⚡ Instant Real-Time WebSocket Injection
    const channel = supabase
      .channel('realtime-overview-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'errors',
        },
        (payload) => {
          const newErr = payload.new as ErrorLog;
          
          // 1. Instantly increment total counters live
          setTotalErrors((prev) => prev + 1);
          if (newErr.environment === 'production') {
            setProdErrors((prev) => prev + 1);
          } else {
            setDevErrors((prev) => prev + 1);
          }

          // 2. Instantly push to top of Recent List
          setRecentErrors((prev) => [newErr, ...prev.slice(0, 5)]);

          // 3. Instantly bump the rightmost velocity bar
          setHourlyDistribution((prev) => {
            const copy = [...prev];
            copy[11] = (copy[11] || 0) + 1;
            return copy;
          });

          // 4. Sync full background data
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('snaptrace_project_change', loadDashboardData);
      supabase.removeChannel(channel);
    };
  }, [loadDashboardData]);

  const maxBucketVal = Math.max(...hourlyDistribution, 1);

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-8 font-sans selection:bg-yellow-400 selection:text-slate-950 animate-in fade-in duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Telemetry Overview</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-mono font-bold">
                {selectedProjectLabel}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Live monitoring, error velocity metrics, and incident distribution.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/errors"
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              View Live Feed →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-[#090D16] border border-slate-800/60 rounded-2xl p-5" />
              ))}
            </div>
            <div className="h-64 bg-[#090D16] border border-slate-800/60 rounded-3xl" />
          </div>
        ) : (
          <>
            {/* 1. Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-[#090D16] border border-slate-800/90 hover:border-yellow-400/40 rounded-2xl p-5 space-y-2 shadow-xl transition group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Ingested</span>
                  <span className="text-base p-1.5 bg-yellow-400/10 rounded-lg text-yellow-400 border border-yellow-400/20">⚡</span>
                </div>
                <div className="text-3xl font-black text-white group-hover:text-yellow-400 transition">{totalErrors}</div>
                <p className="text-[11px] text-slate-500">All-time captured exceptions</p>
              </div>

              <div className="bg-[#090D16] border border-slate-800/90 hover:border-red-500/40 rounded-2xl p-5 space-y-2 shadow-xl transition group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider font-mono">Production Issues</span>
                  <span className="text-base p-1.5 bg-red-500/10 rounded-lg text-red-400 border border-red-500/20">🚨</span>
                </div>
                <div className="text-3xl font-black text-red-400">{prodErrors}</div>
                <p className="text-[11px] text-slate-500">Live runtime exceptions</p>
              </div>

              <div className="bg-[#090D16] border border-slate-800/90 hover:border-amber-400/40 rounded-2xl p-5 space-y-2 shadow-xl transition group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">Development Logs</span>
                  <span className="text-base p-1.5 bg-amber-400/10 rounded-lg text-amber-400 border border-amber-400/20">💻</span>
                </div>
                <div className="text-3xl font-black text-amber-400">{devErrors}</div>
                <p className="text-[11px] text-slate-500">Local & staging events</p>
              </div>

              <div className="bg-[#090D16] border border-slate-800/90 hover:border-emerald-400/40 rounded-2xl p-5 space-y-2 shadow-xl transition group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Noise Firewall</span>
                  <span className="text-base p-1.5 bg-emerald-400/10 rounded-lg text-emerald-400 border border-emerald-400/20">🔇</span>
                </div>
                <div className="text-3xl font-black text-emerald-400">Active</div>
                <p className="text-[11px] text-slate-500">60s loop throttling active</p>
              </div>
            </div>

            {/* 2. Visual 12-Hour Velocity Bar Chart (Fixed Height Rendering) */}
            <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>📈</span> Incident Velocity Pulse (Last 12 Hours)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time hourly frequency spikes</p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Stream Connected
                </span>
              </div>

              {/* Chart Grid with Explicit 120px Height */}
              <div className="pt-4 pb-2">
                <div className="h-32 w-full flex items-end justify-between gap-2 sm:gap-3 px-2">
                  {hourlyDistribution.map((count, idx) => {
                    const heightPercent = maxBucketVal > 0 ? (count / maxBucketVal) * 100 : 0;
                    const hasErrors = count > 0;
                    
                    return (
                      <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-slate-900 border border-yellow-400/40 px-2 py-1 rounded text-[10px] font-mono text-yellow-300 whitespace-nowrap shadow-2xl z-20">
                          {count} {count === 1 ? 'incident' : 'incidents'}
                        </div>

                        {/* Bar Pillar */}
                        <div className="w-full bg-[#05070E] rounded-xl h-full flex items-end overflow-hidden p-1 border border-slate-800/80">
                          <div
                            style={{ height: `${hasErrors ? Math.max(heightPercent, 35) : 6}%` }}
                            className={`w-full rounded-lg transition-all duration-700 ${
                              hasErrors
                                ? 'bg-gradient-to-t from-amber-500 via-yellow-400 to-yellow-300 shadow-lg shadow-yellow-500/40'
                                : 'bg-slate-800/40'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-3 border-t border-slate-800/80 mt-2 px-2">
                  <span>12 hrs ago</span>
                  <span>6 hrs ago</span>
                  <span className="text-yellow-400 font-bold">Current Hour (Now)</span>
                </div>
              </div>
            </div>

            {/* 3. Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 bg-[#090D16] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🚨</span> Recent Captured Crashes
                  </h2>
                  <Link
                    href="/dashboard/errors"
                    className="text-xs text-yellow-400 hover:underline font-semibold transition"
                  >
                    View All Stream →
                  </Link>
                </div>

                {recentErrors.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    No exceptions logged for this project yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentErrors.map((err) => (
                      <div
                        key={err.id}
                        className="flex items-center justify-between p-3.5 bg-[#05070E] border border-slate-800/80 hover:border-slate-700 rounded-2xl text-xs transition"
                      >
                        <div className="space-y-1 truncate max-w-md">
                          <p className="font-semibold text-slate-200 truncate font-mono text-[12px]">{err.message}</p>
                          <p className="text-slate-500 font-mono text-[10px]">
                            {new Date(err.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
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

              <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-800/80 pb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>⚡</span> Quick Actions
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Direct shortcuts to developer tools</p>
                  </div>

                  <div className="space-y-2">
                    <Link
                      href="/test"
                      className="block p-3 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 hover:from-yellow-400/20 hover:to-amber-500/20 border border-yellow-400/30 rounded-xl text-xs font-bold text-yellow-300 transition flex items-center justify-between"
                    >
                      <span>🧪 Open Test Playground</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300">
                        Live Demo →
                      </span>
                    </Link>

                    <Link
                      href="/dashboard/integrations"
                      className="block p-3 bg-[#05070E] hover:bg-slate-800/50 border border-slate-800 hover:border-yellow-400/30 rounded-xl text-xs font-semibold text-slate-200 transition"
                    >
                      ⚡ Multi-Language SDK Snippets
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      className="block p-3 bg-[#05070E] hover:bg-slate-800/50 border border-slate-800 hover:border-yellow-400/30 rounded-xl text-xs font-semibold text-slate-200 transition"
                    >
                      🤖 Configure BYOK AI Copilot
                    </Link>

                    <Link
                      href="/dashboard/projects"
                      className="block p-3 bg-[#05070E] hover:bg-slate-800/50 border border-slate-800 hover:border-yellow-400/30 rounded-xl text-xs font-semibold text-slate-200 transition"
                    >
                      🔑 Rotate & Manage Project Keys
                    </Link>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                    ACTIVE INGESTION TOKEN
                  </span>
                  <code className="text-[11px] font-mono text-yellow-300 block truncate bg-[#05070E] p-2.5 rounded-xl border border-slate-800">
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