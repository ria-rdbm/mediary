import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PrimaryButton } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { AmountUnitField } from '@/components/composed/AmountUnitField';
import { colors, typography, spacing } from '@/theme';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@/constants/categories';
import type { MedicationCategory } from '@/constants/categories';
import type { DoseUnit } from '@/constants/units';
import { useCreateMedication } from '@/hooks/useMedications';
import { useProviders } from '@/hooks/useProviders';
import { useWriteGuard } from '@/hooks/useWriteGuard';

export default function NewMedicationScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MedicationCategory | null>(null);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<DoseUnit | null>(null);
  const [customUnit, setCustomUnit] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [defaultProviderId, setDefaultProviderId] = useState<string | null>(null);
  const { data: providers } = useProviders();
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
        color,
        defaultProviderId,
        defaultAmount: amount ? Number(amount) : null,
        defaultAmountUnit: unit,
        defaultAmountUnitCustom: customUnit,
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
      <Section title="Colour" spacingTop="md">
        <View style={styles.colorRow}>
          {colors.medicationPalette.map((paletteColor) => (
            <Pressable
              key={paletteColor}
              onPress={() => setColor(paletteColor)}
              style={[styles.colorSwatch, { backgroundColor: paletteColor }]}
            >
              {color === paletteColor && <Ionicons name="checkmark" size={16} color={colors.textOnAccent} />}
            </Pressable>
          ))}
        </View>
      </Section>
      <Section title="Default provider / clinic (optional)" spacingTop="md">
        <Select
          value={defaultProviderId}
          placeholder="None"
          options={(providers ?? []).map((p) => ({ value: p.id, label: p.name }))}
          onChange={setDefaultProviderId}
        />
      </Section>
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
  colorRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
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
