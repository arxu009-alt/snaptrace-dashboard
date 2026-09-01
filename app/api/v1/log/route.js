import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, message, stackTrace, environment, url, userAgent } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 400 }
      );
    }

    // 1. Verify API Key and retrieve associated project_id
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("api_key", apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // 2. Save incoming error event under the matched project_id
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

    return NextResponse.json(
      { success: true, message: "Error log recorded successfully" },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}