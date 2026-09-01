import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { apiKey, message, stackTrace, environment, url, userAgent } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 400 }
      );
    }

    // 1. Fetch project details and notification settings
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

    // 2. Save incoming error event to database
    const { error: insertError } = await supabase.from("errors").insert([
      {
        project_id: project.id,
        message: message || "Unknown Error",
        stack_trace: stackTrace || null,
        environment: environment || "production",
        url: url || null,
        user_agent: userAgent || null,
      },
    ]);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to log telemetry", details: insertError.message },
        { status: 500 }
      );
    }

    // 3. Dispatch Discord Webhook Alert
    const discordWebhookUrl = project.discord_webhook_url || project.discord_webhook;
    if (discordWebhookUrl) {
      try {
        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: `🚨 ${message || "New Exception Event"}`,
                description: stackTrace ? `\`\`\`\n${stackTrace}\n\`\`\`` : "No stack trace provided",
                color: 15158332,
                fields: [
                  { name: "Environment", value: environment || "production", inline: true },
                  { name: "URL", value: url || "https://snaptrace-dashboard.vercel.app/", inline: true },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      } catch (discordErr) {
        console.error("Failed to send Discord alert:", discordErr);
      }
    }

    // 4. Dispatch Email Alert via Resend
    const alertEmail = project.alert_email || project.email;
    if (alertEmail && process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SnapTrace System <onboarding@resend.dev>",
            to: [alertEmail],
            subject: `[SnapTrace Error] ${message || "New Exception Event"} - 🚨 New Exception Event Message`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #e53e3e;">🚨 SnapTrace Exception Alert</h2>
                <p><strong>Error Message:</strong> ${message || "Unknown Error"}</p>
                <p><strong>Environment:</strong> ${environment || "production"}</p>
                <p><strong>URL:</strong> ${url || "https://snaptrace-dashboard.vercel.app/"}</p>
                <h3>Stack Trace:</h3>
                <pre style="background: #f4f4f5; padding: 12px; border-radius: 6px; overflow-x: auto;">${stackTrace || "No stack trace provided"}</pre>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send Email alert:", emailErr);
      }
    }

    return NextResponse.json(
      { success: true, message: "Error log recorded and alerts dispatched successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}