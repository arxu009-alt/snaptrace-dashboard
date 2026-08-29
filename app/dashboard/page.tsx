'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
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
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff', backgroundColor: '#000', fontFamily: 'sans-serif' }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>SnapTrace Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Log Out
        </button>
      </div>

      <div style={{ backgroundColor: '#111', padding: '24px', borderRadius: '8px', border: '1px solid #333' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>User Session Info</h2>
        <p style={{ color: '#aaa', margin: 0 }}>Logged in as: <strong style={{ color: '#fff' }}>{user?.email}</strong></p>
      </div>
    </div>
  );
}