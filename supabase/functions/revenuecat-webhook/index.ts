// Mediary — RevenueCat webhook receiver.
//
// Keeps public.entitlements.lifetime_purchased_at in sync with RevenueCat,
// which remains the single source of truth for purchase state (section 68).
// This function runs with the service_role key, so it is the only path
// (besides sync-entitlement) allowed to write that column — the mobile app
// itself never writes it directly.
//
// Setup (see README.md "RevenueCat configuration"):
//   1. Deploy: supabase functions deploy revenuecat-webhook --no-verify-jwt
//   2. In RevenueCat → Project settings → Integrations → Webhooks, set the
//      URL to this function's endpoint and the "Authorization header value"
//      to the same string you store as REVENUECAT_WEBHOOK_AUTH_SECRET.
//   3. supabase secrets set REVENUECAT_WEBHOOK_AUTH_SECRET=... SUPABASE_SERVICE_ROLE_KEY=... (auto-provided)
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GRANT_EVENTS = new Set(['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'UNCANCELLATION', 'TEMPORARY_ENTITLEMENT_GRANT', 'PURCHASE_REDEEMED']);
const REVOKE_EVENTS = new Set(['CANCELLATION', 'EXPIRATION']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_SECRET');
  const receivedAuth = req.headers.get('Authorization');
  if (!expectedAuth || receivedAuth !== `Bearer ${expectedAuth}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const body = await req.json();
  const event = body?.event;
  if (!event?.type || !event?.app_user_id) {
    return new Response(JSON.stringify({ error: 'Malformed payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // app_user_id is set to the Supabase auth user id at identify-time
  // (see src/lib/revenuecat.ts), so it doubles as our user_id.
  const userId = event.app_user_id as string;
  const store = event.store === 'APP_STORE' ? 'app_store' : event.store === 'PLAY_STORE' ? 'play_store' : null;

  if (GRANT_EVENTS.has(event.type)) {
    await supabase
      .from('entitlements')
      .upsert(
        {
          user_id: userId,
          lifetime_purchased_at: new Date().toISOString(),
          revenuecat_app_user_id: userId,
          store,
          last_verified_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
  } else if (REVOKE_EVENTS.has(event.type)) {
    await supabase
      .from('entitlements')
      .update({ lifetime_purchased_at: null, last_verified_at: new Date().toISOString() })
      .eq('user_id', userId);
  }
  // Other event types (BILLING_ISSUE, PRODUCT_CHANGE, TEST, etc.) are
  // logged implicitly via RevenueCat's own dashboard and don't need a
  // local side effect for a single lifetime, non-subscription product.

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
