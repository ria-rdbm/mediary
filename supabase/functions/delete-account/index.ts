// Mediary — account deletion (section 73).
//
// Every app table has `user_id uuid references auth.users(id) on delete
// cascade`, so deleting the auth user is sufficient to permanently erase
// all of a user's health data in one atomic step. This function also
// best-effort revokes the user's Apple refresh token first (required by
// Apple's Sign in with Apple guidelines) — a failure there is logged but
// never blocks the actual deletion, since the account must always be
// removable even if Apple's revoke endpoint is unreachable.
//
// Setup: supabase functions deploy delete-account
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
  const payload: Payload = { iss: teamId, iat: now, exp: now + 300, aud: 'https://appleid.apple.com', sub: clientId };
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
  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Best-effort Apple revocation — never blocks deletion.
  try {
    const { data: appleCred } = await admin
      .from('apple_credentials')
      .select('refresh_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (appleCred?.refresh_token && Deno.env.get('APPLE_TEAM_ID')) {
      const clientSecret = await buildAppleClientSecret();
      await fetch('https://appleid.apple.com/auth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('APPLE_CLIENT_ID')!,
          client_secret: clientSecret,
          token: appleCred.refresh_token,
          token_type_hint: 'refresh_token',
        }),
      });
    }
  } catch (err) {
    console.error('Apple token revocation failed (continuing with deletion)', err);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('Failed to delete auth user', deleteError);
    return new Response(JSON.stringify({ error: 'Deletion failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
