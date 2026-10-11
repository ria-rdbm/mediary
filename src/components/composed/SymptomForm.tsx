import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Select } from '@/components/ui/Select';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton } from '@/components/ui/Button';
import { typography, spacing, colors } from '@/theme';
import { DEFAULT_SYMPTOMS, SEVERITY_LEVELS, SEVERITY_LABELS } from '@/constants/symptoms';
import type { SeverityLevel } from '@/constants/symptoms';
import { combineDateAndTime, defaultRecordTime } from '@/lib/dateTime';
import type { MedicationWithStock } from '@/types/domain';

export interface SymptomFormValues {
  name: string;
  isCustomName: boolean;
  severity: SeverityLevel;
  medicationId: string | null;
  startAt: Date;
  endAt: Date | null;
  isOngoing: boolean;
  notes: string;
}

export function defaultSymptomFormValues(startAt: Date = combineDateAndTime(new Date(), defaultRecordTime())): SymptomFormValues {
  return {
    name: '',
    isCustomName: false,
    severity: 'mild',
    medicationId: null,
    startAt,
    endAt: null,
    isOngoing: true,
    notes: '',
  };
}

export function SymptomForm({
  medications,
  initial,
  submitLabel,
  onSubmit,
}: {
  medications: MedicationWithStock[];
  initial: SymptomFormValues;
  submitLabel: string;
  onSubmit: (values: SymptomFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof SymptomFormValues>(key: K, value: SymptomFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({ ...values, endAt: values.isOngoing ? null : (values.endAt ?? values.startAt) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Select
        label="Symptom"
        value={values.isCustomName ? 'Other' : values.name || null}
        options={DEFAULT_SYMPTOMS.map((s) => ({ value: s, label: s }))}
        onChange={(v) => {
          update('isCustomName', v === 'Other');
          update('name', v === 'Other' ? '' : v);
        }}
        required
      />
      {values.isCustomName && (
        <Input placeholder="Describe the symptom" value={values.name} onChangeText={(v) => update('name', v)} />
      )}

      <Text style={styles.label}>Severity</Text>
      <SegmentedControl
        segments={SEVERITY_LEVELS.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))}
        value={values.severity}
        onChange={(v) => update('severity', v)}
      />

      <View style={{ marginTop: spacing.md }}>
        <Select
          label="Related medication / treatment (optional)"
          placeholder="None"
          value={values.medicationId}
          options={medications.map((m) => ({ value: m.id, label: m.name }))}
          onChange={(v) => update('medicationId', v)}
        />
      </View>

      <View style={styles.row}>
        <DatePickerField label="Start date" value={values.startAt} onChange={(d) => update('startAt', combineDateAndTime(d, values.startAt))} maximumDate={new Date()} containerStyle={styles.rowField} />
        <TimePickerField label="Start time" value={values.startAt} onChange={(t) => update('startAt', combineDateAndTime(values.startAt, t))} containerStyle={styles.rowField} />
      </View>

      <Toggle label="Ongoing" value={values.isOngoing} onValueChange={(v) => update('isOngoing', v)} />

      {!values.isOngoing && (
        <View style={styles.row}>
          <DatePickerField
            label="End date"
            value={values.endAt ?? values.startAt}
            onChange={(d) => update('endAt', combineDateAndTime(d, values.endAt ?? values.startAt))}
            maximumDate={new Date()}
            containerStyle={styles.rowField}
          />
          <TimePickerField
            label="End time"
            value={values.endAt ?? values.startAt}
            onChange={(t) => update('endAt', combineDateAndTime(values.endAt ?? values.startAt, t))}
            containerStyle={styles.rowField}
          />
        </View>
      )}

      <Input label="Notes (optional)" value={values.notes} onChangeText={(v) => update('notes', v)} multiline numberOfLines={3} />

      <PrimaryButton label={submitLabel} onPress={handleSubmit} loading={saving} disabled={!values.name.trim()} style={styles.submitButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  rowField: { flex: 1 },
  submitButton: { marginTop: spacing.lg, marginBottom: spacing.xl },
});
