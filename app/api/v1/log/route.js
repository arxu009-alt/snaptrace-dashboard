import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Prevent Vercel static build evaluation errors
export const dynamic = "force-dynamic";

// Initialize Supabase lazily during request execution
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

    // 1. Fetch project details and configured channels
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("api_key", apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    const discordWebhookUrl =
      project.discord_webhook_url || project.discord_webhook;
    const recipientEmail =
      project.alert_email ||
      project.alert_email_address ||
      project.email;

    // 2. Dispatch Discord Webhook Alert
    if (discordWebhookUrl) {
      try {
        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: `🚨 ${message || "New Exception Event"}`,
                description: stackTrace
                  ? `\`\`\`\n${stackTrace}\n\`\`\``
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
      } catch (discordErr) {
        console.error("Discord alert error:", discordErr);
      }
    }

    // 3. Dispatch Email Alert via Nodemailer (SMTP)
    const smtpUser =
      process.env.SMTP_USER ||
      process.env.GMAIL_USER ||
      "arxu009@gmail.com";
    const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (recipientEmail && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"SnapTrace Alerts" <${smtpUser}>`,
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
      } catch (emailErr) {
        console.error("SMTP Email alert error:", emailErr);
      }
    }

    // 4. Record error entry in Supabase database
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
    } catch (dbErr) {
      console.error("Database insert error:", dbErr);
    }

    return NextResponse.json(
      { success: true, message: "Error log recorded and alerts dispatched" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}