import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force Next.js to run this route dynamically on every single request
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const apiKey = request.headers.get('x-api-key') || new URL(request.url).searchParams.get('apiKey')

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    // Initialize Supabase Admin client on the server
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 1. Validate API Key to identify the user
    const { data: keyRecord, error: keyError } = await supabaseAdmin
      .from('user_keys')
      .select('user_id')
      .eq('api_key', apiKey)
      .single()

    if (keyError || !keyRecord) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
    }

    // 2. Fetch only logs belonging to this validated user_id
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .eq('user_id', keyRecord.user_id)

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 })
    }

    // 3. Compute real-time analytics
    const totalUniqueIssues = logs.length
    const totalOccurrences = logs.reduce((sum, item) => sum + (item.count || 1), 0)
    const unresolvedCount = logs.filter((i) => i.status === 'unresolved').length
    const resolvedCount = logs.filter((i) => i.status === 'resolved').length
    const ignoredCount = logs.filter((i) => i.status === 'ignored').length

    return NextResponse.json({
      success: true,
      stats: {
        total_unique_issues: totalUniqueIssues,
        total_occurrences: totalOccurrences,
        unresolved_count: unresolvedCount,
        resolved_count: resolvedCount,
        ignored_count: ignoredCount,
        top_issues: logs.slice(0, 5)
      }
    }, { status: 200 })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}