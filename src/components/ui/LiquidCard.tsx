import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';

/**
 * The brand's blue "liquid" card: a Mediary Blue → light blue gradient with a
 * soft highlight in the top-right corner. Content on it uses textOnAccent.
 */
export function LiquidCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={[colors.accent, '#3B82F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={[styles.card, style]}
    >
      <View pointerEvents="none" style={styles.highlight} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    padding: 18,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    right: -70,
    top: -90,
    width: 220,
    height: 200,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
});
