import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { LoadingState } from '@/components/ui/States';
import { SymptomForm, defaultSymptomFormValues } from '@/components/composed/SymptomForm';
import { useMedications } from '@/hooks/useMedications';
import { useCreateSymptom } from '@/hooks/useSymptoms';
import { useWriteGuard } from '@/hooks/useWriteGuard';

export default function NewSymptomScreen() {
  const { data: medications, isLoading } = useMedications();
  const createSymptom = useCreateSymptom();
  const { guard } = useWriteGuard();

  if (isLoading || !medications) {
    return (
      <Screen>
        <Header title="Add Symptom" />
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header title="Add Symptom" />
      <SymptomForm
        medications={medications}
        initial={defaultSymptomFormValues()}
        submitLabel="Save"
        onSubmit={async (values) => {
          if (!guard()) return;
          await createSymptom.mutateAsync({
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
    </Screen>
  );
}
