'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Copy,
  Check,
  Trash2,
  Plus,
  LogOut,
  Key,
  Loader2,
  Code2
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    fetchSessionAndProjects();
  }, []);

  const fetchSessionAndProjects = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    setUserEmail(session.user.email ?? null);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    const newApiKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: projectName,
          api_key: newApiKey,
          user_id: session.user.id
        }
      ])
      .select();

    if (!error && data) {
      setProjects([data[0], ...projects]);
      setProjectName('');
    }
    setCreating(false);
  };

  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyToClipboard = (text: string, type: 'key' | 'snippet') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(text);
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const activeKey = projects.length > 0 ? projects[0].api_key : 'YOUR_KEY';
  const sdkSnippet = `<script\n  src="https://snaptrace-dashboard.vercel.app/sdk.js"\n  data-api-key="${activeKey}">\n</script>`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 w-full">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">API Keys & Projects</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your SnapTrace environments and integration keys.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            {userEmail || 'Loading user...'}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Project Creation & List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Create Project Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject} className="flex gap-3">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Production App, Staging Environment"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
              </button>
            </form>
          </div>

          {/* Active Projects List */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              Active Projects
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-xl">
                <Key className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">No projects found</p>
                <p className="text-sm text-slate-500 mt-1">Create your first project above to generate an API key.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-white">{project.name}</h3>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-slate-300 truncate">{project.api_key}</code>
                      <button
                        onClick={() => copyToClipboard(project.api_key, 'key')}
                        className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
                        title="Copy API Key"
                      >
                        {copiedKey === project.api_key ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: SDK Integration Guide */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              SDK Integration
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Add the SnapTrace script to the <code className="text-indigo-300 font-mono text-xs">&lt;head&gt;</code> of your application. Replace <code className="text-indigo-300 font-mono text-xs">YOUR_KEY</code> with a project API key.
            </p>

            <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              <button
                onClick={() => copyToClipboard(sdkSnippet, 'snippet')}
                className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 p-1.5 rounded-md transition-colors"
                title="Copy Integration Code"
              >
                {copiedSnippet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre className="pr-8">{sdkSnippet}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}