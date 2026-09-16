'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verifyingSession, setVerifyingSession] = useState(true);

  // Verify that the user has an active recovery session from their email link
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there's an active session from the recovery token, let them reset
      if (session) {
        setVerifyingSession(false);
      } else {
        // Listen for auth state change if the hash token is still parsing
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (event === 'PASSWORD_RECOVERY' || currentSession) {
            setVerifyingSession(false);
          }
        });

        // Small grace period for hash token parsing
        setTimeout(() => {
          setVerifyingSession(false);
        }, 1500);

        return () => subscription.unsubscribe();
      }
    }

    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('✓ Password updated successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Your recovery link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans flex flex-col justify-between selection:bg-yellow-400 selection:text-slate-950 p-6 sm:p-10 relative">
      
      {/* Background Ambient Glow */}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-yellow-500/10 via-purple-500/10 to-emerald-500/10 blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pb-8 relative z-10">
        <Link href="/" className="transition hover:opacity-90">
          <SnapTraceLogo size="md" showText={true} />
        </Link>
        <Link href="/login" className="text-xs text-yellow-400 hover:underline font-mono">
          ← Back to Sign In
        </Link>
      </div>

      {/* Card */}
      <div className="max-w-md mx-auto w-full bg-[#090D16]/95 border-2 border-yellow-400/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 text-[10px] font-mono font-bold uppercase mb-2">
            <span>🔐</span> Security Verification
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Create New Password
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your new secure password below to regain full access to your projects and telemetry stream.
          </p>
        </div>

        {verifyingSession ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400 space-y-2">
            <div className="h-6 w-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Verifying recovery credentials...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded-2xl text-xs font-mono animate-in zoom-in-95">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-mono leading-relaxed animate-in zoom-in-95">
                {success}
              </div>
            )}

            {!success && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1 font-mono">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>

                <div className="space-y-1 font-mono">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer font-mono"
                >
                  {loading ? 'Updating Password...' : 'Save New Password & Launch →'}
                </button>
              </form>
            )}
          </>
        )}

      </div>

      {/* Footer */}
      <footer className="pt-8 text-center text-xs text-slate-500 relative z-10 font-mono">
        © {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform.
      </footer>

    </div>
  );
}