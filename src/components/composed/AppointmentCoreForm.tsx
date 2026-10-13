import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton } from '@/components/ui/Button';
import { spacing } from '@/theme';
import { combineDateAndTime, defaultRecordTime } from '@/lib/dateTime';
import type { MedicationWithStock, Provider } from '@/types/domain';

export interface AppointmentFormValues {
  medicationId: string | null;
  providerId: string | null;
  providerNameSnapshot: string | null;
  visitAt: Date;
  providerInstructions: string;
  myNotes: string;
  treatmentChanges: string;
  nextAppointmentLocal: string;
}

export function defaultAppointmentFormValues(
  medicationId: string | null = null,
  visitAt: Date = combineDateAndTime(new Date(), defaultRecordTime()),
): AppointmentFormValues {
  return {
    medicationId,
    providerId: null,
    providerNameSnapshot: null,
    visitAt,
    providerInstructions: '',
    myNotes: '',
    treatmentChanges: '',
    nextAppointmentLocal: '',
  };
}

export function AppointmentCoreForm({
  medications,
  providers,
  initial,
  submitLabel,
  onSubmit,
}: {
  medications: MedicationWithStock[];
  providers: Provider[];
  initial: AppointmentFormValues;
  submitLabel: string;
  onSubmit: (values: AppointmentFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof AppointmentFormValues>(key: K, value: AppointmentFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <View style={styles.row}>
        <DatePickerField label="Date" value={values.visitAt} onChange={(d) => update('visitAt', combineDateAndTime(d, values.visitAt))} containerStyle={styles.rowField} />
        <TimePickerField label="Time" value={values.visitAt} onChange={(t) => update('visitAt', combineDateAndTime(values.visitAt, t))} containerStyle={styles.rowField} />
      </View>

      <Select
        label="Provider / Clinic (optional)"
        placeholder="None"
        value={values.providerId}
        options={providers.map((p) => ({ value: p.id, label: p.name }))}
        onChange={(id) => {
          const provider = providers.find((p) => p.id === id);
          update('providerId', id);
          update('providerNameSnapshot', provider?.name ?? null);
        }}
      />

      <Select
        label="Related medication / treatment (optional)"
        placeholder="None"
        value={values.medicationId}
        options={medications.map((m) => ({ value: m.id, label: m.name }))}
        onChange={(v) => update('medicationId', v)}
      />

      <Input
        label="Provider Instructions"
        helperText="What your provider told you — Mediary does not generate or interpret this."
        value={values.providerInstructions}
        onChangeText={(v) => update('providerInstructions', v)}
        multiline
        numberOfLines={3}
      />

      <Input label="My Notes (optional)" value={values.myNotes} onChangeText={(v) => update('myNotes', v)} multiline numberOfLines={3} />

      <Input
        label="Treatment / Medication Changes (optional)"
        value={values.treatmentChanges}
        onChangeText={(v) => update('treatmentChanges', v)}
        multiline
        numberOfLines={2}
      />

      <Input
        label="Next appointment (optional)"
        placeholder="e.g. In 3 months"
        value={values.nextAppointmentLocal}
        onChangeText={(v) => update('nextAppointmentLocal', v)}
      />

      <PrimaryButton label={submitLabel} onPress={handleSubmit} loading={saving} style={styles.submitButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  rowField: { flex: 1 },
  submitButton: { marginTop: spacing.md, marginBottom: spacing.lg },
});
