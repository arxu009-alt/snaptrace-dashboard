/**
 * Dispatches real-time crash notifications to user webhooks
 * @param {string} webhookUrl - Target HTTP/Discord/Slack webhook URL
 * @param {object} errorDetails - Crash data object (error_msg, url, count, stack_trace)
 */
export async function dispatchWebhookAlert(webhookUrl, errorDetails) {
  if (!webhookUrl) return

  const payload = {
    username: 'SnapTrace Engine',
    avatar_url: 'https://snaptrace.dev/icon.png',
    embeds: [
      {
        title: `🚨 Unhandled Exception Captured`,
        description: `**Error:** \`${errorDetails.error_msg}\`\n**Route:** \`${errorDetails.url}\`\n**Occurrences:** \`${errorDetails.count || 1}\``,
        color: 15158332,
        fields: [
          {
            name: 'Stack Trace Snippet',
            value: `\`\`\`javascript\n${(errorDetails.stack_trace || 'No trace').slice(0, 500)}\n\`\`\``
          }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (err) {
    console.error('[Webhook Engine] Dispatch failed:', err)
  }
}