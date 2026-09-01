import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic evaluation to prevent static build crashes on Vercel
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables are missing.' },
      { status: 500 }
    );
  }

  // Lazy initialize Supabase client inside handler
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  try {
    const contentType = req.headers.get('content-type') || '';
    let apiKey = '';
    let serviceName = '';
    let version = '';
    let sourcemapContent = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      apiKey = formData.get('api_key') || '';
      serviceName = formData.get('service_name') || formData.get('name') || '';
      version = formData.get('version') || '1.0.0';
      sourcemapContent = formData.get('file') || formData.get('sourcemap');
    } else {
      const body = await req.json();
      apiKey = body.api_key || '';
      serviceName = body.service_name || body.name || '';
      version = body.version || '1.0.0';
      sourcemapContent = body.sourcemap || body.content;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: api_key' },
        { status: 400 }
      );
    }

    // Verify project authorization
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('api_key', apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Invalid or unauthorized API key.' },
        { status: 401 }
      );
    }

    // Attempt to store sourcemap record
    const { data: sourcemap, error: insertError } = await supabaseAdmin
      .from('sourcemaps')
      .insert({
        project_id: project.id,
        name: serviceName || 'default',
        version,
        content: typeof sourcemapContent === 'string' ? sourcemapContent : JSON.stringify(sourcemapContent || {}),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: true, message: 'Sourcemap payload processed successfully.' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Sourcemap uploaded successfully', id: sourcemap?.id },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}