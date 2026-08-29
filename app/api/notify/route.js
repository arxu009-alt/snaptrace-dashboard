import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { userId, title, message, level } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, or message' },
        { status: 400 }
      );
    }

    // Fetch active notification channels for this user
    const { data: channels, error } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!channels || channels.length === 0) {
      return NextResponse.json({ message: 'No active notification channels found for user' });
    }

    // Dispatch alerts across all user channels
    const dispatchResults = await Promise.allSettled(
      channels.map(async (channel) => {
        if (channel.type === 'discord') {
          const res = await fetch(channel.destination, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [
                {
                  title: `[${(level || 'INFO').toUpperCase()}] ${title}`,
                  description: message,
                  color: level === 'error' ? 15158332 : 3066993,
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          });
          if (!res.ok) throw new Error(`Discord send failed with status ${res.status}`);
          return { channelId: channel.id, type: 'discord', status: 'sent' };
        }

        if (channel.type === 'email') {
          const res = await resend.emails.send({
            from: 'SnapTrace Alerts <onboarding@resend.dev>',
            to: [channel.destination],
            subject: `[SnapTrace Alert] ${title}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #333;">${title}</h2>
                <p><strong>Level:</strong> ${(level || 'INFO').toUpperCase()}</p>
                <p style="background: #f9f9f9; padding: 12px; border-radius: 4px;">${message}</p>
              </div>
            `,
          });
          return { channelId: channel.id, type: 'email', status: 'sent', resendId: res.id };
        }
      })
    );

    return NextResponse.json({
      success: true,
      dispatchedCount: channels.length,
      results: dispatchResults,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}