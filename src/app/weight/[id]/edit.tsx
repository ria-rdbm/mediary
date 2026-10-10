import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { spacing } from '@/theme';
import { useWeightRecords, useUpdateWeightRecord, useDeleteWeightRecord } from '@/hooks/useWeight';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { combineDateAndTime } from '@/lib/dateTime';

export default function EditWeightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: records, isLoading } = useWeightRecords();
  const updateWeight = useUpdateWeightRecord(id);
  const deleteWeight = useDeleteWeightRecord();
  const { guard } = useWriteGuard();

  const record = records?.find((r) => r.id === id);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [recordedAt, setRecordedAt] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (record && loadedId !== record.id) {
    setLoadedId(record.id);
    setWeight(record.weightKg.toFixed(1));
    setNote(record.note ?? '');
    setRecordedAt(new Date(record.recordedLocal));
  }

  if (isLoading || !record) {
    return (
      <Screen>
        <Header title="Edit Weight" />
        <LoadingState />
      </Screen>
    );
  }

  const handleSave = async () => {
    if (!guard()) return;
    setSaving(true);
    try {
      const weightKg = Number(weight);
      await updateWeight.mutateAsync({ weightKg, recordedAt, note: note || null });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Header title="Edit Weight" rightLabel="Delete" onRightPress={() => setDeleteVisible(true)} />
      <Input label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" required />
      <DatePickerField label="Date" value={recordedAt} onChange={(d) => setRecordedAt(combineDateAndTime(d, recordedAt))} maximumDate={new Date()} />
      <TimePickerField label="Time" value={recordedAt} onChange={(t) => setRecordedAt(combineDateAndTime(recordedAt, t))} />
      <Input label="Note (optional)" value={note} onChangeText={setNote} />
      <PrimaryButton label="Save changes" onPress={handleSave} loading={saving} style={styles.saveButton} />

      <ConfirmationDialog
        visible={deleteVisible}
        title="Delete this weight record?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!guard()) {
            setDeleteVisible(false);
            return;
          }
          await deleteWeight.mutateAsync(id);
          setDeleteVisible(false);
          router.back();
        }}
        onCancel={() => setDeleteVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  saveButton: { marginTop: spacing.sm, marginBottom: spacing.xl },
});
