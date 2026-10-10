import { supabase } from '@/lib/supabase';
import { mapProvider } from '@/lib/mappers';
import type { Provider } from '@/types/domain';

export async function fetchProviders(): Promise<Provider[]> {
  const { data, error } = await supabase.from('providers').select('*').order('last_used_at', { ascending: false });
  if (error) throw error;
  return data.map(mapProvider);
}

export async function createProvider(userId: string, name: string): Promise<Provider> {
  const { data, error } = await supabase
    .from('providers')
    .insert({ user_id: userId, name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return mapProvider(data);
}

export async function touchProviderLastUsed(id: string): Promise<void> {
  const { error } = await supabase.from('providers').update({ last_used_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function updateProvider(id: string, name: string): Promise<Provider> {
  const { data, error } = await supabase
    .from('providers')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapProvider(data);
}

export async function deleteProvider(id: string): Promise<void> {
  const { error } = await supabase.from('providers').delete().eq('id', id);
  if (error) throw error;
}
