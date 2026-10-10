import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { PrimaryButton } from '@/components/ui/Button';
import { typography, spacing, colors } from '@/theme';

interface ManualAdjustmentSheetProps {
  visible: boolean;
  onClose: () => void;
  recordedStock: number;
  stockUnit: string;
  onSubmit: (actualStock: number) => Promise<void>;
  submitting?: boolean;
}

export function ManualAdjustmentSheet({
  visible,
  onClose,
  recordedStock,
  stockUnit,
  onSubmit,
  submitting,
}: ManualAdjustmentSheetProps) {
  const [actual, setActual] = useState(String(recordedStock));

  const diff = actual ? Number(actual) - recordedStock : 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="60%">
      <Text style={typography.sectionTitle}>Adjust stock</Text>
      <View style={styles.row}>
        <Text style={typography.bodySecondary}>Recorded stock</Text>
        <Text style={typography.body}>
          {recordedStock} {stockUnit}
        </Text>
      </View>
      <Input
        label="Actual stock"
        value={actual}
        onChangeText={setActual}
        keyboardType="decimal-pad"
        autoFocus
      />
      {actual !== '' && diff !== 0 && (
        <Text style={styles.diffText}>
          {diff > 0 ? '+' : ''}
          {diff} {stockUnit}
        </Text>
      )}
      <PrimaryButton
        label="Save Adjustment"
        onPress={async () => {
          await onSubmit(Number(actual));
          onClose();
        }}
        disabled={actual === '' || Number(actual) < 0}
        loading={submitting}
        style={styles.submitButton}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  diffText: {
    ...typography.caption,
    color: colors.accentStrong,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});
