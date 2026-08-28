import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { resolveStackTrace } from '@/lib/sourcemap'
import { dispatchWebhookAlert } from '@/lib/webhook'

const rateLimitMap = new Map()
const RATE_LIMIT_MAX = 60
const RATE_LIMIT_WINDOW_MS = 60 * 1000

function checkRateLimit(apiKey) {
  const now = Date.now()
  const record = rateLimitMap.get(apiKey)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(apiKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false }
  }

  record.count += 1
  return { allowed: true }
}

function generateFingerprint(errorMsg, stackTrace) {
  const firstFrame = stackTrace ? stackTrace.split('\n')[1] || '' : ''
  const rawString = `${errorMsg.trim()}:${firstFrame.trim()}`
  return crypto.createHash('sha256').update(rawString).digest('hex')
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  })
}

export async function POST(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const apiKey = request.headers.get('x-api-key') || new URL(request.url).searchParams.get('apiKey')
    if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 401, headers: corsHeaders })

    if (!checkRateLimit(apiKey).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: corsHeaders })
    }

    const { data: keyRecord, error: keyError } = await supabaseAdmin
      .from('user_keys')
      .select('user_id')
      .eq('api_key', apiKey)
      .single()

    if (keyError || !keyRecord) return NextResponse.json({ error: 'Invalid API key' }, { status: 403, headers: corsHeaders })

    const body = await request.json()
    let { error_msg, stack_trace, url, user_agent } = body
    if (!error_msg) return NextResponse.json({ error: 'error_msg required' }, { status: 400, headers: corsHeaders })

    // 1. Resolve source maps if available
    const { data: latestMap } = await supabaseAdmin
      .from('source_maps')
      .select('map_data')
      .eq('user_id', keyRecord.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let processedStack = stack_trace || 'No stack trace'
    if (latestMap && latestMap.map_data && stack_trace) {
      processedStack = await resolveStackTrace(stack_trace, latestMap.map_data)
    }

    // 2. Generate fingerprint
    const fingerprint = generateFingerprint(error_msg, processedStack)

    // 3. Query existing issues
    const { data: existingError } = await supabaseAdmin
      .from('error_logs')
      .select('id, count')
      .eq('user_id', keyRecord.user_id)
      .eq('error_hash', fingerprint)
      .eq('status', 'unresolved')
      .single()

    if (existingError) {
      const { error: updateError } = await supabaseAdmin
        .from('error_logs')
        .update({
          count: (existingError.count || 1) + 1,
          updated_at: new Date().toISOString(),
          user_agent: user_agent || 'Unknown'
        })
        .eq('id', existingError.id)

      if (updateError) console.error('[Log Engine Update Error]:', updateError)
    } else {
      // Insert new unresolved issue with explicit error logging
      const { error: insertError } = await supabaseAdmin
        .from('error_logs')
        .insert([{
          user_id: keyRecord.user_id,
          error_hash: fingerprint,
          error_msg: String(error_msg).slice(0, 1000),
          stack_trace: String(processedStack).slice(0, 5000),
          url: url || 'Unknown Route',
          user_agent: user_agent || 'Unknown',
          count: 1,
          status: 'unresolved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (insertError) {
        console.error('[Log Engine Insert Error]:', insertError)
        return NextResponse.json({ error: 'Failed to write log', details: insertError.message }, { status: 500, headers: corsHeaders })
      }

      // 4. Dispatch alert to active webhooks
      const { data: activeWebhooks } = await supabaseAdmin
        .from('webhooks')
        .select('url')
        .eq('user_id', keyRecord.user_id)
        .eq('is_active', true)

      if (activeWebhooks && activeWebhooks.length > 0) {
        activeWebhooks.forEach((hook) => {
          dispatchWebhookAlert(hook.url, {
            error_msg,
            url,
            stack_trace: processedStack,
            count: 1
          })
        })
      }
    }

    return NextResponse.json({ success: true, aggregated: !!existingError }, { status: 200, headers: corsHeaders })

  } catch (err) {
    console.error('[Log Engine Exception]:', err)
    return NextResponse.json({ error: 'Internal Ingestion Engine Error', details: err.message }, { status: 500, headers: corsHeaders })
  }
}