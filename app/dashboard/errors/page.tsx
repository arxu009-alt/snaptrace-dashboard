'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertCircle,
  Clock,
  Globe,
  RefreshCw,
  Search,
  Terminal,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2
} from 'lucide-react';

interface ErrorLog {
  id: string;
  project_id: string;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  environment: string;
  created_at: string;
  projects?: {
    name: string;
  };
}

export default function ErrorStreamPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<{ [key: string]: string }>({});
  const [explainingId, setExplainingId] = useState<string | null>(null);

  useEffect(() => {
    fetchErrors();

    // Enable Supabase Realtime subscription for incoming telemetry
    const channel = supabase
      .channel('realtime_errors')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'errors' },
        (payload) => {
          const newError = payload.new as ErrorLog;
          setErrors((prev) => [newError, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchErrors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('errors')
      .select('*, projects(name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setErrors(data as ErrorLog[]);
    }
    setLoading(false);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchErrors();
    setRefreshing(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedErrorId(expandedErrorId === id ? null : id);
  };

  const generateAiExplanation = (errorItem: ErrorLog) => {
    setExplainingId(errorItem.id);
    
    // Simulate Basic Freemium AI explanation generation
    setTimeout(() => {
      const summary = `The error "${errorItem.message}" indicates an unhandled runtime exception. This typically occurs when your application attempts to reference or execute operations on an undefined value or unavailable window object. Check line execution before triggering this route.`;
      setAiExplanation((prev) => ({ ...prev, [errorItem.id]: summary }));
      setExplainingId(null);
    }, 1200);
  };

  const filteredErrors = errors.filter((err) =>
    err.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (err.url && err.url.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <AlertCircle className="w-6 h-6 text-indigo-400" />
            Live Error Stream
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time uncaught runtime errors and stack traces.</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Stream
        </button>
      </header>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by error message or URL..."
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Error Stream List */}
      {loading ? (
        <div className="flex justify-center items-center py-16 bg-slate-900/40 border border-slate-800 rounded-xl">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : filteredErrors.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-xl">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No errors detected</p>
          <p className="text-sm text-slate-500 mt-1">Trigger an exception in your connected application to test ingestion.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredErrors.map((err) => {
            const isExpanded = expandedErrorId === err.id;
            return (
              <div
                key={err.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl transition-all overflow-hidden"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(err.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="px-2.5 py-1 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-md shrink-0">
                      Error
                    </span>
                    <p className="font-mono text-sm text-slate-200 truncate font-medium">
                      {err.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-xs text-slate-400">
                    <span className="hidden md:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      {err.environment}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(err.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-4">
                    {/* URL Context */}
                    {err.url && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">URL:</span>
                        <code className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">
                          {err.url}
                        </code>
                      </div>
                    )}

                    {/* Stack Trace Box */}
                    {err.stack && (
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                          <Terminal className="w-4 h-4 text-indigo-400" />
                          Stack Trace
                        </div>
                        <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {err.stack}
                        </pre>
                      </div>
                    )}

                    {/* AI Explanation Action */}
                    <div className="pt-2 border-t border-slate-900">
                      {aiExplanation[err.id] ? (
                        <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4 text-xs">
                          <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                            <Sparkles className="w-4 h-4" />
                            AI Error Explanation (Freemium Tier)
                          </div>
                          <p className="text-slate-300 leading-relaxed">{aiExplanation[err.id]}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateAiExplanation(err)}
                          disabled={explainingId === err.id}
                          className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
                        >
                          {explainingId === err.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          Explain Error with AI
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}