import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PrimaryButton } from '@/components/ui/Button';
import { AmountUnitField } from '@/components/composed/AmountUnitField';
import { colors, typography, spacing } from '@/theme';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@/constants/categories';
import type { MedicationCategory } from '@/constants/categories';
import type { DoseUnit } from '@/constants/units';
import { useCreateMedication } from '@/hooks/useMedications';
import { useWriteGuard } from '@/hooks/useWriteGuard';

export default function NewMedicationScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MedicationCategory | null>(null);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<DoseUnit | null>(null);
  const [customUnit, setCustomUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMedication = useCreateMedication();
  const { guard } = useWriteGuard();

  const handleSave = async () => {
    if (!guard()) return;
    if (!name.trim() || !category) {
      setError('Please enter a name and choose a category.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const medication = await createMedication.mutateAsync({
        name,
        category,
        defaultAmount: amount ? Number(amount) : null,
        defaultAmountUnit: unit,
      });
      router.replace(`/medication/${medication.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Header title="Add Medication" />
      <Input label="Name" placeholder="e.g. Ozempic, Insulin, Botox" value={name} onChangeText={setName} required />
      <Select
        label="Category"
        value={category}
        options={ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
        onChange={setCategory}
        required
      />
      <Text style={styles.sectionLabel}>Default amount (optional)</Text>
      <AmountUnitField
        amount={amount}
        onAmountChange={setAmount}
        unit={unit}
        onUnitChange={setUnit}
        customUnit={customUnit}
        onCustomUnitChange={setCustomUnit}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Save" onPress={handleSave} loading={saving} style={styles.saveButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
