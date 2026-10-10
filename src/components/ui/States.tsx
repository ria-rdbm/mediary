import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { PrimaryButton, TextButton } from './Button';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} />
      <Text style={[typography.bodySecondary, styles.spacedText]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon = 'leaf-outline',
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={26} color={colors.accentStrong} />
      </View>
      <Text style={[typography.cardTitle, styles.spacedText]}>{title}</Text>
      {message && <Text style={[typography.bodySecondary, styles.message]}>{message}</Text>}
      {actionLabel && onAction && (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: colors.errorSoft }]}>
        <Ionicons name="alert-circle-outline" size={26} color={colors.error} />
      </View>
      <Text style={[typography.cardTitle, styles.spacedText]}>{title}</Text>
      <Text style={[typography.bodySecondary, styles.message]}>{message}</Text>
      {onRetry && <TextButton label="Try again" onPress={onRetry} style={styles.action} />}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  spacedText: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: spacing.xxs,
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.lg,
  },
});
