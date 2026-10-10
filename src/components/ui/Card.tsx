import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing, elevation } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ children, style, padded = true, elevated = false }: CardProps) {
  return (
    <View style={[styles.base, padded && styles.padded, elevated && elevation.card, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  padded: {
    padding: spacing.md,
  },
});
