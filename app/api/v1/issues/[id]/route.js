import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(request, { params }) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Extract dynamic [id] from route URL params
    const { id } = await params
    const { status, apiKey } = await request.json()

    if (!id || !status || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters (id, status, or apiKey)' }, 
        { status: 400 }
      )
    }

    // Verify user ownership using x-api-key / apiKey
    const { data: keyRecord } = await supabaseAdmin
      .from('user_keys')
      .select('user_id')
      .eq('api_key', apiKey)
      .single()

    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' }, 
        { status: 401 }
      )
    }

    // Update issue status in PostgreSQL database
    const { error: updateError } = await supabaseAdmin
      .from('error_logs')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', keyRecord.user_id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, id, status })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}