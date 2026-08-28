import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }

    // Authenticate user by API key
    const { data: keyRecord, error: keyError } = await supabaseAdmin
      .from('user_keys')
      .select('user_id')
      .eq('api_key', apiKey)
      .single()

    if (keyError || !keyRecord) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
    }

    const body = await request.json()
    const { release_version, filename, map_data } = body

    if (!release_version || !filename || !map_data) {
      return NextResponse.json(
        { error: 'Missing required fields: release_version, filename, map_data' },
        { status: 400 }
      )
    }

    // Save or update source map payload
    const { error: insertError } = await supabaseAdmin
      .from('source_maps')
      .insert([{
        user_id: keyRecord.user_id,
        release_version,
        filename,
        map_data: typeof map_data === 'string' ? JSON.parse(map_data) : map_data
      }])

    if (insertError) {
      return NextResponse.json({ error: 'Failed to store source map' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Source map uploaded successfully' }, { status: 200 })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}