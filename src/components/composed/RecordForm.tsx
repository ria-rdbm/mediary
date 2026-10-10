import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Select } from '@/components/ui/Select';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/Button';
import { AmountUnitField } from '@/components/composed/AmountUnitField';
import { SiteSelector } from '@/components/composed/SiteSelector';
import { UpdateStockPrompt } from '@/components/composed/UpdateStockPrompt';
import { colors, typography, spacing } from '@/theme';
import { combineDateAndTime, defaultRecordTime } from '@/lib/dateTime';
import { useRecordStockUsage } from '@/hooks/useTreatmentRecords';
import type { MedicationWithStock } from '@/types/domain';
import type { DoseUnit, InjectionSite } from '@/constants/units';

export interface RecordFormValues {
  medicationId: string;
  taken: boolean;
  occurredAt: Date;
  amount: string;
  amountUnit: DoseUnit | null;
  amountUnitCustom: string;
  site: InjectionSite | null;
  siteCustom: string;
  treatmentArea: string;
  notes: string;
}

interface SubmitResult {
  recordId: string;
  medicationId: string;
  stockDeducted: number;
  stockShortfall: number;
}

interface RecordFormProps {
  medications: MedicationWithStock[];
  initial: RecordFormValues;
  submitLabel: string;
  onSubmit: (values: RecordFormValues) => Promise<SubmitResult>;
  onSubmitted: () => void;
}

export function RecordForm({ medications, initial, submitLabel, onSubmit, onSubmitted }: RecordFormProps) {
  const [values, setValues] = useState<RecordFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockPrompt, setStockPrompt] = useState<{ recordId: string; medicationId: string; unit: string } | null>(
    null,
  );

  const medication = useMemo(
    () => medications.find((m) => m.id === values.medicationId) ?? null,
    [medications, values.medicationId],
  );

  const recordStockUsage = useRecordStockUsage(medication?.id ?? '');

  const update = <K extends keyof RecordFormValues>(key: K, value: RecordFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const selectMedication = (id: string) => {
    const next = medications.find((m) => m.id === id);
    update('medicationId', id);
    if (next) {
      update('amountUnit', next.lastAmountUnit ?? next.defaultAmountUnit ?? values.amountUnit);
      if (next.defaultAmount != null && !values.amount) {
        update('amount', String(next.defaultAmount));
      }
    }
  };

  const handleSubmit = async () => {
    if (!values.medicationId) {
      setError('Please choose a medication or treatment.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await onSubmit(values);

      if (result.stockShortfall > 0) {
        Alert.alert('Not enough stock recorded', 'This record was saved, but there was not enough stock on hand to fully cover it.');
      }

      const med = medications.find((m) => m.id === result.medicationId);
      const needsStockPrompt =
        values.taken &&
        med?.autoDeductStock &&
        med?.stockUnit &&
        med?.stockUsedPerInjection == null &&
        result.stockDeducted === 0 &&
        result.stockShortfall === 0;

      if (needsStockPrompt && med) {
        setStockPrompt({ recordId: result.recordId, medicationId: med.id, unit: med.stockUnit! });
      } else {
        onSubmitted();
      }
    } catch (err) {
      console.warn(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isCosmetic = medication?.category === 'cosmetic_treatment';

  return (
    <View>
      <Select
        label="Medication / Treatment"
        value={values.medicationId || null}
        options={medications.map((m) => ({ value: m.id, label: m.name }))}
        onChange={selectMedication}
        required
      />

      <View style={styles.segmentWrap}>
        <SegmentedControl
          segments={[
            { value: 'taken', label: 'Taken' },
            { value: 'not_taken', label: 'Not Taken' },
          ]}
          value={values.taken ? 'taken' : 'not_taken'}
          onChange={(v) => update('taken', v === 'taken')}
        />
      </View>

      <View style={styles.row}>
        <DatePickerField
          label="Date"
          value={values.occurredAt}
          onChange={(date) => update('occurredAt', combineDateAndTime(date, values.occurredAt))}
          maximumDate={new Date()}
          containerStyle={styles.rowField}
        />
        <TimePickerField
          label="Time"
          value={values.occurredAt}
          onChange={(time) => update('occurredAt', combineDateAndTime(values.occurredAt, time))}
          containerStyle={styles.rowField}
        />
      </View>

      {values.taken && (
        <>
          <AmountUnitField
            amount={values.amount}
            onAmountChange={(v) => update('amount', v)}
            unit={values.amountUnit}
            onUnitChange={(v) => update('amountUnit', v)}
            customUnit={values.amountUnitCustom}
            onCustomUnitChange={(v) => update('amountUnitCustom', v)}
          />

          {isCosmetic ? (
            <Input
              label="Treatment area (optional)"
              placeholder="e.g. Forehead lines"
              value={values.treatmentArea}
              onChangeText={(v) => update('treatmentArea', v)}
            />
          ) : (
            <SiteSelector
              value={values.site}
              onChange={(v) => update('site', v)}
              customValue={values.siteCustom}
              onCustomChange={(v) => update('siteCustom', v)}
            />
          )}
        </>
      )}

      <Input
        label="Notes (optional)"
        value={values.notes}
        onChangeText={(v) => update('notes', v)}
        multiline
        numberOfLines={3}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label={submitLabel} onPress={handleSubmit} loading={saving} style={styles.submitButton} />

      <UpdateStockPrompt
        visible={!!stockPrompt}
        stockUnit={stockPrompt?.unit ?? ''}
        submitting={recordStockUsage.isPending}
        onSkip={() => {
          setStockPrompt(null);
          onSubmitted();
        }}
        onSubmit={async (amount, remember) => {
          if (!stockPrompt) return;
          try {
            await recordStockUsage.mutateAsync({ recordId: stockPrompt.recordId, stockUsed: amount, rememberAsDefault: remember });
          } finally {
            setStockPrompt(null);
            onSubmitted();
          }
        }}
      />
    </View>
  );
}

export function defaultRecordFormValues(medicationId = ''): RecordFormValues {
  return {
    medicationId,
    taken: true,
    occurredAt: combineDateAndTime(new Date(), defaultRecordTime()),
    amount: '',
    amountUnit: null,
    amountUnitCustom: '',
    site: null,
    siteCustom: '',
    treatmentArea: '',
    notes: '',
  };
}

const styles = StyleSheet.create({
  segmentWrap: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowField: { flex: 1 },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
