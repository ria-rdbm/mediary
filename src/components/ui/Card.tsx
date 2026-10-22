import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, elevation } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
  /** Soft sky wash fading to white — for a screen's featured card. */
  tinted?: boolean;
}

export function Card({ children, style, padded = true, elevated = false, tinted = false }: CardProps) {
  const cardStyle = [styles.base, padded && styles.padded, elevated && elevation.card, style];
  if (tinted) {
    return (
      <LinearGradient colors={['#EEF8FF', colors.surface]} locations={[0, 0.46]} style={cardStyle}>
        {children}
      </LinearGradient>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  padded: {
    padding: spacing.md,
  },
});
