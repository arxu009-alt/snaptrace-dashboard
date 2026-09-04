'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';

interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  error_count?: number;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: projectList, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && projectList) {
      const { data: errors } = await supabase
        .from('errors')
        .select('project_id');

      const counts: Record<string, number> = {};
      if (errors) {
        errors.forEach((err) => {
          counts[err.project_id] = (counts[err.project_id] || 0) + 1;
        });
      }

      const formatted = projectList.map((p) => ({
        ...p,
        error_count: counts[p.id] || 0,
      }));

      setProjects(formatted);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Jump to filtered errors when event badge is clicked
  const handleJumpToErrors = (projectId: string) => {
    localStorage.setItem('snaptrace_selected_project_id', projectId);
    window.dispatchEvent(new Event('snaptrace_project_change'));
    router.push('/dashboard/errors');
  };

  const generateApiKey = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `sk_live_${randomHex}`;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setCreating(false);
      return;
    }

    const apiKey = generateApiKey();

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: newProjectName.trim(),
          api_key: apiKey,
          user_id: user.id,
        },
      ])
      .select();

    if (!error && data && data.length > 0) {
      setProjects([{ ...data[0], error_count: 0 }, ...projects]);
      setNewProjectName('');
      setIsModalOpen(false);
      window.dispatchEvent(new Event('snaptrace_project_change'));
    }
    setCreating(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? All associated crash logs will be permanently removed.')) {
      return;
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      setProjects(projects.filter((p) => p.id !== id));
      window.dispatchEvent(new Event('snaptrace_project_change'));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-8 font-sans selection:bg-yellow-400 selection:text-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Projects & Credentials</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-mono font-bold">
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Manage your project keys and click on any event counter to inspect live exceptions.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>+</span>
            <span>Create New Project</span>
          </button>
        </div>

        {loading ? (
          /* Custom SnapTrace Brand Pulse Loader */
          <div className="p-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="relative animate-pulse">
              <SnapTraceLogo size="lg" showText={false} />
            </div>
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">Loading Projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
            <div className="text-3xl">📁</div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Projects Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first project to generate an API key and start ingesting telemetry.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              + Create First Project
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 hover:border-slate-700/90 rounded-3xl p-6 space-y-5 shadow-2xl transition group"
              >
                {/* Project Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📁</span>
                      <h2 className="text-base font-bold text-white group-hover:text-yellow-400 transition">
                        {project.name}
                      </h2>
                      
                      {/* Clickable Event Counter Badge */}
                      <button
                        onClick={() => handleJumpToErrors(project.id)}
                        className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 transition flex items-center gap-1 cursor-pointer"
                        title="Click to view all live exceptions for this project"
                      >
                        <span>{project.error_count} {project.error_count === 1 ? 'event' : 'events'}</span>
                        <span className="text-[10px]">→</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 font-mono">
                      Project ID: <span className="text-slate-400 font-semibold">{project.id}</span> • Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Delete Project
                    </button>
                  </div>
                </div>

                {/* API Key Box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                    ACTIVE INGESTION TOKEN
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={project.api_key}
                      className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-yellow-300 font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(project.api_key, project.id)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition min-w-[80px] cursor-pointer shadow-sm"
                    >
                      {copiedId === project.id ? '✓ Copied' : 'Copy Key'}
                    </button>
                  </div>
                </div>

                {/* Multi-Language Snippet Callout */}
                <div className="bg-[#05070E] border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>⚡</span> Multi-Language SDK Snippets Available
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Pre-configured with this key for JavaScript, Next.js, Python, Node, PHP, Ruby, Kotlin, and cURL.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/integrations"
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition self-start sm:self-auto cursor-pointer"
                  >
                    View Code Snippets →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Project */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-[#090D16] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Create New Project
                </h3>
                <p className="text-xs text-slate-400">
                  Enter a project name to generate a dedicated API key and telemetry endpoint.
                </p>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Python Backend API, React Web App"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? 'Generating...' : 'Create Project →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}