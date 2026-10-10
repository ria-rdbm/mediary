import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { LoadingState } from '@/components/ui/States';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { SymptomForm } from '@/components/composed/SymptomForm';
import { useMedications } from '@/hooks/useMedications';
import { useSymptoms, useUpdateSymptom, useDeleteSymptom } from '@/hooks/useSymptoms';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { DEFAULT_SYMPTOMS } from '@/constants/symptoms';

export default function EditSymptomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: medications, isLoading: medicationsLoading } = useMedications();
  const { data: symptoms, isLoading: symptomsLoading } = useSymptoms();
  const updateSymptom = useUpdateSymptom(id);
  const deleteSymptom = useDeleteSymptom();
  const { guard } = useWriteGuard();
  const [deleteVisible, setDeleteVisible] = useState(false);

  const symptom = symptoms?.find((s) => s.id === id);

  if (medicationsLoading || symptomsLoading || !medications || !symptom) {
    return (
      <Screen>
        <Header title="Edit Symptom" />
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header title="Edit Symptom" rightLabel="Delete" onRightPress={() => setDeleteVisible(true)} />
      <SymptomForm
        medications={medications}
        initial={{
          name: symptom.name,
          isCustomName: !(DEFAULT_SYMPTOMS as readonly string[]).includes(symptom.name),
          severity: symptom.severity,
          medicationId: symptom.medicationId,
          startAt: new Date(symptom.startLocal),
          endAt: symptom.endLocal ? new Date(symptom.endLocal) : null,
          isOngoing: symptom.isOngoing,
          notes: symptom.notes ?? '',
        }}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          if (!guard()) return;
          await updateSymptom.mutateAsync({
            name: values.name,
            severity: values.severity,
            medicationId: values.medicationId,
            startAt: values.startAt,
            endAt: values.isOngoing ? null : values.endAt,
            isOngoing: values.isOngoing,
            notes: values.notes || null,
          });
          router.back();
        }}
      />

      <ConfirmationDialog
        visible={deleteVisible}
        title="Delete this symptom?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!guard()) {
            setDeleteVisible(false);
            return;
          }
          await deleteSymptom.mutateAsync(id);
          setDeleteVisible(false);
          router.back();
        }}
        onCancel={() => setDeleteVisible(false)}
      />
    </Screen>
  );
}
