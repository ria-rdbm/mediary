import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton } from '@/components/ui/Button';
import { typography, spacing, colors } from '@/theme';
import { useCreateWeightRecord } from '@/hooks/useWeight';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { combineDateAndTime, initialDateTimeForDateKey } from '@/lib/dateTime';

export default function NewWeightScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const createWeight = useCreateWeightRecord();
  const { guard } = useWriteGuard();

  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [recordedAt, setRecordedAt] = useState(initialDateTimeForDateKey(date));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!guard()) return;
    const value = Number(weight);
    if (!value || value <= 0) {
      setError('Please enter a weight.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createWeight.mutateAsync({ weightKg: value, recordedAt, note: note || null });
      router.replace('/weight');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Header title="Add Weight" />
      <Input label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" autoFocus required />
      <DatePickerField label="Date" value={recordedAt} onChange={(d) => setRecordedAt(combineDateAndTime(d, recordedAt))} maximumDate={new Date()} />
      <TimePickerField label="Time" value={recordedAt} onChange={(t) => setRecordedAt(combineDateAndTime(recordedAt, t))} />
      <Input label="Note (optional)" value={note} onChangeText={setNote} />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Save" onPress={handleSave} loading={saving} style={styles.saveButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.caption, color: colors.error, marginBottom: spacing.sm, textAlign: 'center' },
  saveButton: { marginTop: spacing.sm, marginBottom: spacing.xl },
});
