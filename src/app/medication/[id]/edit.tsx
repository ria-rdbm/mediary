import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Section } from '@/components/ui/Section';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { PrimaryButton } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { AmountUnitField } from '@/components/composed/AmountUnitField';
import type { DoseUnit } from '@/constants/units';
import { colors, spacing } from '@/theme';
import { useMedication, useUpdateMedication } from '@/hooks/useMedications';
import { useProviders } from '@/hooks/useProviders';
import { useWriteGuard } from '@/hooks/useWriteGuard';

export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: medication, isLoading } = useMedication(id);
  const { data: providers } = useProviders();
  const updateMedication = useUpdateMedication(id);
  const { guard } = useWriteGuard();

  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [defaultProviderId, setDefaultProviderId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<DoseUnit | null>(null);
  const [customUnit, setCustomUnit] = useState('');
  const [autoDeduct, setAutoDeduct] = useState(true);
  const [stockUsed, setStockUsed] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [saving, setSaving] = useState(false);

  // Seed the editable fields once the medication loads. Adjusting state
  // directly during render (guarded by `loadedId`) rather than in an effect
  // avoids an extra render pass — see https://react.dev/learn/you-might-not-need-an-effect
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (medication && loadedId !== medication.id) {
    setLoadedId(medication.id);
    setName(medication.name);
    setColor(medication.color);
    setDefaultProviderId(medication.defaultProviderId);
    setAmount(medication.defaultAmount != null ? String(medication.defaultAmount) : '');
    setUnit(medication.defaultAmountUnit);
    setCustomUnit(medication.defaultAmountUnitCustom ?? '');
    setAutoDeduct(medication.autoDeductStock);
    setStockUsed(medication.stockUsedPerInjection != null ? String(medication.stockUsedPerInjection) : '');
    setLowStockThreshold(medication.lowStockThreshold != null ? String(medication.lowStockThreshold) : '');
  }

  if (isLoading || !medication) {
    return (
      <Screen>
        <Header title="Edit Medication" />
        <LoadingState />
      </Screen>
    );
  }

  const handleSave = async () => {
    if (!guard()) return;
    setSaving(true);
    try {
      await updateMedication.mutateAsync({
        name,
        color,
        defaultProviderId,
        defaultAmount: amount ? Number(amount) : null,
        defaultAmountUnit: unit,
        defaultAmountUnitCustom: unit === 'Other' ? customUnit.trim() || null : null,
        autoDeductStock: autoDeduct,
        stockUsedPerInjection: stockUsed ? Number(stockUsed) : null,
        lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Header title="Edit Medication" />

      <Input label="Name" value={name} onChangeText={setName} required />

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

      <Section title="Default amount (optional)" spacingTop="md">
        <AmountUnitField
          amount={amount}
          onAmountChange={setAmount}
          unit={unit}
          onUnitChange={setUnit}
          customUnit={customUnit}
          onCustomUnitChange={setCustomUnit}
        />
      </Section>

      <Section title="Default provider / clinic" spacingTop="md">
        <Select
          value={defaultProviderId}
          placeholder="None"
          options={(providers ?? []).map((p) => ({ value: p.id, label: p.name }))}
          onChange={setDefaultProviderId}
        />
      </Section>

      <Section title="Stock" spacingTop="md">
        <Toggle
          label="Auto-deduct stock"
          description="Taken records reduce stock automatically"
          value={autoDeduct}
          onValueChange={setAutoDeduct}
        />
        <Input
          label="Stock used per injection (optional)"
          helperText="Used to auto-fill future Taken records"
          value={stockUsed}
          onChangeText={setStockUsed}
          keyboardType="decimal-pad"
        />
        <Input
          label="Low stock threshold (optional)"
          helperText="We'll show a reminder when stock falls to or below this amount"
          value={lowStockThreshold}
          onChangeText={setLowStockThreshold}
          keyboardType="decimal-pad"
        />
      </Section>

      <PrimaryButton label="Save" onPress={handleSave} loading={saving} style={styles.saveButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
