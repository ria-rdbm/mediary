import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { LoadingState } from '@/components/ui/States';
import { AppointmentCoreForm, defaultAppointmentFormValues } from '@/components/composed/AppointmentCoreForm';
import { useMedications } from '@/hooks/useMedications';
import { useProviders } from '@/hooks/useProviders';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { touchProviderLastUsed } from '@/services/providers';
import { useWriteGuard } from '@/hooks/useWriteGuard';

export default function NewAppointmentScreen() {
  const { medicationId } = useLocalSearchParams<{ medicationId?: string }>();
  const { data: medications, isLoading: medicationsLoading } = useMedications();
  const { data: providers, isLoading: providersLoading } = useProviders();
  const createAppointment = useCreateAppointment();
  const { guard } = useWriteGuard();

  if (medicationsLoading || providersLoading || !medications || !providers) {
    return (
      <Screen>
        <Header title="Add Appointment" />
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header title="Add Appointment" />
      <AppointmentCoreForm
        medications={medications}
        providers={providers}
        initial={defaultAppointmentFormValues(medicationId ?? null)}
        submitLabel="Save"
        onSubmit={async (values) => {
          if (!guard()) return;
          const appointment = await createAppointment.mutateAsync({
            medicationId: values.medicationId,
            providerId: values.providerId,
            providerNameSnapshot: values.providerNameSnapshot,
            visitAt: values.visitAt,
            providerInstructions: values.providerInstructions || null,
            myNotes: values.myNotes || null,
            treatmentChanges: values.treatmentChanges || null,
            nextAppointmentLocal: values.nextAppointmentLocal || null,
          });
          if (values.providerId) void touchProviderLastUsed(values.providerId);
          router.replace(`/appointment/${appointment.id}/edit`);
        }}
      />
    </Screen>
  );
}
