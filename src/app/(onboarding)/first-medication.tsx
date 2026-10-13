import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { AmountUnitField } from '@/components/composed/AmountUnitField';
import { colors, typography, spacing } from '@/theme';
import { CATEGORY_LABELS } from '@/constants/categories';
import type { MedicationCategory } from '@/constants/categories';
import type { DoseUnit } from '@/constants/units';
import { useCreateMedication } from '@/hooks/useMedications';
import { useCompleteOnboarding } from '@/hooks/useProfile';
import { upsertMedicationReminder } from '@/services/reminders';
import { useAuth } from '@/context/AuthProvider';
import { requestNotificationPermission, scheduleLocalNotification, combineDateTime } from '@/lib/notifications';
import { combineDateAndTime, defaultRecordTime, todayDateKey } from '@/lib/dateTime';

export default function FirstMedicationScreen() {
  const { categories } = useLocalSearchParams<{ categories: string }>();
  const categoryList = (categories?.split(',').filter(Boolean) ?? []) as MedicationCategory[];

  const [name, setName] = useState('');
  const [category, setCategory] = useState<MedicationCategory | null>(categoryList[0] ?? null);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<DoseUnit | null>(null);
  const [customUnit, setCustomUnit] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date());
  const [reminderTime, setReminderTime] = useState(defaultRecordTime());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { userId } = useAuth();
  const createMedication = useCreateMedication();
  const completeOnboarding = useCompleteOnboarding();

  const handleFinish = async () => {
    if (!name.trim() || !category) {
      setError('Please enter a name and choose a category.');
      return;
    }
    if (reminderEnabled && combineDateAndTime(reminderDate, reminderTime) <= new Date()) {
      setError('Pick a reminder date and time in the future.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const medication = await createMedication.mutateAsync({
        name,
        category,
        defaultAmount: amount ? Number(amount) : null,
        defaultAmountUnit: unit,
        defaultAmountUnitCustom: customUnit,
      });

      if (reminderEnabled) {
        const granted = await requestNotificationPermission();
        const reminderDateTime = combineDateAndTime(reminderDate, reminderTime);
        const dateKey = todayDateKey(reminderDateTime);
        const timeStr = `${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`;
        let notificationId: string | null = null;
        if (granted) {
          notificationId = await scheduleLocalNotification({
            title: medication.name,
            body: 'Time to log your injection or treatment.',
            date: combineDateTime(dateKey, timeStr),
            data: { kind: 'medication_reminder', medicationId: medication.id, reminderDate: dateKey },
          });
        }
        await upsertMedicationReminder(userId!, medication.id, dateKey, timeStr, notificationId);
      }

      await completeOnboarding.mutateAsync(categoryList);
      router.replace('/(app)/home');
    } catch (err) {
      console.warn(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={[typography.screenTitle, styles.title]}>Add your first medication</Text>
      <Text style={[typography.bodySecondary, styles.subtitle]}>
        You can add stock, reminders, and more detail later.
      </Text>

      <Input label="Name" placeholder="e.g. Ozempic, Insulin, Botox" value={name} onChangeText={setName} required />

      <Select
        label="Category"
        value={category}
        options={(categoryList.length ? categoryList : (Object.keys(CATEGORY_LABELS) as MedicationCategory[])).map(
          (c) => ({ value: c, label: CATEGORY_LABELS[c] }),
        )}
        onChange={setCategory}
        required
      />

      <Text style={styles.sectionLabel}>Default amount (optional)</Text>
      <AmountUnitField
        amount={amount}
        onAmountChange={setAmount}
        unit={unit}
        onUnitChange={setUnit}
        customUnit={customUnit}
        onCustomUnitChange={setCustomUnit}
      />

      <View style={styles.reminderSection}>
        <Toggle label="Set a reminder" description="Optional — you can add this later" value={reminderEnabled} onValueChange={setReminderEnabled} />
        {reminderEnabled && (
          <View style={styles.reminderFields}>
            <DatePickerField label="Date" value={reminderDate} onChange={setReminderDate} />
            <TimePickerField label="Time" value={reminderTime} onChange={setReminderTime} />
          </View>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label="Finish setup" onPress={handleFinish} loading={saving} style={styles.finishButton} />
      <TextButton label="Skip for now" onPress={() => router.replace('/(app)/home')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg },
  subtitle: { marginTop: spacing.xxs, marginBottom: spacing.lg },
  sectionLabel: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  reminderSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  reminderFields: {
    marginTop: spacing.xs,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  finishButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});
