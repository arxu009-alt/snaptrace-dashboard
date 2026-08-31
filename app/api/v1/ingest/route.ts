import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables are missing.' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { api_key, message, stack, environment, url } = body;

    if (!api_key || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: api_key and message are required.' },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('api_key', api_key)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Invalid or unauthorized API key.' },
        { status: 401 }
      );
    }

    const { error: insertError } = await supabase.from('errors').insert({
      project_id: project.id,
      message,
      stack: stack || null,
      environment: environment || 'production',
      url: url || null,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Event logged successfully' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}