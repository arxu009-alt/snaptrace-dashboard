import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { api_key, message, stack, url, environment } = body;

    if (!api_key || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch project settings
    const { data: project } = await supabase
      .from('projects')
      .select('id, discord_webhook, alert_email')
      .eq('api_key', api_key)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // 2. Insert error record
    const { data: errorRecord, error: dbError } = await supabase
      .from('errors')
      .insert({
        project_id: project.id,
        message,
        stack,
        url,
        environment: environment || 'production',
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 3. Discord Dispatch
    if (project.discord_webhook) {
      fetch(project.discord_webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: `🚨 ${message}`,
              description: `\`\`\`${stack || 'No stack trace'}\`\`\``,
              color: 15158332,
              fields: [
                { name: 'Environment', value: environment || 'production', inline: true },
                { name: 'URL', value: url || 'N/A', inline: true },
              ],
            },
          ],
        }),
      }).catch((err) => console.error('Discord Webhook Error:', err));
    }

    // 4. Resend Dispatch
    let emailStatus = null;
    const targetEmail = project.alert_email || process.env.OWNER_EMAIL;

    if (targetEmail && process.env.RESEND_API_KEY) {
      const emailRes = await resend.emails.send({
        from: 'SnapTrace Alerts <onboarding@resend.dev>',
        to: [targetEmail],
        subject: `[SnapTrace Error] ${message}`,
        html: `
          <div style="font-family: monospace; padding: 20px; background: #0f172a; color: #f8fafc;">
            <h2 style="color: #ef4444;">🚨 New Exception Event</h2>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Environment:</strong> ${environment || 'production'}</p>
            <p><strong>URL:</strong> ${url || 'N/A'}</p>
            <hr style="border-color: #334155;"/>
            <pre style="background: #1e293b; padding: 12px; border-radius: 4px;">${stack || 'No stack trace provided'}</pre>
          </div>
        `,
      });

      if (emailRes.error) {
        emailStatus = { success: false, error: emailRes.error };
      } else {
        emailStatus = { success: true, id: emailRes.data?.id };
      }
    }

    return NextResponse.json({ 
      success: true, 
      id: errorRecord.id, 
      email_status: emailStatus 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}