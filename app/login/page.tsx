'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if user was already logged in by clicking the email verification link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };

    checkSession();

    // Listen for auth state changes from URL confirmation tokens
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else if (data.session) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setMessage(`Unexpected error: ${err.message || 'Failed to sign in'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setMessage(`Google Auth Error: ${error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '24px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#111', color: '#fff', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>SnapTrace Log In</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}
        />
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>

      <div style={{ margin: '16px 0', textAlign: 'center', color: '#666' }}>OR</div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#ffffff', color: '#000000', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Sign in with Google
      </button>

      {message && (
        <p style={{ marginTop: '16px', color: message.startsWith('Error') ? '#ef4444' : '#10b981', fontSize: '14px' }}>
          {message}
        </p>
      )}
    </div>
  );
}