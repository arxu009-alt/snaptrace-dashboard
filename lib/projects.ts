import { supabase } from '@/lib/supabaseClient';

export function generateProjectApiKey(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `sk_live_${randomHex}`;
  }
  // Fallback
  return `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

export async function ensureDefaultProject(userId: string) {
  if (!userId) return null;

  try {
    const { data: existing, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && existing && existing.length > 0) {
      return existing[0];
    }

    // Auto-initialize Default Project with sk_live_ key
    const autoKey = generateProjectApiKey();
    const { data: newProj, error: insertError } = await supabase
      .from('projects')
      .insert([
        {
          name: 'Default Project',
          api_key: autoKey,
          user_id: userId,
          plan_tier: 'free',
        },
      ])
      .select('*')
      .single();

    if (insertError) {
      console.error('Failed to auto-initialize default project:', insertError);
      return null;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snaptrace_project_change'));
    }

    return newProj;
  } catch (err) {
    console.error('Error in ensureDefaultProject:', err);
    return null;
  }
}
