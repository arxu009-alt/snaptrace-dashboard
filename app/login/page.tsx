'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  // Password Reset Dispatcher via Supabase Auth
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setForgotSuccess(
        `A password reset link has been dispatched to ${forgotEmail}. Please check your inbox and spam folder.`
      );
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send password reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotModalWithCurrentEmail = () => {
    if (email.trim()) {
      setForgotEmail(email.trim());
    }
    setForgotSuccess(null);
    setForgotError(null);
    setShowForgotModal(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col justify-between selection:bg-zinc-800 selection:text-zinc-100 relative overflow-hidden">
      
      {/* Subtle Grid Pattern Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true" 
      />

      {/* Subtle Radial Glow */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-zinc-800/20 blur-[130px] rounded-full" 
        aria-hidden="true" 
      />

      {/* Main Split Grid */}
      <div className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 items-center p-6 sm:p-12 gap-12 sm:gap-16 relative z-10">
        
        {/* Left Column: Sentry/Vercel Developer Showcase */}
        <div className="lg:col-span-7 space-y-8 py-4">
          <Link href="/" className="inline-block transition hover:opacity-90">
            <SnapTraceLogo size="lg" showText={true} />
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Crash Telemetry</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-semibold tracking-tight text-zinc-100 leading-[1.15]">
              Developer observability built for speed.
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
              Real-time exception ingestion, sub-millisecond alerting, and automated stack trace diagnostics across your entire modern web architecture.
            </p>
          </div>

          {/* Metric cards / Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl pt-2">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1.5">
              <div className="text-[11px] font-mono text-zinc-300 font-medium">SUB-MILLI INGESTION</div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Async edge workers capture exceptions without impacting application latency or CPU cycles.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1.5">
              <div className="text-[11px] font-mono text-zinc-300 font-medium">BYOK COPILOT</div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Plug your own OpenAI or Gemini API key to pinpoint root causes directly on the stack trace.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-zinc-100">Sign In to Dashboard</h2>
              <p className="text-xs text-zinc-400">Enter your credentials to manage your telemetry and crash streams</p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-300 rounded-lg text-xs font-mono">
                {error}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-2.5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-lg font-medium text-xs text-zinc-200 transition-colors cursor-pointer shadow-sm group font-mono"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-zinc-800 flex-1" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                or email
              </span>
              <div className="h-px bg-zinc-800 flex-1" />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono block">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono block">
                    Password
                  </label>
                  
                  {/* Forgot Password Trigger */}
                  <button
                    type="button"
                    onClick={openForgotModalWithCurrentEmail}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 hover:underline font-mono transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer font-mono shadow-sm"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-zinc-400 pt-3 border-t border-zinc-800/80 font-sans">
              Don't have an account?{' '}
              <Link href="/signup" className="text-zinc-200 hover:underline font-medium">
                Create Account
              </Link>
            </p>

          </div>
        </div>

      </div>

      {/* Password Reset Request Modal */}
      {showForgotModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForgotModal(false);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans"
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer font-mono"
            >
              ✕
            </button>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-mono uppercase tracking-wider">
                Account Recovery
              </div>
              <h3 className="text-base font-semibold text-zinc-100">
                Reset your password
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter your account email. We will send you a secure verification link to reset your password with zero loss of project telemetry data.
              </p>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-300 rounded-lg text-xs font-mono">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-mono space-y-3 leading-relaxed animate-in zoom-in-95">
                <p>{forgotSuccess}</p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-medium transition font-mono cursor-pointer border border-zinc-700"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="developer@company.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1 font-mono">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? 'Sending Link...' : 'Send Recovery Link'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-850 border-zinc-800/60 p-6 text-xs text-zinc-500 relative z-10 max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <span>© {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform.</span>
        <div className="flex items-center space-x-6 text-zinc-400 font-mono text-[11px]">
          <Link href="/privacy" className="hover:text-zinc-200 transition">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-200 transition">
            Terms of Service
          </Link>
        </div>
      </footer>

    </div>
  );
}