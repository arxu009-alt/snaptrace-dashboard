import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration missing.' },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { api_key, message, stack, url, user_agent, environment } = body;

    if (!api_key || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: api_key and message.' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // Verify valid project API Key
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('api_key', api_key)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Invalid API Key.' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    // Insert error log linked to the project
    const { error: insertError } = await supabase.from('errors').insert([
      {
        project_id: project.id,
        message,
        stack: stack || null,
        url: url || null,
        user_agent: user_agent || null,
        environment: environment || 'production',
      },
    ]);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: getCorsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}