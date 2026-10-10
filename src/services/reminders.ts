import { supabase } from '@/lib/supabase';
import { mapMedicationReminder } from '@/lib/mappers';
import type { MedicationReminder } from '@/types/domain';

export async function fetchUpcomingMedicationReminders(fromDateKey: string): Promise<MedicationReminder[]> {
  const { data, error } = await supabase
    .from('medication_reminders')
    .select('*')
    .eq('is_active', true)
    .gte('reminder_date', fromDateKey)
    .order('reminder_date', { ascending: true });
  if (error) throw error;
  return data.map(mapMedicationReminder);
}

export async function fetchRemindersForMedication(medicationId: string): Promise<MedicationReminder[]> {
  const { data, error } = await supabase
    .from('medication_reminders')
    .select('*')
    .eq('medication_id', medicationId)
    .order('reminder_date', { ascending: true });
  if (error) throw error;
  return data.map(mapMedicationReminder);
}

export async function upsertMedicationReminder(
  userId: string,
  medicationId: string,
  reminderDate: string,
  reminderTime: string,
  notificationId: string | null,
): Promise<MedicationReminder> {
  const { data, error } = await supabase
    .from('medication_reminders')
    .upsert(
      {
        user_id: userId,
        medication_id: medicationId,
        reminder_date: reminderDate,
        reminder_time: reminderTime,
        is_active: true,
        notification_id: notificationId,
      },
      { onConflict: 'medication_id,reminder_date' },
    )
    .select()
    .single();
  if (error) throw error;
  return mapMedicationReminder(data);
}

export async function deactivateMedicationReminder(reminderId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('medication_reminders')
    .update({ is_active: false })
    .eq('id', reminderId)
    .select('notification_id')
    .single();
  if (error) throw error;
  return data.notification_id;
}

export async function deleteMedicationReminder(reminderId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('medication_reminders')
    .delete()
    .eq('id', reminderId)
    .select('notification_id')
    .single();
  if (error) throw error;
  return data.notification_id;
}
