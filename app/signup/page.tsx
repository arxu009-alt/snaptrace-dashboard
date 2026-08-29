'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Check your email for the confirmation link!');
    }
    setLoading(false);
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
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '24px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>SnapTrace Sign Up</h2>
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>

      <div style={{ margin: '16px 0', textAlign: 'center', color: '#666' }}>OR</div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#ffffff', color: '#000000', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Sign up with Google
      </button>

      {message && <p style={{ marginTop: '16px', color: message.startsWith('Error') ? '#ef4444' : '#10b981' }}>{message}</p>}
    </div>
  );
}