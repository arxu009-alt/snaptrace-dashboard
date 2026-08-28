import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get('apiKey')
    const action = searchParams.get('action') // 'purge_resolved' or 'purge_all'

    if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 401 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Verify key owner
    const { data: keyRecord } = await supabaseAdmin
      .from('user_keys')
      .select('user_id')
      .eq('api_key', apiKey)
      .single()

    if (!keyRecord) return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 })

    if (action === 'purge_resolved') {
      await supabaseAdmin
        .from('error_logs')
        .delete()
        .eq('user_id', keyRecord.user_id)
        .eq('status', 'resolved')
    } else if (action === 'purge_all') {
      await supabaseAdmin
        .from('error_logs')
        .delete()
        .eq('user_id', keyRecord.user_id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}