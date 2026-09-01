'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace('/dashboard');
      } else {
        setCheckingAuth(false);
      }
    }

    checkSession();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome to SnapTrace
        </h1>
        <p className="text-sm text-slate-400">
          Application performance and crash monitoring platform.
        </p>

        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium py-2 px-6 rounded-lg transition-colors text-sm"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium py-2 px-6 rounded-lg transition-colors text-sm"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}