import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import type { MedicationStatus } from '@/constants/categories';
import { STATUS_LABELS } from '@/constants/categories';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' | 'warning' | 'error' }) {
  const paletteMap = {
    neutral: { bg: colors.surfaceSecondary, fg: colors.textSecondary },
    accent: { bg: colors.accentSoft, fg: colors.accentStrong },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    error: { bg: colors.errorSoft, fg: colors.error },
  } as const;
  const palette = paletteMap[tone];

  return (
    <View style={[styles.base, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: MedicationStatus }) {
  const tone = status === 'active' ? 'accent' : status === 'paused' ? 'warning' : 'neutral';
  return <Badge label={STATUS_LABELS[status]} tone={tone} />;
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
