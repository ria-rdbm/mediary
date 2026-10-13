import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database';
import type { Gender } from '@/constants/profile';

export interface ProfileDetailsInput {
  fullName: string;
  gender: Gender;
  dateOfBirth: string; // "YYYY-MM-DD"
  weightKg: number | null;
  nhiNumber: string | null;
  preferredProviderName: string | null;
}

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

export async function updateProfileDetails(userId: string, details: ProfileDetailsInput): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: details.fullName,
      gender: details.gender,
      date_of_birth: details.dateOfBirth,
      weight_kg: details.weightKg,
      nhi_number: details.nhiNumber,
      preferred_provider_name: details.preferredProviderName,
    })
    .eq('id', userId);
  if (error) throw error;
}
