// Mediary — on-demand entitlement sync.
//
// The RevenueCat webhook (see ../revenuecat-webhook) is the primary way
// public.entitlements stays current. This function is a client-triggered
// fallback for the moment right after a purchase or "Restore Purchase" —
// webhooks are normally near-instant but can lag by a few seconds, and we
// don't want the user staring at a locked screen after paying. The client
// calls this immediately after RevenueCat confirms a purchase locally.
//
// NOTE: RevenueCat's REST API has evolved across versions — before relying
// on this in production, confirm the current subscriber-lookup endpoint and
// auth scheme against https://www.revenuecat.com/docs/api-v2 (this was
// written against the v1 `/subscribers/{app_user_id}` read endpoint, which
// is authenticated with a platform-specific public API key, NOT the secret
// key used for write operations).
//
// Setup: supabase functions deploy sync-entitlement
//        supabase secrets set REVENUECAT_PUBLIC_API_KEY_IOS=... REVENUECAT_PUBLIC_API_KEY_ANDROID=...
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ENTITLEMENT_ID = 'lifetime';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = userData.user.id;

  const { platform } = await req.json().catch(() => ({ platform: 'ios' }));
  const apiKey =
    platform === 'android'
      ? Deno.env.get('REVENUECAT_PUBLIC_API_KEY_ANDROID')
      : Deno.env.get('REVENUECAT_PUBLIC_API_KEY_IOS');

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RevenueCat API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rcResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!rcResponse.ok) {
    return new Response(JSON.stringify({ error: 'RevenueCat lookup failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rcBody = await rcResponse.json();
  const entitlement = rcBody?.subscriber?.entitlements?.[ENTITLEMENT_ID];
  const isActive = !!entitlement && (entitlement.expires_date === null || new Date(entitlement.expires_date) > new Date());

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  await supabase.from('entitlements').upsert(
    {
      user_id: userId,
      lifetime_purchased_at: isActive ? entitlement.purchase_date ?? new Date().toISOString() : null,
      revenuecat_app_user_id: userId,
      store: platform === 'android' ? 'play_store' : 'app_store',
      last_verified_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  return new Response(JSON.stringify({ lifetimeActive: isActive }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
