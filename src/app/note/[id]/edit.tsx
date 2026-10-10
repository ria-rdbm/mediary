import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { spacing } from '@/theme';
import { useMedications } from '@/hooks/useMedications';
import { useNotes, useUpdateNote, useDeleteNote } from '@/hooks/useNotes';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { combineDateAndTime } from '@/lib/dateTime';

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: medications, isLoading: medicationsLoading } = useMedications();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const updateNote = useUpdateNote(id);
  const deleteNote = useDeleteNote();
  const { guard } = useWriteGuard();

  const existingNote = notes?.find((n) => n.id === id);
  const [note, setNote] = useState('');
  const [medicationId, setMedicationId] = useState<string | null>(null);
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (existingNote && loadedId !== existingNote.id) {
    setLoadedId(existingNote.id);
    setNote(existingNote.note);
    setMedicationId(existingNote.medicationId);
    setOccurredAt(new Date(existingNote.occurredLocal));
  }

  if (medicationsLoading || notesLoading || !medications || !existingNote) {
    return (
      <Screen>
        <Header title="Edit Note" />
        <LoadingState />
      </Screen>
    );
  }

  const handleSave = async () => {
    if (!guard() || !note.trim()) return;
    setSaving(true);
    try {
      await updateNote.mutateAsync({ note, occurredAt, medicationId });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Header title="Edit Note" rightLabel="Delete" onRightPress={() => setDeleteVisible(true)} />
      <Input label="Note" value={note} onChangeText={setNote} multiline numberOfLines={4} required />
      <Select
        label="Related medication / treatment (optional)"
        placeholder="None"
        value={medicationId}
        options={medications.map((m) => ({ value: m.id, label: m.name }))}
        onChange={setMedicationId}
      />
      <DatePickerField label="Date" value={occurredAt} onChange={(d) => setOccurredAt(combineDateAndTime(d, occurredAt))} maximumDate={new Date()} />
      <TimePickerField label="Time" value={occurredAt} onChange={(t) => setOccurredAt(combineDateAndTime(occurredAt, t))} />
      <PrimaryButton label="Save changes" onPress={handleSave} loading={saving} disabled={!note.trim()} style={{ marginTop: spacing.sm, marginBottom: spacing.xl }} />

      <ConfirmationDialog
        visible={deleteVisible}
        title="Delete this note?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!guard()) {
            setDeleteVisible(false);
            return;
          }
          await deleteNote.mutateAsync(id);
          setDeleteVisible(false);
          router.back();
        }}
        onCancel={() => setDeleteVisible(false)}
      />
    </Screen>
  );
}
