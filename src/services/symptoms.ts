import { supabase } from '@/lib/supabase';
import { mapSymptom } from '@/lib/mappers';
import { captureLocalDateTime } from '@/lib/dateTime';
import type { Symptom } from '@/types/domain';
import type { SeverityLevel } from '@/constants/symptoms';

export interface SaveSymptomInput {
  name: string;
  severity: SeverityLevel;
  medicationId?: string | null;
  startAt: Date;
  endAt?: Date | null;
  isOngoing: boolean;
  notes?: string | null;
}

export async function fetchSymptoms(limit = 200): Promise<Symptom[]> {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .order('start_utc', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(mapSymptom);
}

export async function createSymptom(userId: string, input: SaveSymptomInput): Promise<Symptom> {
  const start = captureLocalDateTime(input.startAt);
  const end = input.endAt ? captureLocalDateTime(input.endAt) : null;

  const { data, error } = await supabase
    .from('symptoms')
    .insert({
      user_id: userId,
      name: input.name,
      severity: input.severity,
      medication_id: input.medicationId ?? null,
      start_local: start.local,
      start_utc: start.utc,
      utc_offset_minutes: start.utcOffsetMinutes,
      end_local: end?.local ?? null,
      end_utc: end?.utc ?? null,
      is_ongoing: input.isOngoing,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSymptom(data);
}

export async function updateSymptom(id: string, input: SaveSymptomInput): Promise<Symptom> {
  const start = captureLocalDateTime(input.startAt);
  const end = input.endAt ? captureLocalDateTime(input.endAt) : null;

  const { data, error } = await supabase
    .from('symptoms')
    .update({
      name: input.name,
      severity: input.severity,
      medication_id: input.medicationId ?? null,
      start_local: start.local,
      start_utc: start.utc,
      utc_offset_minutes: start.utcOffsetMinutes,
      end_local: end?.local ?? null,
      end_utc: end?.utc ?? null,
      is_ongoing: input.isOngoing,
      notes: input.notes ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapSymptom(data);
}

export async function deleteSymptom(id: string): Promise<void> {
  const { error } = await supabase.from('symptoms').delete().eq('id', id);
  if (error) throw error;
}
