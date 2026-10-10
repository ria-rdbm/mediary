import { supabase } from '@/lib/supabase';
import { mapWeightRecord } from '@/lib/mappers';
import { captureLocalDateTime } from '@/lib/dateTime';
import type { WeightRecord } from '@/types/domain';

export async function fetchWeightRecords(limit = 200): Promise<WeightRecord[]> {
  const { data, error } = await supabase
    .from('weight_records')
    .select('*')
    .order('recorded_utc', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(mapWeightRecord);
}

export async function createWeightRecord(
  userId: string,
  weightKg: number,
  recordedAt: Date,
  note?: string | null,
): Promise<WeightRecord> {
  const { local, utc, utcOffsetMinutes } = captureLocalDateTime(recordedAt);
  const { data, error } = await supabase
    .from('weight_records')
    .insert({
      user_id: userId,
      weight_kg: weightKg,
      recorded_local: local,
      recorded_utc: utc,
      utc_offset_minutes: utcOffsetMinutes,
      note: note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapWeightRecord(data);
}

export async function updateWeightRecord(
  id: string,
  weightKg: number,
  recordedAt: Date,
  note?: string | null,
): Promise<WeightRecord> {
  const { local, utc, utcOffsetMinutes } = captureLocalDateTime(recordedAt);
  const { data, error } = await supabase
    .from('weight_records')
    .update({
      weight_kg: weightKg,
      recorded_local: local,
      recorded_utc: utc,
      utc_offset_minutes: utcOffsetMinutes,
      note: note ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapWeightRecord(data);
}

export async function deleteWeightRecord(id: string): Promise<void> {
  const { error } = await supabase.from('weight_records').delete().eq('id', id);
  if (error) throw error;
}
