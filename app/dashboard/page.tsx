"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  LogOut, 
  AlertCircle, 
  Terminal, 
  Key, 
  Loader2 
} from "lucide-react";

// --- Types ---
interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
}

interface User {
  id: string;
  email?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  // Track copied states for UI feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  // --- Auth & Data Initialization ---
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          router.push("/login");
          return;
        }

        if (mounted) {
          setUser({
            id: session.user.id,
            email: session.user.email,
          });
          await fetchProjects(session.user.id);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to authenticate session.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      } else if (event === "SIGNED_IN" && session) {
        setUser({ id: session.user.id, email: session.user.email });
        fetchProjects(session.user.id);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // --- Database Operations ---
  const fetchProjects = async (userId: string) => {
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("projects")
        .select("id, name, api_key, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load projects.");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !user) return;

    setIsCreating(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("projects")
        .insert([
          { 
            name: newProjectName.trim(), 
            user_id: user.id 
          }
        ]);

      if (insertError) throw insertError;

      setNewProjectName("");
      await fetchProjects(user.id);
    } catch (err: any) {
      setError(err.message || "Failed to create project.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete project.");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err: any) {
      setError("Failed to log out.");
    }
  };

  // --- Utilities ---
  const copyToClipboard = async (text: string, id: string, isSnippet: boolean = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isSnippet) {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
      } else {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      setError("Failed to copy to clipboard.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const sdkSnippet = `<script src="https://snaptrace-dashboard.vercel.app/sdk.js" data-api-key="YOUR_KEY"></script>`;

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="min-h-full w-full bg-[#070a12] flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-full w-full bg-[#070a12] text-slate-200 p-6 md:p-10 font-sans selection:bg-[#2563eb] selection:text-white">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-[#1e293b]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">API Keys & Projects</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage your SnapTrace environments and integration keys.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400 hidden md:block">
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-[#0b0f19] border border-[#1e293b] rounded-lg hover:bg-[#1e293b] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2 focus:ring-offset-[#070a12]"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Projects & Creation */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Create Project Card */}
          <section className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#2563eb]" />
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Production App, Staging Environment"
                className="flex-1 bg-[#070a12] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                required
                disabled={isCreating}
              />
              <button
                type="submit"
                disabled={isCreating || !newProjectName.trim()}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#2563eb] hover:bg-blue-600 disabled:bg-[#2563eb]/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2 focus:ring-offset-[#0b0f19]"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
              </button>
            </form>
          </section>

          {/* Projects Grid */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-[#2563eb]" />
              Active Projects
            </h2>
            
            {projects.length === 0 ? (
              <div className="bg-[#0b0f19] border border-[#1e293b] border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-[#1e293b]/50 rounded-full flex items-center justify-center mb-4">
                  <Key className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-white font-medium mb-1">No projects found</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Create your first project above to generate an API key and start monitoring your application.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-5 hover:border-slate-700 transition-colors group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-white font-medium truncate pr-4" title={project.name}>
                          {project.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Created {formatDate(project.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-400/10 transition-colors focus:outline-none"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-[#1e293b]">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                        API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 block bg-[#070a12] border border-[#1e293b] rounded-md px-3 py-2 text-xs text-emerald-400 font-mono truncate">
                          {project.api_key || "sk_live_pending..."}
                        </code>
                        <button
                          onClick={() => copyToClipboard(project.api_key, project.id)}
                          className="shrink-0 p-2 bg-[#1e293b] hover:bg-slate-700 text-slate-300 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                          title="Copy API Key"
                        >
                          {copiedId === project.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: SDK Integration */}
        <div className="xl:col-span-1">
          <section className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-[#2563eb]" />
              <h2 className="text-lg font-semibold text-white">SDK Integration</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Add the SnapTrace script to the <code className="text-slate-300 bg-[#1e293b] px-1 py-0.5 rounded">&lt;head&gt;</code> of your application. Replace <code className="text-slate-300 bg-[#1e293b] px-1 py-0.5 rounded">YOUR_KEY</code> with a project API key from the left.
            </p>
            
            <div className="relative group">
              <div className="absolute right-2 top-2">
                <button
                  onClick={() => copyToClipboard(sdkSnippet, "snippet", true)}
                  className="p-1.5 bg-[#1e293b] hover:bg-slate-700 text-slate-300 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  title="Copy Snippet"
                >
                  {copiedSnippet ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <pre className="bg-[#070a12] border border-[#1e293b] rounded-lg p-4 overflow-x-auto text-xs text-slate-300 font-mono leading-relaxed">
                <code className="language-html">
                  <span className="text-blue-400">&lt;script</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-emerald-300">src</span>=<span className="text-amber-300">"https://snaptrace-dashboard.vercel.app/sdk.js"</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-emerald-300">data-api-key</span>=<span className="text-amber-300">"YOUR_KEY"</span><span className="text-blue-400">&gt;</span>
                  <br />
                  <span className="text-blue-400">&lt;/script&gt;</span>
                </code>
              </pre>
            </div>
            
            <div className="mt-6 p-4 bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-lg">
              <h4 className="text-sm font-medium text-[#2563eb] mb-1">Need help?</h4>
              <p className="text-xs text-slate-400">
                Check out our official documentation to learn about advanced configuration options and custom event tracking.
              </p>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}