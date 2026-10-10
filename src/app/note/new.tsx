import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { spacing } from '@/theme';
import { useMedications } from '@/hooks/useMedications';
import { useCreateNote } from '@/hooks/useNotes';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { combineDateAndTime, defaultRecordTime } from '@/lib/dateTime';

export default function NewNoteScreen() {
  const { medicationId } = useLocalSearchParams<{ medicationId?: string }>();
  const { data: medications, isLoading } = useMedications();
  const createNote = useCreateNote();
  const { guard } = useWriteGuard();

  const [note, setNote] = useState('');
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(medicationId ?? null);
  const [occurredAt, setOccurredAt] = useState(combineDateAndTime(new Date(), defaultRecordTime()));
  const [saving, setSaving] = useState(false);

  if (isLoading || !medications) {
    return (
      <Screen>
        <Header title="Add Note" />
        <LoadingState />
      </Screen>
    );
  }

  const handleSave = async () => {
    if (!guard() || !note.trim()) return;
    setSaving(true);
    try {
      await createNote.mutateAsync({ note, occurredAt, medicationId: selectedMedicationId });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Header title="Add Note" />
      <Input label="Note" value={note} onChangeText={setNote} multiline numberOfLines={4} autoFocus required />
      <Select
        label="Related medication / treatment (optional)"
        placeholder="None"
        value={selectedMedicationId}
        options={medications.map((m) => ({ value: m.id, label: m.name }))}
        onChange={setSelectedMedicationId}
      />
      <DatePickerField label="Date" value={occurredAt} onChange={(d) => setOccurredAt(combineDateAndTime(d, occurredAt))} maximumDate={new Date()} />
      <TimePickerField label="Time" value={occurredAt} onChange={(t) => setOccurredAt(combineDateAndTime(occurredAt, t))} />
      <PrimaryButton label="Save" onPress={handleSave} loading={saving} disabled={!note.trim()} style={{ marginTop: spacing.sm, marginBottom: spacing.xl }} />
    </Screen>
  );
}
