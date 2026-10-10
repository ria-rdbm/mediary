// Mediary — Apple authorization-code exchange.
//
// Called once, right after a successful native "Sign in with Apple", so we
// can later revoke the grant on account deletion (Apple requires this —
// section 73). expo-apple-authentication's signInAsync() result includes a
// short-lived `authorizationCode`; we exchange it here, server-side, for a
// refresh_token and store it in public.apple_credentials (RLS-locked table,
// service_role only — see 0010_apple_credentials.sql).
//
// Setup: supabase functions deploy apple-token-exchange
//        supabase secrets set APPLE_CLIENT_ID=nz.mediary.app \
//          APPLE_TEAM_ID=... APPLE_KEY_ID=... APPLE_PRIVATE_KEY="$(cat AuthKey_XXXX.p8)"
// APPLE_CLIENT_ID is your Services ID (or app bundle id if using the app
// id directly) as registered for Sign in with Apple in the Apple Developer
// portal; APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY come from the "Sign
// in with Apple" key you generate there.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { create as createJwt, Header, Payload } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

async function buildAppleClientSecret(): Promise<string> {
  const teamId = Deno.env.get('APPLE_TEAM_ID')!;
  const keyId = Deno.env.get('APPLE_KEY_ID')!;
  const clientId = Deno.env.get('APPLE_CLIENT_ID')!;
  const privateKeyPem = Deno.env.get('APPLE_PRIVATE_KEY')!;

  const pemBody = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', keyData, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);

  const header: Header = { alg: 'ES256', kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload: Payload = {
    iss: teamId,
    iat: now,
    exp: now + 60 * 5,
    aud: 'https://appleid.apple.com',
    sub: clientId,
  };
  return createJwt(header, payload, key);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { authorizationCode } = await req.json();
  if (!authorizationCode) {
    return new Response(JSON.stringify({ error: 'Missing authorizationCode' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const clientSecret = await buildAppleClientSecret();
    const clientId = Deno.env.get('APPLE_CLIENT_ID')!;

    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
      }),
    });
    const tokenBody = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenBody.refresh_token) {
      console.error('Apple token exchange failed', tokenBody);
      return new Response(JSON.stringify({ error: 'Apple token exchange failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await supabase.from('apple_credentials').upsert(
      { user_id: userData.user.id, refresh_token: tokenBody.refresh_token },
      { onConflict: 'user_id' },
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('apple-token-exchange error', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
