import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, type, message, rating } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    // Dispatch to Discord if webhook is configured in environment variables
    if (webhookUrl) {
      const typeIcons: Record<string, string> = {
        feature: '💡 Feature Request',
        bug: '🐛 Bug Report',
        review: '⭐ General Review',
        other: '💬 User Feedback',
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: `📣 SnapTrace Beta Feedback: ${typeIcons[type] || 'User Feedback'}`,
              color: type === 'bug' ? 15158332 : 16434440, // Red for bugs, Yellow for features
              fields: [
                { name: 'Submitted By', value: email || 'Anonymous Developer', inline: true },
                { name: 'Category', value: type?.toUpperCase() || 'GENERAL', inline: true },
                { name: 'Feedback / Suggestion', value: message },
              ],
              footer: { text: 'SnapTrace Feedback Engine • v1.0 Beta' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      }).catch((e) => console.error('Discord feedback webhook error:', e));
    }

    return NextResponse.json({ success: true, message: 'Feedback recorded successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}