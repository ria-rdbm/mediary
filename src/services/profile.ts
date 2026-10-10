import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database';

export async function fetchProfile(): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').select('*').single();
  if (error) throw error;
  return data;
}

export async function acknowledgeDisclaimer(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ disclaimer_acknowledged_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function completeOnboarding(userId: string, categories: string[]): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString(), onboarding_categories: categories })
    .eq('id', userId);
  if (error) throw error;
}
