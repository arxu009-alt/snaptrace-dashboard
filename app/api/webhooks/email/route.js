import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const ownerEmail = process.env.OWNER_EMAIL;

    if (!apiKey || !ownerEmail) {
      return NextResponse.json({ error: 'Missing RESEND_API_KEY or OWNER_EMAIL' }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const body = await request.json();
    const { event, message, project_id, timestamp, stack } = body;

    const { data, error } = await resend.emails.send({
      from: 'SnapTrace System <onboarding@resend.dev>',
      to: [ownerEmail],
      subject: `🚨 [SnapTrace System Alert] ${event || 'System Error'}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #d97706;">SnapTrace Admin Alert</h2>
          <p><strong>Event:</strong> ${event || 'Unhandled Exception'}</p>
          <p><strong>Project ID:</strong> ${project_id || 'System'}</p>
          <p><strong>Timestamp:</strong> ${timestamp || new Date().toISOString()}</p>
          <p><strong>Message:</strong> ${message || 'No message provided'}</p>
          <hr />
          <h3>Stack Trace:</h3>
          <pre style="background: #1e1e1e; color: #f8f8f2; padding: 12px; border-radius: 4px; overflow-x: auto;">${stack || 'N/A'}</pre>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}