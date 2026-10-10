import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { colors, typography, spacing } from '@/theme';
import { useMedication } from '@/hooks/useMedications';
import { useRemindersForMedication, useUpsertMedicationReminder, useDeleteMedicationReminder } from '@/hooks/useReminders';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { requestNotificationPermission, scheduleLocalNotification, cancelLocalNotification, combineDateTime } from '@/lib/notifications';
import { combineDateAndTime, defaultRecordTime, todayDateKey } from '@/lib/dateTime';

export default function MedicationReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: medication, isLoading } = useMedication(id);
  const { data: reminders } = useRemindersForMedication(id);
  const upsertReminder = useUpsertMedicationReminder(id);
  const deleteReminder = useDeleteMedicationReminder(id);
  const { guard } = useWriteGuard();

  const existing = reminders?.find((r) => r.isActive && r.reminderDate >= todayDateKey());

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(defaultRecordTime());
  const [saving, setSaving] = useState(false);

  if (isLoading || !medication) {
    return (
      <Screen>
        <Header title="Reminder" />
        <LoadingState />
      </Screen>
    );
  }

  const handleSave = async () => {
    if (!guard()) return;
    setSaving(true);
    try {
      const combined = combineDateAndTime(date, time);
      const dateKey = `${combined.getFullYear()}-${String(combined.getMonth() + 1).padStart(2, '0')}-${String(combined.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

      if (existing?.notificationId) {
        await cancelLocalNotification(existing.notificationId);
      }

      let notificationId: string | null = null;
      const granted = await requestNotificationPermission();
      if (granted) {
        notificationId = await scheduleLocalNotification({
          title: medication.name,
          body: 'Time to log your injection or treatment.',
          date: combineDateTime(dateKey, timeStr),
          data: { kind: 'medication_reminder', medicationId: medication.id, reminderDate: dateKey },
        });
      }

      await upsertReminder.mutateAsync({ reminderDate: dateKey, reminderTime: timeStr, notificationId });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!guard() || !existing) return;
    const notificationId = await deleteReminder.mutateAsync(existing.id);
    await cancelLocalNotification(notificationId);
    router.back();
  };

  return (
    <Screen scroll>
      <Header title="Reminder" />
      <Text style={[typography.bodySecondary, styles.subtitle]}>
        Set a single reminder for {medication.name}. This does not calculate your next dose.
      </Text>

      <DatePickerField label="Date" value={date} onChange={setDate} />
      <TimePickerField label="Time" value={time} onChange={setTime} />

      <PrimaryButton label={existing ? 'Update Reminder' : 'Set Reminder'} onPress={handleSave} loading={saving} style={styles.saveButton} />
      {existing && <TextButton label="Remove reminder" tone="destructive" onPress={handleRemove} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginBottom: spacing.md, color: colors.textSecondary },
  saveButton: { marginTop: spacing.sm, marginBottom: spacing.xs },
});
