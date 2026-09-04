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
    const { apiKey, message, stackTrace, environment, url, userAgent, fingerprint, occurrenceCount } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    // 1. Fetch project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("api_key", apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Invalid API key or project not found" }, { status: 401 });
    }

    // Resolve Discord Webhook URL
    const discordWebhookUrl =
      project.discord_webhook_url ||
      project.discord_webhook ||
      project.webhook_url ||
      project.discord_url;

    // Resolve Recipient Email
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
        const countText = occurrenceCount && occurrenceCount > 1 ? ` (Occurred ${occurrenceCount} times)` : "";
        const discordRes = await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: `🚨 ${message || "New Exception Event"}${countText}`,
                description: stackTrace
                  ? `\`\`\`\n${stackTrace.slice(0, 1000)}\n\`\`\``
                  : "No stack trace provided",
                color: 15158332,
                fields: [
                  { name: "Environment", value: environment || "production", inline: true },
                  { name: "Occurrences", value: String(occurrenceCount || 1), inline: true },
                  { name: "URL", value: url || "N/A", inline: false },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });

        if (discordRes.ok) {
          discordSent = true;
          debugLogs.push("Discord notification sent.");
        }
      } catch (discordErr) {
        debugLogs.push(`Discord error: ${discordErr.message}`);
      }
    }

    // 3. Dispatch Email Alert via Nodemailer (SMTP)
    let emailSent = false;
    if (recipientEmail && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const countHeader = occurrenceCount && occurrenceCount > 1 ? `[x${occurrenceCount}] ` : "";

        await transporter.sendMail({
          from: `"SnapTrace System Alerts" <${smtpUser}>`,
          to: recipientEmail,
          subject: `🚨 [SnapTrace] ${countHeader}${message || "New Exception Event"}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 8px;">
              <h2 style="color: #ef4444; margin-top: 0;">🚨 New Exception Event</h2>
              <p><strong>Message:</strong> ${message || "Unknown Error"}</p>
              <p><strong>Occurrences:</strong> ${occurrenceCount || 1}</p>
              <p><strong>Environment:</strong> ${environment || "production"}</p>
              <p><strong>Trigger URL:</strong> ${url || "N/A"}</p>
              <h3 style="color: #cbd5e1;">Stack Trace:</h3>
              <pre style="background: #1e293b; color: #f87171; padding: 14px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap;">${stackTrace || "No stack trace provided"}</pre>
            </div>
          `,
        });
        emailSent = true;
        debugLogs.push("Email notification sent.");
      } catch (emailErr) {
        debugLogs.push(`SMTP Email error: ${emailErr.message}`);
      }
    }

    // 4. Save Event into Database with Explicit Error Checking
    const { error: insertError } = await supabase.from("errors").insert([
      {
        project_id: project.id,
        message: message || "Unknown Error",
        stack_trace: stackTrace || null,
        environment: environment || "production",
        url: url || null,
        user_agent: userAgent || null,
        status: "unresolved",
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error("Database insert error:", insertError.message);
      debugLogs.push(`Database error: ${insertError.message}`);
    } else {
      debugLogs.push("Error event recorded in database.");
    }

    return NextResponse.json(
      {
        success: !insertError,
        message: insertError ? "Telemetry alert dispatched, but database insert failed" : "Telemetry processed successfully",
        notifications: { discord: discordSent, email: emailSent },
        debugLogs,
      },
      { status: insertError ? 500 : 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message, debugLogs },
      { status: 500 }
    );
  }
}