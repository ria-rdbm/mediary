import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { LiquidCard } from '@/components/ui/LiquidCard';
import { InitialAvatar } from '@/components/ui/InitialAvatar';
import { colors, fonts, typography, spacing } from '@/theme';
import { useMedication } from '@/hooks/useMedications';
import { useRemindersForMedication, useUpsertMedicationReminder, useDeleteMedicationReminder } from '@/hooks/useReminders';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { requestNotificationPermission, scheduleLocalNotification, cancelLocalNotification, combineDateTime } from '@/lib/notifications';
import { captureLocalDateTime, combineDateAndTime, defaultRecordTime, formatLocalDate, formatLocalTime, parseDateKey, todayDateKey } from '@/lib/dateTime';

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
  const [error, setError] = useState<string | null>(null);
  const prefilled = useRef(false);

  useEffect(() => {
    if (prefilled.current || !existing) return;
    prefilled.current = true;
    const [h, m] = existing.reminderTime.split(':').map(Number);
    const t = new Date();
    t.setHours(h || 0, m || 0, 0, 0);
    setDate(parseDateKey(existing.reminderDate));
    setTime(t);
  }, [existing]);

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
    setError(null);
    const combined = combineDateAndTime(date, time);
    if (combined <= new Date()) {
      setError('Pick a date and time in the future.');
      return;
    }
    setSaving(true);
    try {
      const dateKey = `${combined.getFullYear()}-${String(combined.getMonth() + 1).padStart(2, '0')}-${String(combined.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

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

      // Only after the new reminder is saved: drop the previous one.
      if (existing) {
        if (existing.notificationId) await cancelLocalNotification(existing.notificationId);
        if (existing.reminderDate !== dateKey) await deleteReminder.mutateAsync(existing.id);
      }
      router.back();
    } catch {
      setError('Could not save the reminder. Please try again.');
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
      <LiquidCard style={styles.hero}>
        <View style={styles.heroTop}>
          <InitialAvatar name={medication.name} size={42} tone="onAccent" />
          <Text style={styles.heroName} numberOfLines={1}>
            {medication.name}
          </Text>
        </View>
        <View>
          <Text style={styles.heroTime}>{formatLocalTime(captureLocalDateTime(combineDateAndTime(date, time)).local)}</Text>
          <Text style={styles.heroDate}>{formatLocalDate(captureLocalDateTime(date).local)}</Text>
        </View>
      </LiquidCard>
      <Text style={[typography.bodySecondary, styles.subtitle]}>
        Set a single reminder for {medication.name}. This does not calculate your next dose.
      </Text>

      <DatePickerField label="Date" value={date} onChange={setDate} />
      <TimePickerField label="Time" value={time} onChange={setTime} />

      {error && <Text style={[typography.bodySecondary, styles.error]}>{error}</Text>}
      <PrimaryButton label={existing ? 'Update Reminder' : 'Set Reminder'} onPress={handleSave} loading={saving} style={styles.saveButton} />
      {existing && <TextButton label="Remove reminder" tone="destructive" onPress={handleRemove} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 160, justifyContent: 'space-between', marginTop: spacing.xs },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroName: { flex: 1, fontFamily: fonts.semibold, fontSize: 17, color: colors.textOnAccent },
  heroTime: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, letterSpacing: -0.8, color: colors.textOnAccent },
  heroDate: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  subtitle: { marginTop: 18, marginBottom: spacing.md, marginHorizontal: spacing.xxs, color: colors.textSecondary },
  error: { color: colors.error, marginTop: spacing.sm },
  saveButton: { marginTop: spacing.sm, marginBottom: spacing.xs },
});
