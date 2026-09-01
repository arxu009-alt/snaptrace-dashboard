"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const generateApiKey = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `sk_live_${randomHex}`;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCreating(false);
      return;
    }

    const apiKey = generateApiKey();

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: newProjectName.trim(),
          api_key: apiKey,
          user_id: user.id,
        },
      ])
      .select();

    if (!error && data) {
      setProjects([data[0], ...projects]);
      setNewProjectName("");
      setIsModalOpen(false);
    }
    setCreating(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? All associated logs will be removed.")) return;

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project API Keys</h1>
          <p className="text-gray-400 text-sm">
            Manage integration credentials and project identifiers for SnapTrace.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          + Create New Project
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          No projects found. Click "+ Create New Project" to generate your first API key.
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#111827] border border-gray-800 rounded-xl p-6 relative shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                  <p className="text-xs text-gray-500">ID: {project.id}</p>
                </div>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-950/40 border border-red-900/50 rounded"
                >
                  Delete Project
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  API KEY
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={project.api_key}
                    className="w-full bg-[#0a0f1d] border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-300 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(project.api_key, project.id)}
                    className="bg-[#1f293d] hover:bg-[#2c3b57] text-gray-200 text-xs px-3 py-2 rounded-md font-medium min-w-[65px]"
                  >
                    {copiedId === project.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  QUICK INTEGRATION SNIPPET
                </label>
                <pre className="bg-[#0a0f1d] border border-gray-800 rounded-md p-3 text-xs text-purple-300 font-mono overflow-x-auto">
{`import { initSnapTrace } from '@snaptrace/js';

initSnapTrace({
  apiKey: '${project.api_key}'
});`}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating New Project */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-2">Create New Project</h3>
            <p className="text-gray-400 text-xs mb-4">
              Enter a project name to generate a dedicated API key.
            </p>
            <form onSubmit={handleCreateProject}>
              <input
                type="text"
                required
                placeholder="e.g. My Next.js Web App"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-gray-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white text-xs px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs px-4 py-2 rounded-md transition-colors"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}