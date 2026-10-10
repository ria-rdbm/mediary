import { supabase } from '@/lib/supabase';

export async function exchangeAppleAuthorizationCode(authorizationCode: string): Promise<void> {
  try {
    await supabase.functions.invoke('apple-token-exchange', { body: { authorizationCode } });
  } catch (err) {
    // Non-fatal: sign-in already succeeded via signInWithIdToken. Worst case,
    // account deletion later can't revoke the Apple grant server-side.
    console.warn('apple-token-exchange failed', err);
  }
}

export async function startTrialIfNeeded() {
  const { data, error } = await supabase.rpc('start_trial');
  if (error) throw error;
  return data;
}

export async function syncEntitlement(platform: 'ios' | 'android'): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke<{ lifetimeActive: boolean }>('sync-entitlement', {
    body: { platform },
  });
  if (error) throw error;
  return data?.lifetimeActive ?? false;
}

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
}
