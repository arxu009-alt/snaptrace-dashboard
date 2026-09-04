'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import InspectErrorModal from '@/components/InspectErrorModal';
import SnapTraceLogo from '@/components/SnapTraceLogo';

interface ErrorLog {
  id: number;
  message: string;
  stack_trace?: string;
  stack?: string;
  environment: string;
  url?: string;
  user_agent?: string;
  created_at: string;
  status?: string;
  project_id?: string;
  occurrence_count?: number;
}

export default function ExceptionLogsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlProjectId = searchParams.get('projectId');

  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProjectName, setCurrentProjectName] = useState<string>('All Projects');
  const [isUrlFiltered, setIsUrlFiltered] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'development'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  const loadLogs = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: userProjects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id);

    if (!userProjects || userProjects.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const targetProjectId = urlProjectId || (typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : 'all');
    const isAll = !targetProjectId || targetProjectId === 'all';
    const userProjectIds = userProjects.map((p) => p.id);

    setIsUrlFiltered(Boolean(urlProjectId));

    let query = supabase
      .from('errors')
      .select('*')
      .order('created_at', { ascending: false });

    if (isAll) {
      setCurrentProjectName('All Projects (Global)');
      query = query.in('project_id', userProjectIds);
    } else {
      const activeProj = userProjects.find((p) => p.id === targetProjectId);
      setCurrentProjectName(activeProj ? activeProj.name : 'Selected Project');
      query = query.eq('project_id', targetProjectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error.message);
    } else if (data) {
      setLogs(data);
    }
    setLoading(false);
  }, [urlProjectId]);

  useEffect(() => {
    loadLogs();
    window.addEventListener('snaptrace_project_change', loadLogs);

    const channel = supabase
      .channel('realtime-errors-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'errors',
        },
        (payload) => {
          const targetProjectId = urlProjectId || (typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : 'all');
          if (!targetProjectId || targetProjectId === 'all' || payload.new.project_id === targetProjectId) {
            setLogs((prevLogs) => [payload.new as ErrorLog, ...prevLogs]);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('snaptrace_project_change', loadLogs);
      supabase.removeChannel(channel);
    };
  }, [loadLogs, urlProjectId]);

  const handleClearUrlFilter = () => {
    router.push('/dashboard/errors');
  };

  const handleToggleStatus = async (id: number, currentStatus?: string) => {
    const newStatus = currentStatus === 'resolved' ? 'unresolved' : 'resolved';
    
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, status: newStatus } : log))
    );

    try {
      await supabase.from('errors').update({ status: newStatus }).eq('id', id);
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleDeleteLog = async (id: number) => {
    const { error } = await supabase.from('errors').delete().eq('id', id);
    if (!error) {
      setLogs((prev) => prev.filter((log) => log.id !== id));
      if (selectedLog?.id === id) setSelectedLog(null);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logStatus = log.status || 'unresolved';
      
      if (statusFilter !== 'all' && logStatus !== statusFilter) {
        return false;
      }

      if (envFilter !== 'all' && log.environment.toLowerCase() !== envFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMsg = log.message?.toLowerCase().includes(q);
        const matchUrl = log.url?.toLowerCase().includes(q);
        const matchStack = (log.stack_trace || log.stack || '').toLowerCase().includes(q);
        return matchMsg || matchUrl || matchStack;
      }

      return true;
    });
  }, [logs, statusFilter, envFilter, searchQuery]);

  const unresolvedCount = logs.filter((l) => (l.status || 'unresolved') === 'unresolved').length;
  const resolvedCount = logs.filter((l) => l.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-8 font-sans selection:bg-yellow-400 selection:text-slate-950 animate-in fade-in duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
              <span>Exception Logs Stream</span>

              {isUrlFiltered ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-mono font-bold animate-in zoom-in-95">
                  <span>📁 {currentProjectName}</span>
                  <button
                    onClick={handleClearUrlFilter}
                    className="ml-1 hover:text-white bg-yellow-400/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-pointer"
                    title="Clear filter and view all projects"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-mono font-bold">
                  {currentProjectName}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Live telemetry feed with issue triage and real-time noise deduplication.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#090D16] border border-slate-800 px-3.5 py-1.5 rounded-full self-start sm:self-auto shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-400 font-bold tracking-wide uppercase font-mono">
              Live Stream Active
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-4 space-y-4 shadow-xl">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="flex-1 relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search error messages, URLs, or file paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#05070E] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition"
              />
            </div>

            {/* Environment Filter Pills */}
            <div className="flex items-center space-x-1 bg-[#05070E] border border-slate-800 p-1 rounded-xl self-start md:self-auto">
              {(['all', 'production', 'development'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setEnvFilter(env)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                    envFilter === env
                      ? 'bg-yellow-400 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>

          </div>

          {/* Triage Status Tabs */}
          <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3 text-xs">
            <button
              onClick={() => setStatusFilter('unresolved')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'unresolved'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>🚨 Unresolved</span>
              <span className="px-1.5 py-0.2 bg-red-950/60 rounded text-[10px] font-mono font-bold">
                {unresolvedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>✓ Resolved</span>
              <span className="px-1.5 py-0.2 bg-emerald-950/60 rounded text-[10px] font-mono font-bold">
                {resolvedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              All Events ({logs.length})
            </button>
          </div>

        </div>

        {/* Exception Table with Wide Columns (No Button Clipping) */}
        <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
              <div className="relative animate-pulse">
                <SnapTraceLogo size="lg" showText={false} />
              </div>
              <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">Streaming Exceptions...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs font-mono space-y-3">
              <div className="text-3xl">🎉</div>
              <p className="font-semibold text-slate-300 text-sm">
                {logs.length === 0 ? 'No exceptions captured yet.' : 'No matching issues found for this filter.'}
              </p>
              <p className="text-slate-500">Your application runtime is running smoothly.</p>
              {isUrlFiltered && (
                <button
                  onClick={handleClearUrlFilter}
                  className="mt-2 px-4 py-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  View All Projects Instead →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/90 bg-[#060911] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-4 w-12 text-center">Status</th>
                    <th className="py-4 px-4 w-44">Timestamp</th>
                    <th className="py-4 px-4">Exception Message</th>
                    <th className="py-4 px-4 w-32">Environment</th>
                    <th className="py-4 px-6 w-44 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-200">
                  {filteredLogs.map((log) => {
                    const isResolved = log.status === 'resolved';
                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-800/40 transition group ${
                          isResolved ? 'opacity-50 bg-[#05070E]/50' : ''
                        }`}
                      >
                        {/* Status Checkbox */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(log.id, log.status)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center text-[10px] font-bold transition cursor-pointer ${
                              isResolved
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm'
                                : 'border-slate-700 hover:border-emerald-400 hover:text-emerald-400 text-transparent'
                            }`}
                            title={isResolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
                          >
                            ✓
                          </button>
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>

                        {/* Message */}
                        <td className="py-4 px-4 font-mono font-medium truncate max-w-xs md:max-w-sm">
                          <span className={isResolved ? 'line-through text-slate-400' : 'text-slate-100 font-semibold'}>
                            {log.message || log.stack || 'Unknown exception'}
                          </span>
                        </td>

                        {/* Environment Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                              log.environment === 'production'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {log.environment || 'production'}
                          </span>
                        </td>

                        {/* Actions (Inspect & Delete fully spaced) */}
                        <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-xs text-red-400 font-medium rounded-xl border border-red-800/50 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Deep Inspection Modal */}
        {selectedLog && (
          <InspectErrorModal
            log={selectedLog}
            onClose={() => setSelectedLog(null)}
            onDelete={handleDeleteLog}
          />
        )}

      </div>
    </div>
  );
}