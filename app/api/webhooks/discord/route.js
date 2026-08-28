import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Missing DISCORD_WEBHOOK_URL' }, { status: 500 });
    }

    const body = await request.json();
    const { event, message, project_id, timestamp, stack } = body;

    const payload = {
      embeds: [
        {
          title: `🚨 SnapTrace Admin Alert: ${event || 'System Error'}`,
          color: 15158332,
          fields: [
            { name: 'Project ID', value: project_id || 'System', inline: true },
            { name: 'Timestamp', value: timestamp || new Date().toISOString(), inline: true },
            { name: 'Message', value: message || 'No message provided' },
            { name: 'Stack Trace', value: stack ? `\`\`\`javascript\n${stack.slice(0, 1000)}\n\`\`\`` : 'N/A' },
          ],
          footer: { text: 'SnapTrace System Monitor' },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord request failed with status ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}