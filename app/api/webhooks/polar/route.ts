import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

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

function verifyPolarSignature(
  rawBody: string,
  secret: string,
  headers: Headers
): boolean {
  try {
    const signatureHeader =
      headers.get('webhook-signature') ||
      headers.get('polar-signature') ||
      headers.get('x-polar-signature') ||
      '';

    if (!signatureHeader) {
      return false;
    }

    // Polar / Standard Webhooks format: "v1,signature" or "t=timestamp,v1=signature" or raw hex/base64
    const webhookId = headers.get('webhook-id') || '';
    const webhookTimestamp = headers.get('webhook-timestamp') || '';

    // 1. Check Standard Webhooks / Svix payload format: "${webhookId}.${webhookTimestamp}.${rawBody}"
    if (webhookId && webhookTimestamp) {
      const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
      // Secret in Svix starts with "whsec_" (base64 encoded after prefix) or raw secret
      const cleanSecret = secret.startsWith('whsec_') ? secret.substring(6) : secret;
      const secretBytes = secret.startsWith('whsec_')
        ? Buffer.from(cleanSecret, 'base64')
        : Buffer.from(cleanSecret, 'utf-8');

      const computedBase64 = crypto
        .createHmac('sha256', secretBytes)
        .update(signedPayload)
        .digest('base64');

      const signatures = signatureHeader.split(/[\s,]+/);
      for (const sig of signatures) {
        const val = sig.startsWith('v1,') ? sig.slice(3) : sig;
        if (
          val.length === computedBase64.length &&
          crypto.timingSafeEqual(Buffer.from(val), Buffer.from(computedBase64))
        ) {
          return true;
        }
      }
    }

    // 2. Direct HMAC-SHA256 hex or base64 verification on raw body
    const computedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const computedBase64Direct = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');

    const cleanSig = signatureHeader.replace(/^v1[=,]/, '').trim();

    if (
      cleanSig.length === computedHex.length &&
      crypto.timingSafeEqual(Buffer.from(cleanSig), Buffer.from(computedHex))
    ) {
      return true;
    }

    if (
      cleanSig.length === computedBase64Direct.length &&
      crypto.timingSafeEqual(Buffer.from(cleanSig), Buffer.from(computedBase64Direct))
    ) {
      return true;
    }

    return false;
  } catch (err) {
    console.error('[Polar Webhook] Signature verification error:', err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    // 1. Signature Verification Guard
    if (webhookSecret) {
      const isValid = verifyPolarSignature(rawBody, webhookSecret, req.headers);
      if (!isValid) {
        console.warn('[Polar Webhook Security Alert] Invalid or missing webhook signature detected. Rejecting payload.');
        return Response.json(
          { error: 'Unauthorized: Invalid webhook signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn(
        '[Polar Webhook Security Warning] POLAR_WEBHOOK_SECRET is not configured in environment. Signature check bypassed.'
      );
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventType = (body.type || body.event || body.meta?.event_name || '').toLowerCase();
    const data = body.data || {};

    // 2. Extract and Sanitize Customer Email
    const rawCustomerEmail = (
      data.customer?.email ||
      data.customer_email ||
      data.user?.email ||
      data.email ||
      body.customer_email ||
      body.email ||
      ''
    ).trim();

    if (!rawCustomerEmail) {
      return Response.json({ received: true, note: 'No customer email present in payload' }, { status: 200 });
    }

    // Strict Email Format Validation
    if (!EMAIL_REGEX.test(rawCustomerEmail)) {
      console.warn(`[Polar Webhook Security Alert] Malformed email string detected: "${rawCustomerEmail}".`);
      return Response.json({ error: 'Invalid customer email format' }, { status: 400 });
    }

    const customerEmail = rawCustomerEmail.toLowerCase();
    console.log(`[Polar Webhook] Processing event: "${eventType}" for customer: "${customerEmail}"`);

    const supabaseAdmin = getSupabaseAdmin();

    // 3. Identify subscription / order created (Trial Started or Subscribed)
    const isSubscriptionCreated =
      eventType === 'subscription.created' ||
      eventType === 'order.created' ||
      eventType === 'subscription.active' ||
      eventType === 'subscription.updated' ||
      eventType === 'subscription_created' ||
      eventType === 'order_created';

    // 4. Identify subscription canceled / revoked
    const isSubscriptionCanceled =
      eventType === 'subscription.canceled' ||
      eventType === 'subscription.revoked' ||
      eventType === 'subscription.cancelled' ||
      eventType === 'subscription_canceled' ||
      eventType === 'subscription_revoked';

    if (isSubscriptionCreated) {
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
        priceAmount === 49 ||
        priceAmount === 4900 ||
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

      // Query Supabase auth.users strictly with parameterized call
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('[Polar Webhook] listUsers error:', listError);
      }

      const targetUser = users?.users?.find(
        (u) => u.email?.toLowerCase() === customerEmail
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
          const autoKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`;
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
        // Fallback: match projects by recipient_email using parameterized query
        await supabaseAdmin
          .from('projects')
          .update({
            plan_tier: targetTier,
            ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
          })
          .eq('recipient_email', customerEmail);

        console.log(
          `[Polar Webhook] Updated projects matching recipient_email ${customerEmail} to ${targetTier}`
        );
      }
    } else if (isSubscriptionCanceled) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const targetUser = users?.users?.find(
        (u) => u.email?.toLowerCase() === customerEmail
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
          .eq('recipient_email', customerEmail);

        console.log(
          `[Polar Webhook] Downgraded projects matching recipient_email ${customerEmail} to free tier`
        );
      }
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('[Polar Webhook] Processing error:', err);
    return Response.json({ received: true, error: err?.message || 'Error processing webhook' }, { status: 200 });
  }
}
