'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Project {
  id: string;
  name: string;
  api_key: string;
}

export default function ProjectSwitcher() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProjects() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, api_key')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setProjects(data);

        // Check if there's a previously selected project, otherwise default to 'all'
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;
        if (savedId && (savedId === 'all' || data.some((p) => p.id === savedId))) {
          setSelectedProjectId(savedId);
        } else {
          setSelectedProjectId('all');
          localStorage.setItem('snaptrace_selected_project_id', 'all');
        }
      }
      setLoading(false);
    }

    fetchUserProjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    setSelectedProjectId(projectId);
    localStorage.setItem('snaptrace_selected_project_id', projectId);

    // Broadcast the change across all dashboard pages
    window.dispatchEvent(new Event('snaptrace_project_change'));
  };

  if (loading) {
    return <div className="text-xs text-slate-500 font-mono">Loading projects...</div>;
  }

  if (projects.length === 0) {
    return <span className="text-xs text-slate-500 font-mono">No Projects Yet</span>;
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Project</span>
      <select
        value={selectedProjectId}
        onChange={handleChange}
        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
      >
        <option value="all">⚡ All Projects (Combined)</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            📁 {project.name || 'Untitled Project'}
          </option>
        ))}
      </select>
    </div>
  );
}