import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const gmailUser = process.env.GMAIL_USER || process.env.OWNER_EMAIL;
const gmailPass = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
});

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

    // 2. Insert error record into database (always stored for logs)
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

    // 3. De-duplication Check: look for identical error logged in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentDuplicates } = await supabase
      .from('errors')
      .select('id')
      .eq('project_id', project.id)
      .eq('message', message)
      .gte('created_at', fiveMinutesAgo);

    // Only dispatch alerts if this is the first occurrence in 5 minutes
    const shouldDispatchAlert = !recentDuplicates || recentDuplicates.length <= 1;

    let emailStatus: { success: boolean; messageId?: string; error?: string; skipped?: boolean; reason?: string } | null = null;

    if (shouldDispatchAlert) {
      // Dispatch alert to Discord Webhook
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

      // Dispatch alert via Gmail SMTP (Nodemailer)
      const targetEmail = project.alert_email || process.env.OWNER_EMAIL;

      if (targetEmail && gmailUser && gmailPass) {
        try {
          const info = await transporter.sendMail({
            from: `"SnapTrace System Alerts" <${gmailUser}>`,
            replyTo: `"SnapTrace Support" <${gmailUser}>`,
            to: targetEmail,
            subject: `[SnapTrace Error] ${message}`,
            html: `
              <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444; margin-top: 0; font-size: 20px;">🚨 New Exception Event</h2>
                <p style="margin: 8px 0;"><strong>Message:</strong> ${message}</p>
                <p style="margin: 8px 0;"><strong>Environment:</strong> ${environment || 'production'}</p>
                <p style="margin: 8px 0;"><strong>URL:</strong> ${url || 'N/A'}</p>
                <hr style="border: 0; border-top: 1px solid #334155; margin: 16px 0;"/>
                <pre style="background: #1e293b; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 13px; color: #cbd5e1; border: 1px solid #334155;">${stack || 'No stack trace provided'}</pre>
              </div>
            `,
          });
          emailStatus = { success: true, messageId: info.messageId };
        } catch (mailErr: any) {
          console.error('Gmail Dispatch Error:', mailErr);
          emailStatus = { success: false, error: mailErr.message };
        }
      }
    } else {
      emailStatus = {
        success: true,
        skipped: true,
        reason: 'Alert suppressed: identical error reported within 5 minutes',
      };
    }

    return NextResponse.json({
      success: true,
      id: errorRecord.id,
      alert_dispatched: shouldDispatchAlert,
      email_status: emailStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}