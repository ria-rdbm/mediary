import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, typography, spacing } from '@/theme';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton, SecondaryButton } from './Button';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Shown in a soft puck beside the title. */
  icon?: keyof typeof Ionicons.glyphMap;
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
  icon,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <BottomSheet visible={visible} onClose={onCancel} maxHeight="60%">
      <View style={styles.container}>
        <View style={styles.titleRow}>
          {icon && (
            <View style={[styles.iconPuck, destructive && { backgroundColor: colors.errorSoft }]}>
              <Ionicons name={icon} size={18} color={destructive ? colors.error : colors.accent} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconPuck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.sectionTitle,
    fontFamily: fonts.semibold,
    flexShrink: 1,
  },
  message: {
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    marginBottom: spacing.xs,
  },
});
