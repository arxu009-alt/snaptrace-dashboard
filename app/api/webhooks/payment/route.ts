import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventName = body.meta?.event_name || body.event || '';
    const customData = body.meta?.custom_data || {};
    const userEmail = body.data?.attributes?.user_email || customData.email || '';
    const projectId = customData.project_id || '';
    const variantName = (body.data?.attributes?.variant_name || '').toLowerCase();

    const supabase = getSupabaseAdmin();

    // Map variant name to internal tier
    let targetTier = 'starter_pro';
    if (variantName.includes('team') || variantName.includes('scale') || variantName.includes('29')) {
      targetTier = 'team_scale';
    }

    // 1. Subscription Created / Order Created -> Upgrade Tier
    if (
      eventName === 'subscription_created' ||
      eventName === 'order_created' ||
      eventName === 'subscription_resumed'
    ) {
      const subscriptionId = String(body.data?.id || 'sub_active');

      let query = supabase.from('projects').update({
        plan_tier: targetTier,
        subscription_id: subscriptionId,
      });

      if (projectId) {
        query = query.eq('id', projectId);
      } else if (userEmail) {
        query = query.eq('recipient_email', userEmail);
      } else {
        query = query.not('id', 'is', null);
      }

      await query;
      console.log(`[SnapTrace Billing] Account upgraded to ${targetTier} for ${userEmail || projectId}`);
    }

    // 2. Subscription Cancelled / Expired -> Downgrade to Free
    if (
      eventName === 'subscription_cancelled' ||
      eventName === 'subscription_expired'
    ) {
      let query = supabase.from('projects').update({
        plan_tier: 'free',
        subscription_id: null,
      });

      if (projectId) {
        query = query.eq('id', projectId);
      } else if (userEmail) {
        query = query.eq('recipient_email', userEmail);
      }

      await query;
      console.log(`[SnapTrace Billing] Subscription ended. Reverted to free tier.`);
    }

    return NextResponse.json({ success: true, message: 'Billing webhook processed' }, { status: 200 });
  } catch (err: any) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook Error' }, { status: 500 });
  }
}