import { createClient } from '@supabase/supabase-js';

// Fallback to non-empty strings during build-time module evaluation
// to prevent Next.js prerender workers from throwing fatal initialization errors.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);