'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProjectSwitcher() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase.from('projects').select('*');
      if (data) setProjects(data);
    }
    fetchProjects();
  }, []);

  return (
    <div className="relative">
      <select className="bg-[#121524] border border-gray-800 text-white text-xs rounded-lg p-2 focus:outline-none">
        {projects.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.name || 'Default Project'}
          </option>
        ))}
      </select>
    </div>
  );
}