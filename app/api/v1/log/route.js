import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { PLANS, getStartOfCurrentMonth } from "@/lib/plans";

export const dynamic = "force-dynamic";

// Backtick characters are built from their character code so this file survives copy/paste.
const TICK = String.fromCharCode(96);
const FENCE = TICK + TICK + TICK;
const DEFAULT_URL = "https://snaptrace-dashboard.vercel.app/";

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

// Records ingestion-health counters. Never throws: a stats failure must never block telemetry.
async function recordIngestionStats(supabase, projectId, accepted, throttled, suppressed, debugLogs) {
  try {
    const { error } = await supabase.rpc("bump_ingestion_stats", {
      p_project: projectId,
      p_accepted: accepted,
      p_throttled: throttled,
      p_suppressed: suppressed,
    });
    if (error) debugLogs.push("Ingestion stats update failed: " + error.message);
  } catch (statsErr) {
    debugLogs.push("Ingestion stats update failed: " + statsErr.message);
  }
}

// Client-supplied text must never be trusted: escape it before it goes into an HTML email.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Slack requires & < > to be escaped, otherwise <!channel> and fake links can be injected.
function slackEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Only real http(s) links are allowed to become clickable; anything else falls back.
function safeHttpUrl(value, fallback) {
  try {
    const parsed = new URL(String(value));
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
  } catch (urlErr) {
    // not a valid URL, use fallback
  }
  return fallback;
}

export async function POST(req) {
  const debugLogs = [];

  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { apiKey, message, stackTrace, environment, url, userAgent, occurrenceCount } = body;

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

    // 🌟 1.5 TIER QUOTA ENFORCEMENT & RATE-LIMITING CIRCUIT BREAKER
    const recipientEmail =
      project.recipient_email ||
      project.alert_email ||
      project.alert_email_address ||
      project.email ||
      project.owner_email;

    const ownerEmails = ["arxu1045@gmail.com", "arxu009@gmail.com"];
    const isOwner = recipientEmail && ownerEmails.includes(recipientEmail.toLowerCase());

    // Resolve tier: Owner has unlimited access; others resolve to plan_tier or 'pro' during beta
    const projectTier = isOwner ? "agency" : (project.plan_tier || "pro");
    const activePlan = (PLANS && PLANS[projectTier]) ? PLANS[projectTier] : { monthlyEventCap: 75000 };

    if (!isOwner) {
      const startOfMonth = typeof getStartOfCurrentMonth === "function"
        ? getStartOfCurrentMonth()
        : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();

      // Count events recorded for this project in the current monthly cycle
      const { count: monthlyCount, error: countError } = await supabase
        .from("errors")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .gte("created_at", startOfMonth);

      // CIRCUIT BREAKER TRIGGER: Stop execution & block database write
      if (!countError && monthlyCount !== null && monthlyCount >= activePlan.monthlyEventCap) {
        await recordIngestionStats(supabase, project.id, 0, 1, 0, debugLogs);
        return NextResponse.json(
          {
            error: "Monthly event quota exceeded for your current plan.",
            limit: activePlan.monthlyEventCap,
            upgrade_url: "https://snaptrace-dashboard.vercel.app/dashboard/settings",
          },
          { status: 429 }
        );
      }
    }

    // 🌟 1.8 ENVIRONMENT ALERT FILTER (Only Alert on Production)
    const envString = (environment || "production").toLowerCase();
    const isDevEnv = envString !== "production";
    const muteAlerts = Boolean(project.only_production_alerts) && isDevEnv;

    if (muteAlerts) {
      debugLogs.push("Alerts muted: 'Only Alert on Production' is active and environment is '" + envString + "'.");
    }

    // 2. Save to Supabase Database FIRST, so a slow or hanging alert channel can never lose the event
    try {
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
        debugLogs.push("Database insertion failed: " + insertError.message);
      } else {
        debugLogs.push("Error event recorded in database.");
        const collapsed = Math.min(Math.max(Math.floor(Number(occurrenceCount)) || 1, 1) - 1, 10000);
        await recordIngestionStats(supabase, project.id, 1, 0, collapsed, debugLogs);
      }
    } catch (dbErr) {
      debugLogs.push("Database insertion failed: " + dbErr.message);
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

    // Resolve SMTP Sender Credentials
    const smtpUser =
      process.env.OWNER_EMAIL ||
      process.env.GMAIL_USER ||
      process.env.SMTP_USER;

    const smtpPass =
      process.env.GMAIL_APP_PASSWORD ||
      process.env.SMTP_PASS;

    // 3. Dispatch Discord Webhook Alert (Skipped if muted)
    let discordSent = false;
    if (discordWebhookUrl && !muteAlerts) {
      try {
        const discordRes = await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: "🚨 " + (message || "New Exception Event"),
                description: stackTrace
                  ? FENCE + "\n" + stackTrace.slice(0, 1000) + "\n" + FENCE
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
                    value: url || DEFAULT_URL,
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
          debugLogs.push("Discord Webhook error (" + discordRes.status + "): " + text);
        }
      } catch (discordErr) {
        debugLogs.push("Discord dispatch failed: " + discordErr.message);
      }
    } else if (muteAlerts) {
      debugLogs.push("Discord skipped: Muted by environment filter.");
    } else {
      debugLogs.push("Discord skipped: No webhook URL configured.");
    }

    // 4. Dispatch Native Slack Webhook Alert (Skipped if muted)
    let slackSent = false;
    if (slackWebhookUrl && !muteAlerts) {
      try {
        const slackPayload = {
          text: "🚨 *[SnapTrace Incident]* " + slackEscape(message || "New Exception Event"),
          attachments: [
            {
              color: "#EF4444",
              title: "Crash captured in " + slackEscape(environment || "production"),
              title_link: safeHttpUrl(url, "https://snaptrace-dashboard.vercel.app/dashboard/errors"),
              text:
                "*Error:* " + TICK + slackEscape(message || "Unknown Exception") + TICK +
                "\n*Route:* " + slackEscape(url || "N/A") +
                "\n" + FENCE + slackEscape((stackTrace || "No stack trace").slice(0, 800)) + FENCE,
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
          debugLogs.push("Slack Webhook error (" + slackRes.status + "): " + text);
        }
      } catch (slackErr) {
        debugLogs.push("Slack dispatch failed: " + slackErr.message);
      }
    } else if (muteAlerts) {
      debugLogs.push("Slack skipped: Muted by environment filter.");
    } else {
      debugLogs.push("Slack skipped: No Slack webhook URL configured.");
    }

    // 5. Dispatch Email Alert via Nodemailer (SMTP) (Skipped if muted)
    let emailSent = false;
    if (recipientEmail && smtpUser && smtpPass && !muteAlerts) {
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

        // Everything that came from the client is escaped before entering the HTML below
        const safeMessage = escapeHtml(message || "Unknown Error");
        const safeEnvironment = escapeHtml(environment || "production");
        const safeUrlText = escapeHtml(url || DEFAULT_URL);
        const safeUrlHref = escapeHtml(safeHttpUrl(url, DEFAULT_URL));
        const safeStack = escapeHtml(stackTrace || "No stack trace provided");

        await transporter.sendMail({
          from: '"SnapTrace System Alerts" <' + smtpUser + '>',
          to: recipientEmail,
          subject: "[SnapTrace Error] " + (message || "New Exception Event"),
          html: [
            '<div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 8px;">',
            '  <h2 style="color: #ef4444; margin-top: 0;">🚨 New Exception Event</h2>',
            '  <p><strong>Message:</strong> ' + safeMessage + '</p>',
            '  <p><strong>Environment:</strong> ' + safeEnvironment + '</p>',
            '  <p><strong>URL:</strong> <a href="' + safeUrlHref + '" style="color: #38bdf8;">' + safeUrlText + '</a></p>',
            '  <h3 style="color: #cbd5e1;">Stack Trace:</h3>',
            '  <pre style="background: #1e293b; color: #f87171; padding: 14px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap;">' + safeStack + '</pre>',
            '</div>',
          ].join("\n"),
        });
        emailSent = true;
        debugLogs.push("Email sent successfully to " + recipientEmail + ".");
      } catch (emailErr) {
        debugLogs.push("SMTP Email failed: " + emailErr.message);
      }
    } else if (muteAlerts) {
      debugLogs.push("Email skipped: Muted by environment filter.");
    } else {
      debugLogs.push("Email skipped: Credentials missing.");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Telemetry processed",
        notifications: {
          discord: discordSent,
          slack: slackSent,
          email: emailSent,
          mutedByFilter: muteAlerts,
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