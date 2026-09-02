'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Project {
  id: string;
  name: string;
  api_key: string;
}

interface ProjectSwitcherProps {
  onProjectChange?: (project: Project) => void;
}

export default function ProjectSwitcher({ onProjectChange }: ProjectSwitcherProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
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
        // Default to the first project
        setSelectedProjectId(data[0].id);
        if (onProjectChange) {
          onProjectChange(data[0]);
        }
      }
      setLoading(false);
    }

    fetchUserProjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    setSelectedProjectId(projectId);
    const selected = projects.find((p) => p.id === projectId);
    if (selected && onProjectChange) {
      onProjectChange(selected);
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500 font-mono">Loading projects...</div>;
  }

  if (projects.length === 0) {
    return (
      <span className="text-xs text-slate-500 font-mono">
        No Projects Yet
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-medium hidden sm:inline">Project:</span>
      <select
        value={selectedProjectId}
        onChange={handleChange}
        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name || 'Untitled Project'}
          </option>
        ))}
      </select>
    </div>
  );
}