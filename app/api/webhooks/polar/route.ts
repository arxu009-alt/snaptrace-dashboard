import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventType = (body.type || body.event || body.meta?.event_name || '').toLowerCase();
    const data = body.data || {};

    // 1. Extract customer email from various Polar payload shapes
    const customerEmail = (
      data.customer?.email ||
      data.customer_email ||
      data.user?.email ||
      data.email ||
      body.customer_email ||
      body.email ||
      ''
    ).trim();

    console.log(`[Polar Webhook] Received event: "${eventType}" for customer: "${customerEmail || 'unknown'}"`);

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Identify subscription / order created (Trial Started or Subscribed)
    const isSubscriptionCreated =
      eventType === 'subscription.created' ||
      eventType === 'order.created' ||
      eventType === 'subscription.active' ||
      eventType === 'subscription.updated' ||
      eventType === 'subscription_created' ||
      eventType === 'order_created';

    // 3. Identify subscription canceled / revoked
    const isSubscriptionCanceled =
      eventType === 'subscription.canceled' ||
      eventType === 'subscription.revoked' ||
      eventType === 'subscription.cancelled' ||
      eventType === 'subscription_canceled' ||
      eventType === 'subscription_revoked';

    if (isSubscriptionCreated && customerEmail) {
      // Detect product tier from product name or price:
      // If product includes "Scale" or "$99": target tier = 'agency_scale'
      // Otherwise (Studio or "$49"): target tier = 'agency_studio'
      const productName = String(
        data.product?.name ||
        data.product?.title ||
        data.product_name ||
        data.description ||
        ''
      ).toLowerCase();

      const priceAmount =
        data.product_price?.price_amount ??
        data.price?.price_amount ??
        data.amount ??
        0;

      let targetTier: 'agency_studio' | 'agency_scale' = 'agency_studio';
      if (
        productName.includes('scale') ||
        productName.includes('99') ||
        priceAmount === 99 ||
        priceAmount === 9900 ||
        priceAmount === 948 ||
        priceAmount === 94800
      ) {
        targetTier = 'agency_scale';
      } else {
        targetTier = 'agency_studio';
      }

      const subscriptionId = data.id ? String(data.id) : undefined;

      // Query Supabase auth.users by email to find user ID
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('[Polar Webhook] listUsers error:', listError);
      }

      const targetUser = users?.users?.find(
        (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
      );

      if (targetUser) {
        const { data: userProjects } = await supabaseAdmin
          .from('projects')
          .select('id')
          .eq('user_id', targetUser.id);

        if (userProjects && userProjects.length > 0) {
          await supabaseAdmin
            .from('projects')
            .update({
              plan_tier: targetTier,
              ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
            })
            .eq('user_id', targetUser.id);
        } else {
          // If user hasn't created a project yet, provision default project with upgraded tier
          const autoKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
          await supabaseAdmin.from('projects').insert({
            name: 'Default Project',
            api_key: autoKey,
            user_id: targetUser.id,
            plan_tier: targetTier,
            ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
          });
        }

        console.log(
          `[Polar Webhook] Successfully upgraded user ${targetUser.id} (${customerEmail}) to ${targetTier}`
        );
      } else {
        // Fallback: match projects by recipient_email if user record not yet created
        await supabaseAdmin
          .from('projects')
          .update({
            plan_tier: targetTier,
            ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
          })
          .ilike('recipient_email', customerEmail);

        console.log(
          `[Polar Webhook] No auth.user found; updated projects matching recipient_email ${customerEmail} to ${targetTier}`
        );
      }
    } else if (isSubscriptionCanceled && customerEmail) {
      // Downgrade the user's projects back to 'free'
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const targetUser = users?.users?.find(
        (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
      );

      if (targetUser) {
        await supabaseAdmin
          .from('projects')
          .update({
            plan_tier: 'free',
            subscription_id: null,
          })
          .eq('user_id', targetUser.id);

        console.log(
          `[Polar Webhook] Successfully downgraded user ${targetUser.id} (${customerEmail}) projects to free tier`
        );
      } else {
        await supabaseAdmin
          .from('projects')
          .update({
            plan_tier: 'free',
            subscription_id: null,
          })
          .ilike('recipient_email', customerEmail);

        console.log(
          `[Polar Webhook] No auth.user found; downgraded projects matching recipient_email ${customerEmail} to free tier`
        );
      }
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('[Polar Webhook] Processing error:', err);
    // Ensure fail-safe error handling so Polar always receives a 200 OK
    return Response.json({ received: true, error: err?.message || 'Error processing webhook' }, { status: 200 });
  }
}
