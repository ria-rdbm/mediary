import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { MedicationListItem } from '@/components/composed/MedicationListItem';
import { useMedications } from '@/hooks/useMedications';

export default function MedicationsScreen() {
  const { data: medications, isLoading } = useMedications();
  const openNew = () => router.push('/medication/new');

  return (
    <Screen scroll>
      <Header title="Medications" rightLabel="Add" onRightPress={openNew} />

      {isLoading ? (
        <LoadingState />
      ) : !medications?.length ? (
        <EmptyState
          icon="leaf-outline"
          title="No medications yet"
          message="Add a medication or treatment to start recording."
          actionLabel="Add medication"
          onAction={openNew}
        />
      ) : (
        medications.map((medication) => (
          <MedicationListItem
            key={medication.id}
            medication={medication}
            onPress={() => router.push(`/medication/${medication.id}`)}
          />
        ))
      )}
    </Screen>
  );
}
