import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req) {
  const debugLogs = [];

  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { apiKey, message, stackTrace, environment, url, userAgent } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 400 }
      );
    }

    // 1. Fetch project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("api_key", apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Invalid API key or project not found" },
        { status: 401 }
      );
    }

    // Resolve Discord Webhook URL across schema variants
    const discordWebhookUrl =
      project.discord_webhook_url ||
      project.discord_webhook ||
      project.webhook_url ||
      project.discord_url;

    // Resolve Slack Webhook URL
    const slackWebhookUrl =
      project.slack_webhook_url ||
      project.slack_webhook ||
      project.slack_url;

    // Resolve Recipient Email across schema variants
    const recipientEmail =
      project.recipient_email ||
      project.alert_email ||
      project.alert_email_address ||
      project.email ||
      project.owner_email;

    // Resolve SMTP Sender Credentials
    const smtpUser =
      process.env.OWNER_EMAIL ||
      process.env.GMAIL_USER ||
      process.env.SMTP_USER;

    const smtpPass =
      process.env.GMAIL_APP_PASSWORD ||
      process.env.SMTP_PASS;

    // 2. Dispatch Discord Webhook Alert
    let discordSent = false;
    if (discordWebhookUrl) {
      try {
        const discordRes = await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: `🚨 ${message || "New Exception Event"}`,
                description: stackTrace
                  ? `\`\`\`\n${stackTrace.slice(0, 1000)}\n\`\`\``
                  : "No stack trace provided",
                color: 15158332,
                fields: [
                  {
                    name: "Environment",
                    value: environment || "production",
                    inline: true,
                  },
                  {
                    name: "URL",
                    value: url || "https://snaptrace-dashboard.vercel.app/",
                    inline: true,
                  },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });

        if (discordRes.ok) {
          discordSent = true;
          debugLogs.push("Discord notification sent successfully.");
        } else {
          const text = await discordRes.text();
          debugLogs.push(`Discord Webhook error (${discordRes.status}): ${text}`);
        }
      } catch (discordErr) {
        debugLogs.push(`Discord dispatch failed: ${discordErr.message}`);
      }
    } else {
      debugLogs.push("Discord skipped: No webhook URL configured.");
    }

    // 3. Dispatch Native Slack Webhook Alert (Sentry-Style Rich Card)
    let slackSent = false;
    if (slackWebhookUrl) {
      try {
        const slackPayload = {
          text: `🚨 *[SnapTrace Incident]* ${message || "New Exception Event"}`,
          attachments: [
            {
              color: "#EF4444",
              title: `Crash captured in ${environment || "production"}`,
              title_link: url || "https://snaptrace-dashboard.vercel.app/dashboard/errors",
              text: `*Error:* \`${message || "Unknown Exception"}\`\n*Route:* ${url || "N/A"}\n\`\`\`${(stackTrace || "No stack trace").slice(0, 800)}\`\`\``,
              footer: "SnapTrace Telemetry Monitor",
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        };

        const slackRes = await fetch(slackWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackPayload),
        });

        if (slackRes.ok) {
          slackSent = true;
          debugLogs.push("Slack notification sent successfully.");
        } else {
          const text = await slackRes.text();
          debugLogs.push(`Slack Webhook error (${slackRes.status}): ${text}`);
        }
      } catch (slackErr) {
        debugLogs.push(`Slack dispatch failed: ${slackErr.message}`);
      }
    } else {
      debugLogs.push("Slack skipped: No Slack webhook URL configured.");
    }

    // 4. Dispatch Email Alert via Nodemailer (SMTP)
    let emailSent = false;
    if (recipientEmail && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"SnapTrace System Alerts" <${smtpUser}>`,
          to: recipientEmail,
          subject: `[SnapTrace Error] ${message || "New Exception Event"}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 8px;">
              <h2 style="color: #ef4444; margin-top: 0;">🚨 New Exception Event</h2>
              <p><strong>Message:</strong> ${message || "Unknown Error"}</p>
              <p><strong>Environment:</strong> ${environment || "production"}</p>
              <p><strong>URL:</strong> <a href="${url || "https://snaptrace-dashboard.vercel.app/"}" style="color: #38bdf8;">${url || "https://snaptrace-dashboard.vercel.app/"}</a></p>
              <h3 style="color: #cbd5e1;">Stack Trace:</h3>
              <pre style="background: #1e293b; color: #f87171; padding: 14px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap;">${stackTrace || "No stack trace provided"}</pre>
            </div>
          `,
        });
        emailSent = true;
        debugLogs.push(`Email sent successfully to ${recipientEmail}.`);
      } catch (emailErr) {
        debugLogs.push(`SMTP Email failed: ${emailErr.message}`);
      }
    } else {
      debugLogs.push("Email skipped: Credentials missing.");
    }

    // 5. Save to Supabase Database
    try {
      await supabase.from("errors").insert([
        {
          project_id: project.id,
          message: message || "Unknown Error",
          stack_trace: stackTrace || null,
          environment: environment || "production",
          url: url || null,
          user_agent: userAgent || null,
        },
      ]);
      debugLogs.push("Error event recorded in database.");
    } catch (dbErr) {
      debugLogs.push(`Database insertion failed: ${dbErr.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Telemetry processed",
        notifications: {
          discord: discordSent,
          slack: slackSent,
          email: emailSent,
        },
        debugLogs,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message, debugLogs },
      { status: 500 }
    );
  }
}