'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Project {
  id: string;
  name: string;
  api_key: string;
}

export default function ProjectSwitcher({
  onProjectChange,
}: {
  onProjectChange?: (project: Project) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase.from('projects').select('id, name, api_key');
      if (data && data.length > 0) {
        setProjects(data);
        const stored = localStorage.getItem('snaptrace_active_project');
        const defaultProject = data.find((p) => p.id === stored) || data[0];
        setSelectedProjectId(defaultProject.id);
        if (onProjectChange) onProjectChange(defaultProject);
      }
    }
    fetchProjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    localStorage.setItem('snaptrace_active_project', projId);
    const proj = projects.find((p) => p.id === projId);
    if (proj && onProjectChange) onProjectChange(proj);
  };

  return (
    <div className="flex items-center gap-2 bg-[#121629] border border-gray-800 rounded-lg px-3 py-1.5 text-sm">
      <span className="text-gray-400 font-medium">Project:</span>
      <select
        value={selectedProjectId}
        onChange={handleChange}
        className="bg-transparent text-purple-400 font-semibold focus:outline-none cursor-pointer"
      >
        {projects.map((proj) => (
          <option key={proj.id} value={proj.id} className="bg-[#0f111a] text-white">
            {proj.name}
          </option>
        ))}
      </select>
    </div>
  );
}