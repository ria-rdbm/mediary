import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { typography, spacing } from '@/theme';

interface UpdateStockPromptProps {
  visible: boolean;
  stockUnit: string;
  onSkip: () => void;
  onSubmit: (amount: number, rememberAsDefault: boolean) => void;
  submitting?: boolean;
}

export function UpdateStockPrompt({ visible, stockUnit, onSkip, onSubmit, submitting }: UpdateStockPromptProps) {
  const [amount, setAmount] = useState('');
  const [remember, setRemember] = useState(true);

  return (
    <BottomSheet visible={visible} onClose={onSkip} maxHeight="55%">
      <Text style={typography.sectionTitle}>Update stock?</Text>
      <Text style={[typography.bodySecondary, styles.body]}>How much stock was used for this injection?</Text>
      <Input
        placeholder={`Amount (${stockUnit})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        autoFocus
      />
      <Toggle label="Use this amount for future injections" value={remember} onValueChange={setRemember} />
      <View style={styles.actions}>
        <PrimaryButton
          label="Update Stock"
          onPress={() => onSubmit(Number(amount), remember)}
          disabled={!amount || Number(amount) <= 0}
          loading={submitting}
        />
        <TextButton label="Skip" onPress={onSkip} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { marginBottom: spacing.sm },
  actions: { marginTop: spacing.sm, gap: spacing.xs, marginBottom: spacing.sm },
});
