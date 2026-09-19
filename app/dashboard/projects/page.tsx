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
  plan_tier?: string;
  error_count?: number;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User Tier & Project Limits (All early beta users get Pro with 5 projects!)
  const [userPlanTier, setUserPlanTier] = useState<string>('pro');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [limitErrorModal, setLimitErrorModal] = useState<string | null>(null);

  // Create Project State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  // Rename Project State
  const [renameData, setRenameData] = useState<{ id: string; name: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Key Visibility & Actions State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingSuccessId, setPingSuccessId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const email = session.user.email || '';
    const ownerCheck = email.toLowerCase() === 'arxu1045@gmail.com' || email.toLowerCase() === 'arxu009@gmail.com';
    setIsOwner(ownerCheck);

    // During Public Beta, all registered accounts receive Pro Builder (5 projects) or Unlimited (Owner)
    const activeTier = ownerCheck ? 'agency' : 'pro';
    setUserPlanTier(activeTier);

    const { data: projectList, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
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

  const handleJumpToErrors = (projectId: string) => {
    localStorage.setItem('snaptrace_selected_project_id', projectId);
    window.dispatchEvent(new Event('snaptrace_project_change'));
    router.push('/dashboard/errors');
  };

  const generateApiKey = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return 'sk_live_' + randomHex;
  };

  // 🌟 CHECK PROJECT CREATION LIMIT: Pro Beta users get 5 projects!
  const handleOpenCreateModal = () => {
    if (isOwner || userPlanTier === 'agency' || userPlanTier === 'team') {
      setIsCreateModalOpen(true);
      return;
    }

    // Pro tier limit: 5 projects
    if (projects.length >= 5) {
      setLimitErrorModal('You have reached the Pro limit of 5 active projects. To manage unlimited client projects, request Agency Studio access.');
      return;
    }

    setIsCreateModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
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
          user_id: session.user.id,
          plan_tier: userPlanTier,
        },
      ])
      .select();

    if (!error && data && data.length > 0) {
      setProjects([{ ...data[0], error_count: 0 }, ...projects]);
      setNewProjectName('');
      setIsCreateModalOpen(false);
      window.dispatchEvent(new Event('snaptrace_project_change'));
    }
    setCreating(false);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameData || !renameInput.trim() || renameInput.trim() === renameData.name) {
      setRenameData(null);
      return;
    }

    setRenaming(true);
    const updatedName = renameInput.trim();

    const { error } = await supabase
      .from('projects')
      .update({ name: updatedName })
      .eq('id', renameData.id);

    if (!error) {
      setProjects((prev) =>
        prev.map((p) => (p.id === renameData.id ? { ...p, name: updatedName } : p))
      );
      window.dispatchEvent(new Event('snaptrace_project_change'));
    }

    setRenaming(false);
    setRenameData(null);
  };

  const handleRotateKey = async (projectId: string) => {
    if (!confirm('Are you sure you want to rotate this API key? Applications using the old token will stop logging errors until updated.')) {
      return;
    }

    const newKey = generateApiKey();

    const { error } = await supabase
      .from('projects')
      .update({ api_key: newKey })
      .eq('id', projectId);

    if (!error) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, api_key: newKey } : p))
      );
      window.dispatchEvent(new Event('snaptrace_project_change'));
    }
  };

  const handleTestPingForProject = async (project: Project) => {
    setPingingId(project.id);
    setPingSuccessId(null);

    try {
      const res = await fetch('/api/v1/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: project.api_key,
          message: 'Synthetic Test Crash: ' + project.name,
          stackTrace: 'Error: Verification crash on ' + project.name + '\n    at ProjectCard.testPing (/dashboard/projects)',
          environment: 'production',
          url: window.location.href,
        }),
      });

      if (res.ok) {
        setPingSuccessId(project.id);
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? { ...p, error_count: (p.error_count || 0) + 1 } : p))
        );
        setTimeout(() => setPingSuccessId(null), 3500);
      }
    } finally {
      setPingingId(null);
    }
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

  const toggleKeyVisibility = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const projectCapLabel = isOwner || userPlanTier === 'agency' || userPlanTier === 'team'
    ? 'Unlimited'
    : '5 Projects (Beta Pro)';

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-8 font-sans selection:bg-yellow-400 selection:text-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 flex-wrap">
              <span>Projects & Credentials</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 font-mono font-semibold">
                {projects.length} / {projectCapLabel}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Manage telemetry tokens, rename repositories, rotate credentials, and verify endpoints.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto font-mono"
          >
            <span>+</span>
            <span>Create New Project</span>
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <div className="relative animate-pulse">
              <SnapTraceLogo size="lg" showText={false} />
            </div>
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">Loading Projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[#0B101D] border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
            <div className="text-3xl">📁</div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Projects Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first project to generate a secret key and start ingesting crash telemetry.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer font-mono"
            >
              + Create First Project
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {projects.map((project) => {
              const isRevealed = Boolean(revealedKeys[project.id]);
              const displayKey = isRevealed
                ? project.api_key
                : project.api_key.slice(0, 10) + '••••••••••••••••' + project.api_key.slice(-8);

              return (
                <div
                  key={project.id}
                  className="bg-[#0B101D]/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg transition backdrop-blur-sm group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-lg">📁</span>
                        <h2 className="text-base font-bold text-white group-hover:text-yellow-300 transition">
                          {project.name}
                        </h2>

                        <button
                          onClick={() => {
                            setRenameData({ id: project.id, name: project.name });
                            setRenameInput(project.name);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-yellow-300 text-xs font-mono transition border border-slate-700/60 flex items-center gap-1 cursor-pointer"
                          title="Rename Project"
                        >
                          <span>✎</span>
                          <span className="text-[10px]">Rename</span>
                        </button>
                        
                        <button
                          onClick={() => handleJumpToErrors(project.id)}
                          className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 transition flex items-center gap-1 cursor-pointer"
                          title="Click to view all live exceptions for this project"
                        >
                          <span>{project.error_count} {project.error_count === 1 ? 'event' : 'events'}</span>
                          <span className="text-[10px]">→</span>
                        </button>

                        {pingSuccessId === project.id && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-in fade-in">
                            ✓ Test Crash Captured!
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-mono">
                        Project ID: <span className="text-slate-400">{project.id}</span> • Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 font-mono flex-wrap">
                      <button
                        onClick={() => handleTestPingForProject(project)}
                        disabled={pingingId === project.id}
                        className="px-3 py-1.5 bg-[#05070E] hover:bg-slate-800 text-yellow-300 border border-yellow-400/30 text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
                        title="Send a live test crash to verify this specific project token"
                      >
                        <span>{pingingId === project.id ? '⚡ Pinging...' : '⚡ Test Ping'}</span>
                      </button>

                      <button
                        onClick={() => handleRotateKey(project.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                        title="Rotate API Key if compromised"
                      >
                        Rotate Key
                      </button>

                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        Delete Project
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Active Ingestion Token
                      </label>
                      <button
                        onClick={() => toggleKeyVisibility(project.id)}
                        className="text-[10px] font-mono text-slate-400 hover:text-yellow-300 transition cursor-pointer"
                      >
                        {isRevealed ? '🙈 Hide Token' : '👁️ Reveal Full Token'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-yellow-300 font-mono flex items-center justify-between">
                        <span className="truncate">{displayKey}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(project.api_key, project.id)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition min-w-[85px] cursor-pointer shadow-sm font-mono shrink-0"
                      >
                        {copiedId === project.id ? '✓ Copied' : 'Copy Key'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#05070E] border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <span className="text-yellow-400">⚡</span> Multi-Language SDK Snippets Available
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Pre-configured with this key for JavaScript, Next.js, Python, Node, PHP, Ruby, Kotlin, and cURL.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/integrations"
                      className="px-4 py-1.5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition self-start sm:self-auto cursor-pointer font-mono whitespace-nowrap"
                    >
                      View Code Snippets →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PROJECT LIMIT MODAL */}
        {limitErrorModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans">
            <div className="bg-[#090D16] border-2 border-yellow-400/40 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setLimitErrorModal(null)}
                className="absolute right-5 top-5 text-slate-400 hover:text-white text-xs cursor-pointer font-mono"
              >
                ✕
              </button>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 text-[10px] font-mono font-bold uppercase">
                  <span>⚡</span> Plan Quota Notice
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Pro Beta Project Limit
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {limitErrorModal}
                </p>
              </div>

              <div className="p-3 bg-[#05070E] rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                💡 Need unlimited client projects for an agency? Contact our team at <strong className="text-yellow-300">hello.snaptrace@gmail.com</strong>.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1 font-mono">
                <button
                  type="button"
                  onClick={() => setLimitErrorModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href="/dashboard/settings"
                  className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-md font-mono"
                >
                  View Plan Settings →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: RENAME PROJECT */}
        {renameData && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-[#090D16] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>✎</span> Rename Project
                </h3>
                <p className="text-xs text-slate-400">
                  Update the display name of this project repository.
                </p>
              </div>

              <form onSubmit={handleRenameSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block font-mono">Project Name</label>
                  <input
                    type="text"
                    required
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400 font-mono transition"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-1 font-mono">
                  <button
                    type="button"
                    onClick={() => setRenameData(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={renaming}
                    className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {renaming ? 'Saving...' : 'Save Name →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE NEW PROJECT */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-[#090D16] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Create New Project
                </h3>
                <p className="text-xs text-slate-400">
                  Enter a project name to generate a dedicated API key and telemetry endpoint.
                </p>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block font-mono">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Python Backend API, Next.js Store"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition font-mono"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-1 font-mono">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
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