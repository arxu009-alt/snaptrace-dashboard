import { parseStackTrace } from '@/lib/stackParser';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function generateFingerprint(message: string, stack: string): string {
  const primaryFrame = stack ? stack.split('\n')[1] || '' : '';
  const rawString = `${message.trim()}:${primaryFrame.trim()}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

async function sendDiscordAlert(webhookUrl: string, message: string, environment: string, url: string | null) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: '🚨 Critical Exception Ingested',
            description: `\`\`\`${message}\`\`\``,
            color: 15158332,
            fields: [
              { name: 'Environment', value: environment, inline: true },
              { name: 'Runtime Host', value: url || 'N/A', inline: true },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'SnapTrace Telemetry' },
          },
        ],
      }),
    });
  } catch (err) {
    console.error('Failed to dispatch Discord alert:', err);
  }
}

async function sendEmailAlert(targetEmail: string, message: string, environment: string, url: string | null) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log(`[Email Alert Skipped]: RESEND_API_KEY missing in environment variables. Target: ${targetEmail}`);
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SnapTrace Alerts <alerts@resend.dev>',
        to: [targetEmail],
        subject: `[SnapTrace Alert] Exception in ${environment}`,
        html: `
          <div style="font-family: monospace; background: #090d16; color: #f3f4f6; padding: 24px; border-radius: 8px;">
            <h2 style="color: #ef4444; margin-top: 0;">🚨 New Critical Error</h2>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Environment:</strong> ${environment}</p>
            <p><strong>URL / Host:</strong> ${url || 'N/A'}</p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">SnapTrace Automated Telemetry Alert</p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error('Failed to dispatch Email alert:', err);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server environment variables missing.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body format.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { api_key, message, stack, url, user_agent, environment } = body;

    if (!api_key || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: api_key and message.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch project metadata along with notification settings
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, discord_webhook_url, alert_email')
      .eq('api_key', api_key)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Invalid or missing API Key.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const fingerprint = generateFingerprint(message, stack || '');

    const { data: existingError } = await supabase
      .from('errors')
      .select('id, event_count')
      .eq('project_id', project.id)
      .eq('fingerprint', fingerprint)
      .single();

    if (existingError) {
      const { error: updateError } = await supabase
        .from('errors')
        .update({
          event_count: existingError.event_count + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', existingError.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500, headers: corsHeaders }
        );
      }
    } else {
      const parsedStackFrames = parseStackTrace(stack || '');

      const { error: insertError } = await supabase.from('errors').insert([
        {
          project_id: project.id,
          message,
          stack: stack || null,
          parsed_stack: parsedStackFrames,
          url: url || null,
          user_agent: user_agent || null,
          environment: environment || 'production',
          fingerprint,
          event_count: 1,
          last_seen_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500, headers: corsHeaders }
        );
      }

      // Dispatch alert notifications for new unique exceptions
      if (project.discord_webhook_url) {
        await sendDiscordAlert(
          project.discord_webhook_url,
          message,
          environment || 'production',
          url || null
        );
      }

      if (project.alert_email) {
        await sendEmailAlert(
          project.alert_email,
          message,
          environment || 'production',
          url || null
        );
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500, headers: corsHeaders }
    );
  }
}