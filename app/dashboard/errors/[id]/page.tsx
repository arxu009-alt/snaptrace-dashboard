import { createClient } from '@supabase/supabase-js';
import StackTraceViewer from '@/components/StackTraceViewer';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getErrorDetails(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('errors')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function ErrorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const errorData = await getErrorDetails(id);

  if (!errorData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/errors"
          className="inline-flex items-center text-xs text-gray-400 hover:text-gray-200 mb-6 font-mono"
        >
          ← Back to Issues Overview
        </Link>

        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-red-950/80 text-red-400 border border-red-900/50">
              {errorData.environment}
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-gray-800 text-gray-300">
              {errorData.event_count} {errorData.event_count === 1 ? 'Event' : 'Events'}
            </span>
          </div>
          <h1 className="text-xl font-mono font-bold text-red-400 break-words mb-4">
            {errorData.message}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-4 border-t border-gray-800 text-gray-400">
            <div>
              <span className="block text-gray-500 text-[10px] uppercase">Fingerprint</span>
              <span className="truncate block font-semibold text-gray-300" title={errorData.fingerprint}>
                {errorData.fingerprint?.slice(0, 12)}...
              </span>
            </div>
            <div>
              <span className="block text-gray-500 text-[10px] uppercase">Runtime Host</span>
              <span className="truncate block text-gray-300">{errorData.url || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-[10px] uppercase">First Seen</span>
              <span className="text-gray-300">{new Date(errorData.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="block text-gray-500 text-[10px] uppercase">Last Seen</span>
              <span className="text-gray-300">{new Date(errorData.last_seen_at).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 font-mono">Parsed Stack Execution</h2>
          <StackTraceViewer
            frames={errorData.parsed_stack || []}
            rawStack={errorData.stack}
          />
        </div>
      </div>
    </div>
  );
}