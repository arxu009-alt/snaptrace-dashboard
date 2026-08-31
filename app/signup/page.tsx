'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('A verification link has been sent to your email address. Please check your inbox to complete registration.');
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create a SnapTrace Account</h1>
          <p className="text-sm text-gray-400 mt-1">Start tracking exceptions across your applications</p>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex flex-col gap-1">
            <span className="font-semibold text-emerald-300">Verification Sent!</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-4 bg-red-950/60 border border-red-500/30 text-red-400 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Sending link...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-red-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}