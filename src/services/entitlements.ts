import { supabase } from '@/lib/supabase';
import type { Entitlement } from '@/types/domain';
import type { EntitlementRow } from '@/types/database';

function mapEntitlement(row: EntitlementRow): Entitlement {
  return {
    trialStartedAt: row.trial_started_at,
    trialLengthDays: row.trial_length_days,
    lifetimePurchasedAt: row.lifetime_purchased_at,
  };
}

export async function fetchEntitlement(): Promise<Entitlement | null> {
  const { data, error } = await supabase.from('entitlements').select('*').maybeSingle();
  if (error) throw error;
  return data ? mapEntitlement(data) : null;
}
