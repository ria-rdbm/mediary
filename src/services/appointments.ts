import { supabase } from '@/lib/supabase';
import { mapAppointment, mapProviderQuestion } from '@/lib/mappers';
import { captureLocalDateTime } from '@/lib/dateTime';
import type { Appointment, ProviderQuestion } from '@/types/domain';

export interface SaveAppointmentInput {
  medicationId?: string | null;
  providerId?: string | null;
  providerNameSnapshot?: string | null;
  visitAt: Date;
  providerInstructions?: string | null;
  myNotes?: string | null;
  treatmentChanges?: string | null;
  nextAppointmentLocal?: string | null;
}

export async function fetchAppointments(limit = 200): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('visit_utc', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(mapAppointment);
}

export async function fetchAppointment(id: string): Promise<Appointment> {
  const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
  if (error) throw error;
  return mapAppointment(data);
}

export async function createAppointment(userId: string, input: SaveAppointmentInput): Promise<Appointment> {
  const { local, utc, utcOffsetMinutes } = captureLocalDateTime(input.visitAt);
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      medication_id: input.medicationId ?? null,
      provider_id: input.providerId ?? null,
      provider_name_snapshot: input.providerNameSnapshot ?? null,
      visit_local: local,
      visit_utc: utc,
      utc_offset_minutes: utcOffsetMinutes,
      provider_instructions: input.providerInstructions ?? null,
      my_notes: input.myNotes ?? null,
      treatment_changes: input.treatmentChanges ?? null,
      next_appointment_local: input.nextAppointmentLocal ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAppointment(data);
}

export async function updateAppointment(id: string, input: SaveAppointmentInput): Promise<Appointment> {
  const { local, utc, utcOffsetMinutes } = captureLocalDateTime(input.visitAt);
  const { data, error } = await supabase
    .from('appointments')
    .update({
      medication_id: input.medicationId ?? null,
      provider_id: input.providerId ?? null,
      provider_name_snapshot: input.providerNameSnapshot ?? null,
      visit_local: local,
      visit_utc: utc,
      utc_offset_minutes: utcOffsetMinutes,
      provider_instructions: input.providerInstructions ?? null,
      my_notes: input.myNotes ?? null,
      treatment_changes: input.treatmentChanges ?? null,
      next_appointment_local: input.nextAppointmentLocal ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAppointment(data);
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchProviderQuestions(appointmentId: string): Promise<ProviderQuestion[]> {
  const { data, error } = await supabase
    .from('provider_questions')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data.map(mapProviderQuestion);
}

export async function addProviderQuestion(
  userId: string,
  appointmentId: string,
  question: string,
  position: number,
): Promise<ProviderQuestion> {
  const { data, error } = await supabase
    .from('provider_questions')
    .insert({ user_id: userId, appointment_id: appointmentId, question, position })
    .select()
    .single();
  if (error) throw error;
  return mapProviderQuestion(data);
}

export async function toggleProviderQuestion(id: string, isChecked: boolean): Promise<void> {
  const { error } = await supabase.from('provider_questions').update({ is_checked: isChecked }).eq('id', id);
  if (error) throw error;
}

export async function deleteProviderQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('provider_questions').delete().eq('id', id);
  if (error) throw error;
}

export async function addAppointmentReminder(
  userId: string,
  appointmentId: string,
  params: { minutesBefore?: number | null; customLocal?: string | null; notificationId: string | null },
): Promise<void> {
  const { error } = await supabase.from('appointment_reminders').insert({
    user_id: userId,
    appointment_id: appointmentId,
    minutes_before: params.minutesBefore ?? null,
    custom_local: params.customLocal ?? null,
    notification_id: params.notificationId,
  });
  if (error) throw error;
}

export async function fetchAppointmentReminders(appointmentId: string) {
  const { data, error } = await supabase
    .from('appointment_reminders')
    .select('*')
    .eq('appointment_id', appointmentId);
  if (error) throw error;
  return data;
}

export async function deleteAppointmentReminder(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('appointment_reminders')
    .delete()
    .eq('id', id)
    .select('notification_id')
    .single();
  if (error) throw error;
  return data.notification_id;
}
