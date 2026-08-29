'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'api_keys' | 'stream' | 'webhooks' | 'settings'>('api_keys');

  const router = useRouter();

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else if (data) {
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    }
  }, [selectedProject]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        await fetchProjects();
      }
      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setCreating(true);
    setError(null);

    const { data, error } = await supabase
      .from('projects')
      .insert([{ name: projectName.trim(), user_id: user?.id }])
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else if (data) {
      const updated = [data, ...projects];
      setProjects(updated);
      setSelectedProject(data);
      setProjectName('');
    }
    setCreating(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      if (selectedProject?.id === id) {
        setSelectedProject(updated[0] || null);
      }
    }
  };

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#070a12', color: '#3b82f6', fontFamily: 'sans-serif' }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070a12', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      {/* Left Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#0b0f19', borderRight: '1px solid #1e293b', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
            ST
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#fff' }}>SnapTrace</h1>
            <span style={{ fontSize: '11px', backgroundColor: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>v1.0 Pro</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('api_keys')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', border: 'none',
              backgroundColor: activeTab === 'api_keys' ? '#1e293b' : 'transparent',
              color: activeTab === 'api_keys' ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500'
            }}
          >
            🔑 API Keys & Projects
          </button>
          <button
            onClick={() => setActiveTab('stream')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', border: 'none',
              backgroundColor: activeTab === 'stream' ? '#1e293b' : 'transparent',
              color: activeTab === 'stream' ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500'
            }}
          >
            ⚡ Error Stream
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', border: 'none',
              backgroundColor: activeTab === 'webhooks' ? '#1e293b' : 'transparent',
              color: activeTab === 'webhooks' ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500'
            }}
          >
            🔔 Webhooks
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', border: 'none',
              backgroundColor: activeTab === 'settings' ? '#1e293b' : 'transparent',
              color: activeTab === 'settings' ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500'
            }}
          >
            ⚙️ Project Settings
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header style={{ height: '64px', borderBottom: '1px solid #1e293b', backgroundColor: '#0b0f19', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#fff' }}>
            {activeTab === 'api_keys' && 'API Keys & Projects'}
            {activeTab === 'stream' && 'Live Error Stream'}
            {activeTab === 'webhooks' && 'Webhook Integrations'}
            {activeTab === 'settings' && 'Account Settings'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Logged in as: <strong style={{ color: '#f1f5f9' }}>{user?.email}</strong></span>
            <button
              onClick={handleLogout}
              style={{ padding: '6px 14px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Dynamic Body */}
        <main style={{ flex: 1, padding: '32px', maxWidth: '1000px' }}>
          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#450a0a', border: '1px solid #991b1b', color: '#fca5a5', borderRadius: '6px', marginBottom: '24px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {activeTab === 'api_keys' && (
            <>
              {/* Create Project Section */}
              <section style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 6px 0', color: '#fff' }}>Create New Project</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>Register an application to generate its public telemetry API key (<code>sk_live_...</code>).</p>
                
                <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '12px', maxWidth: '540px' }}>
                  <input
                    type="text"
                    placeholder="e.g. My Next.js Web App"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#070a12', color: '#fff', fontSize: '14px' }}
                  />
                  <button
                    type="submit"
                    disabled={creating}
                    style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: creating ? 'not-allowed' : 'pointer', fontSize: '14px' }}
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </form>
              </section>

              {/* Projects List */}
              <section style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#fff' }}>Registered Projects ({projects.length})</h3>

                {projects.length === 0 ? (
                  <div style={{ backgroundColor: '#0b0f19', border: '1px dashed #334155', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No projects found. Create your first project above to issue an API key.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {projects.map((proj) => {
                      const isSelected = selectedProject?.id === proj.id;
                      return (
                        <div
                          key={proj.id}
                          onClick={() => setSelectedProject(proj)}
                          style={{
                            backgroundColor: isSelected ? '#1e293b' : '#0b0f19',
                            border: isSelected ? '1px solid #3b82f6' : '1px solid #1e293b',
                            borderRadius: '8px',
                            padding: '18px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>{proj.name}</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(proj.id);
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Delete
                            </button>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>API Ingestion Key</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#070a12', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                              <code style={{ fontSize: '12px', color: '#10b981', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.api_key}</code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(proj.api_key, proj.id);
                                }}
                                style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                {copiedKey === proj.id ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Created {new Date(proj.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Integration Snippet Box */}
              {selectedProject && (
                <section style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', margin: 0, color: '#fff' }}>SDK Integration — {selectedProject.name}</h3>
                    <button
                      onClick={() =>
                        handleCopy(
                          `<script src="https://snaptrace-dashboard.vercel.app/sdk.js" data-api-key="${selectedProject.api_key}"></script>`,
                          'snippet'
                        )
                      }
                      style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {copiedKey === 'snippet' ? 'Snippet Copied!' : 'Copy Integration Code'}
                    </button>
                  </div>

                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                    Insert this tag into the <code>&lt;head&gt;</code> of your frontend project to collect real-time crash reports:
                  </p>

                  <pre style={{ backgroundColor: '#070a12', padding: '16px', borderRadius: '6px', border: '1px solid #1e293b', overflowX: 'auto', margin: 0 }}>
                    <code style={{ fontSize: '13px', color: '#38bdf8', fontFamily: 'monospace' }}>
                      {`<script \n  src="https://snaptrace-dashboard.vercel.app/sdk.js" \n  data-api-key="${selectedProject.api_key}"\n></script>`}
                    </code>
                  </pre>
                </section>
              )}
            </>
          )}

          {activeTab !== 'api_keys' && (
            <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '48px', textAlign: 'center', color: '#64748b' }}>
              Select <strong>🔑 API Keys & Projects</strong> to view and manage your ingestion keys.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}