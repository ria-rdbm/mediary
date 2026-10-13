import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { LoadingState } from '@/components/ui/States';
import { RecordForm, defaultRecordFormValues } from '@/components/composed/RecordForm';
import { useMedications } from '@/hooks/useMedications';
import { useLogTreatmentRecord } from '@/hooks/useTreatmentRecords';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { initialDateTimeForDateKey } from '@/lib/dateTime';

export default function NewRecordScreen() {
  const { medicationId, date } = useLocalSearchParams<{ medicationId?: string; date?: string }>();
  const { data: medications, isLoading } = useMedications(['active', 'paused']);
  const logRecord = useLogTreatmentRecord();
  const { guard } = useWriteGuard();

  if (isLoading || !medications) {
    return (
      <Screen>
        <Header title="Log Treatment" />
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header title="Log Treatment" />
      <RecordForm
        medications={medications}
        initial={defaultRecordFormValues(
          medicationId,
          medications.find((m) => m.id === medicationId),
          initialDateTimeForDateKey(date),
        )}
        submitLabel="Save"
        onSubmit={async (values) => {
          if (!guard()) throw new Error('read-only');
          const medication = medications.find((m) => m.id === values.medicationId);
          const result = await logRecord.mutateAsync({
            medicationId: values.medicationId,
            taken: values.taken,
            occurredAt: values.occurredAt,
            amount: values.amount ? Number(values.amount) : null,
            amountUnit: values.amountUnit,
            amountUnitCustom: values.amountUnitCustom || null,
            site: values.site,
            siteCustom: values.siteCustom || null,
            treatmentArea: values.treatmentArea || null,
            notes: values.notes || null,
            // A configured default is applied silently; otherwise RecordForm
            // will prompt "Update stock?" after saving (section 29).
            stockUsed: values.taken ? medication?.stockUsedPerInjection ?? null : null,
          });
          return {
            recordId: result.record.id,
            medicationId: result.record.medicationId,
            stockDeducted: result.stockDeducted,
            stockShortfall: result.stockShortfall,
          };
        }}
        onSubmitted={() => router.back()}
      />
    </Screen>
  );
}
