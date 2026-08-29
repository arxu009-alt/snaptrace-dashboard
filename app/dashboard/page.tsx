'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  LogOut, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Terminal, 
  Key, 
  ShieldCheck,
  Menu
} from 'lucide-react';

// --- Mock Data ---
const initialProjects = [
  { id: '1', name: 'Production API', api_key: 'sk_live_9f8d7c6b5a4e3d2c1b0a', status: 'active', created_at: '2023-10-12T08:00:00Z' },
  { id: '2', name: 'Staging Environment', api_key: 'sk_test_1a2b3c4d5e6f7g8h9i0j', status: 'active', created_at: '2023-10-15T14:30:00Z' },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState(initialProjects);
  const [newProjectName, setNewProjectName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    const newProject = {
      id: Math.random().toString(36).substring(7),
      name: newProjectName,
      api_key: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    
    setProjects([newProject, ...projects]);
    setNewProjectName('');
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const copyToClipboard = async (text: string, id: string, isSnippet = false) => {
    await navigator.clipboard.writeText(text);
    if (isSnippet) {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const sdkSnippet = `<script src="https://cdn.snaptrace.io/v1/sdk.js" data-api-key="YOUR_KEY"></script>`;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* --- Sidebar --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="font-semibold text-slate-50 tracking-tight">SnapTrace</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-50 hover:bg-slate-900/50 transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Overview
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-500/10 text-indigo-400 transition-colors">
            <FolderKanban className="w-4 h-4" /> Projects & Keys
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-50 hover:bg-slate-900/50 transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/50 border border-slate-800/50 rounded-lg">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-medium text-slate-300">Telemetry Online</span>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-slate-50"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-50 hidden sm:block">Projects & Keys</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-full">
              <span className="text-xs font-medium text-slate-300">dev@company.com</span>
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase tracking-wider font-bold rounded-full">
                Pro Plan
              </span>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-50 hover:bg-slate-900 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Column: Projects */}
            <div className="xl:col-span-2 space-y-8">
              
              {/* Create Project Card */}
              <section className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-base font-semibold text-slate-50 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Create New Project
                </h2>
                <form onSubmit={handleCreateProject} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., Production App, Staging Environment"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner shadow-black/20"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!newProjectName.trim()}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-sm shadow-indigo-900/20"
                  >
                    Create Project
                  </button>
                </form>
              </section>

              {/* Projects Grid */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-50 flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-400" />
                    Active Projects
                  </h2>
                  <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                    {projects.length} / 10 Limit
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <div 
                      key={project.id} 
                      className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-900/60 transition-all group flex flex-col h-full backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start mb-5">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-slate-50 font-medium truncate max-w-[150px]" title={project.name}>
                              {project.name}
                            </h3>
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider font-bold rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Created {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-slate-800/80">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                          Secret API Key
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 block bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-indigo-300 font-mono truncate shadow-inner shadow-black/20">
                            {project.api_key}
                          </code>
                          <button
                            onClick={() => copyToClipboard(project.api_key, project.id)}
                            className="shrink-0 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
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
              </section>
            </div>

            {/* Right Column: SDK Integration */}
            <div className="xl:col-span-1">
              <section className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 sticky top-0 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-base font-semibold text-slate-50">SDK Integration</h2>
                </div>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  Add the SnapTrace script to the <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-700">{'<head>'}</code> of your application. Replace <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-700">YOUR_KEY</code> with a project API key.
                </p>
                
                <div className="relative group">
                  <div className="absolute right-2 top-2">
                    <button
                      onClick={() => copyToClipboard(sdkSnippet, 'snippet', true)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors border border-slate-700"
                      title="Copy Snippet"
                    >
                      {copiedSnippet ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto text-xs text-slate-300 font-mono leading-relaxed shadow-inner shadow-black/20">
                    <code className="language-html">
                      <span className="text-indigo-400">{'<script'}</span>
                      <br />
                      &nbsp;&nbsp;<span className="text-emerald-400">src</span>=<span className="text-amber-200">"https://cdn.snaptrace.io/v1/sdk.js"</span>
                      <br />
                      &nbsp;&nbsp;<span className="text-emerald-400">data-api-key</span>=<span className="text-amber-200">"YOUR_KEY"</span><span className="text-indigo-400">{'>'}</span>
                      <br />
                      <span className="text-indigo-400">{'</script>'}</span>
                    </code>
                  </pre>
                </div>
                
                <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                  <h4 className="text-sm font-medium text-indigo-400 mb-1">Need help?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Check out our official documentation to learn about advanced configuration options and custom event tracking.
                  </p>
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}