import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { RecordForm } from '@/components/composed/RecordForm';
import { useMedications } from '@/hooks/useMedications';
import { useTreatmentRecord, useUpdateTreatmentRecord, useDeleteTreatmentRecord } from '@/hooks/useTreatmentRecords';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import type { InjectionSite } from '@/constants/units';

export default function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: medications, isLoading: medicationsLoading } = useMedications();
  const { data: record, isLoading: recordLoading, isError } = useTreatmentRecord(id);
  const updateRecord = useUpdateTreatmentRecord(id);
  const deleteRecord = useDeleteTreatmentRecord(record?.medicationId ?? '');
  const { guard } = useWriteGuard();
  const [deleteVisible, setDeleteVisible] = useState(false);

  if (medicationsLoading || recordLoading || !medications) {
    return (
      <Screen>
        <Header title="Edit Record" />
        <LoadingState />
      </Screen>
    );
  }

  if (isError || !record) {
    return (
      <Screen>
        <Header title="Edit Record" />
        <ErrorState />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header title="Edit Record" rightLabel="Delete" onRightPress={() => setDeleteVisible(true)} />
      <RecordForm
        medications={medications}
        initial={{
          medicationId: record.medicationId,
          taken: record.taken,
          occurredAt: new Date(record.occurredLocal),
          amount: record.amount != null ? String(record.amount) : '',
          amountUnit: record.amountUnit,
          amountUnitCustom: record.amountUnitCustom ?? '',
          site: record.site as InjectionSite | null,
          siteCustom: record.siteCustom ?? '',
          treatmentArea: record.treatmentArea ?? '',
          notes: record.notes ?? '',
        }}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          if (!guard()) throw new Error('read-only');
          const medication = medications.find((m) => m.id === values.medicationId);
          const result = await updateRecord.mutateAsync({
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
            stockUsed: values.taken ? medication?.stockUsedPerInjection ?? record.stockUsed : null,
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

      <ConfirmationDialog
        visible={deleteVisible}
        title="Delete this record?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!guard()) {
            setDeleteVisible(false);
            return;
          }
          await deleteRecord.mutateAsync(record.id);
          setDeleteVisible(false);
          router.back();
        }}
        onCancel={() => setDeleteVisible(false)}
      />
    </Screen>
  );
}
