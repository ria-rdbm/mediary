import { supabase } from '@/lib/supabase';
import { mapNote } from '@/lib/mappers';
import { captureLocalDateTime } from '@/lib/dateTime';
import type { Note } from '@/types/domain';

export async function fetchNotes(limit = 200): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('occurred_utc', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(mapNote);
}

export async function createNote(
  userId: string,
  note: string,
  occurredAt: Date,
  medicationId?: string | null,
): Promise<Note> {
  const { local, utc, utcOffsetMinutes } = captureLocalDateTime(occurredAt);
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      note,
      occurred_local: local,
      occurred_utc: utc,
      utc_offset_minutes: utcOffsetMinutes,
      medication_id: medicationId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapNote(data);
}

export async function updateNote(
  id: string,
  note: string,
  occurredAt: Date,
  medicationId?: string | null,
): Promise<Note> {
  const { local, utc, utcOffsetMinutes } = captureLocalDateTime(occurredAt);
  const { data, error } = await supabase
    .from('notes')
    .update({
      note,
      occurred_local: local,
      occurred_utc: utc,
      utc_offset_minutes: utcOffsetMinutes,
      medication_id: medicationId ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapNote(data);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}
