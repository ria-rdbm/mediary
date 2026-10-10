import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '@/theme';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton, SecondaryButton } from './Button';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <BottomSheet visible={visible} onClose={onCancel} maxHeight="60%">
      <View style={styles.container}>
        <Text style={typography.sectionTitle}>{title}</Text>
        {message && <Text style={[typography.bodySecondary, styles.message]}>{message}</Text>}
        <View style={styles.actions}>
          <PrimaryButton
            label={confirmLabel}
            onPress={onConfirm}
            style={destructive ? styles.destructiveButton : undefined}
          />
          <SecondaryButton label={cancelLabel} onPress={onCancel} style={styles.cancelButton} />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  message: {
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  destructiveButton: {
    backgroundColor: '#B5584A',
  },
  cancelButton: {
    marginBottom: spacing.xs,
  },
});
