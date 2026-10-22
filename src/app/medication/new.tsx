import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { InitialAvatar } from '@/components/ui/InitialAvatar';
import { Select } from '@/components/ui/Select';
import { PrimaryButton } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { AmountUnitField } from '@/components/composed/AmountUnitField';
import { ColorSwatchPicker } from '@/components/composed/ColorSwatchPicker';
import { colors, fonts, typography, spacing } from '@/theme';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@/constants/categories';
import type { MedicationCategory } from '@/constants/categories';
import type { DoseUnit } from '@/constants/units';
import { useCreateMedication } from '@/hooks/useMedications';
import { useProviders } from '@/hooks/useProviders';
import { useWriteGuard } from '@/hooks/useWriteGuard';

// Name shortcuts only — picking one fills the name and category, never a dose.
const QUICK_PICKS: { name: string; category: MedicationCategory }[] = [
  { name: 'Wegovy', category: 'glp1' },
  { name: 'Ozempic', category: 'glp1' },
  { name: 'Mounjaro', category: 'glp1' },
];

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
      <Input
        label="Name"
        icon="create-outline"
        placeholder="e.g. Wegovy, Insulin, Botox"
        value={name}
        onChangeText={setName}
        required
        containerStyle={styles.nameField}
      />
      <View style={styles.quickPicks}>
        {QUICK_PICKS.map((pick) => (
          <Pressable
            key={pick.name}
            accessibilityRole="button"
            onPress={() => {
              setName(pick.name);
              setCategory(pick.category);
            }}
            style={({ pressed }) => [styles.quickPick, name === pick.name && styles.quickPickOn, pressed && { opacity: 0.7 }]}
          >
            <InitialAvatar name={pick.name} size={26} />
            <Text style={styles.quickPickLabel}>{pick.name}</Text>
          </Pressable>
        ))}
      </View>
      <Select
        label="Category"
        icon="pricetag-outline"
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
      <Section title="Colour" spacingTop="md" variant="label">
        <ColorSwatchPicker value={color} onChange={setColor} />
      </Section>
      <Section title="Default provider / clinic (optional)" spacingTop="md" variant="label">
        <Select
          value={defaultProviderId}
          placeholder="None"
          icon="business-outline"
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
    ...typography.label,
    marginBottom: spacing.xs,
    marginLeft: spacing.xxs,
  },
  nameField: { marginBottom: spacing.sm },
  quickPicks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  quickPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  quickPickOn: { borderColor: colors.accentBright, backgroundColor: colors.lightBackground },
  quickPickLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textPrimary },
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
