import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DOSE_UNITS } from '@/constants/units';
import type { DoseUnit } from '@/constants/units';
import { spacing } from '@/theme';

interface AmountUnitFieldProps {
  amount: string;
  onAmountChange: (value: string) => void;
  unit: DoseUnit | null;
  onUnitChange: (unit: DoseUnit) => void;
  customUnit: string;
  onCustomUnitChange: (value: string) => void;
  label?: string;
}

export function AmountUnitField({
  amount,
  onAmountChange,
  unit,
  onUnitChange,
  customUnit,
  onCustomUnitChange,
  label = 'Amount',
}: AmountUnitFieldProps) {
  return (
    <View>
      <View style={styles.row}>
        <Input
          label={label}
          value={amount}
          onChangeText={onAmountChange}
          keyboardType="decimal-pad"
          placeholder="0"
          containerStyle={styles.amountInput}
        />
        <Select
          label="Unit"
          placeholder="Unit"
          value={unit}
          options={DOSE_UNITS.map((u) => ({ value: u, label: u }))}
          onChange={onUnitChange}
          containerStyle={styles.unitSelect}
        />
      </View>
      {unit === 'Other' && (
        <Input placeholder="Custom unit (e.g. clicks)" value={customUnit} onChangeText={onCustomUnitChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  amountInput: {
    flex: 1,
  },
  unitSelect: {
    width: 120,
  },
});
