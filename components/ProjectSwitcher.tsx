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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUserProjects() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

        const savedId =
          typeof window !== 'undefined'
            ? localStorage.getItem('snaptrace_selected_project_id')
            : null;

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

    window.dispatchEvent(new Event('snaptrace_project_change'));
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider font-mono">
          Active Project
        </span>
        <div className="w-full h-8 bg-zinc-900/60 border border-zinc-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider font-mono">
          Active Project
        </span>
        <div className="w-full bg-zinc-900/40 border border-zinc-800/80 text-zinc-500 text-xs rounded-lg px-2.5 py-1.5 font-mono">
          No projects found
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label
          htmlFor="project-switcher-select"
          className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono"
        >
          Active Project
        </label>
        <span className="text-[10px] font-mono text-zinc-500">
          {selectedProjectId === 'all' ? `${projects.length} Scope` : 'Filtered'}
        </span>
      </div>
      <div className="relative w-full">
        <select
          id="project-switcher-select"
          value={selectedProjectId}
          onChange={handleChange}
          className="w-full appearance-none bg-zinc-900/80 border border-zinc-800 text-zinc-200 text-xs rounded-lg pl-2.5 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 font-mono transition-colors cursor-pointer"
        >
          <option value="all" className="bg-zinc-900 text-zinc-200">
            All Projects (Combined)
          </option>
          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
              className="bg-zinc-900 text-zinc-200"
            >
              {project.name || 'Untitled Project'}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
          <svg
            className="w-3.5 h-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}