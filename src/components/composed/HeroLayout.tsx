import React, { useCallback } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { colors, radius, spacing } from '@/theme';

/**
 * Blue gradient hero that runs edge-to-edge under the status bar. Pair it
 * with <HeroSheet>, which overlaps its bottom edge as a white rounded sheet.
 */
export function HeroHeader({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();

  // The bar's own text has to flip to light while a hero screen is focused,
  // and back to the app-wide dark when it isn't.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  return (
    <LinearGradient
      colors={[colors.heroTop, colors.heroBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + spacing.xs }, style]}
    >
      {/* Soft highlight in the top-right corner, as in the brand concept */}
      <View pointerEvents="none" style={styles.glow} />
      {children}
    </LinearGradient>
  );
}

export function HeroSheet({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sheet, style]}>
      <View style={styles.handle} />
      {children}
    </View>
  );
}

const SHEET_OVERLAP = radius.sheet;

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22,
    paddingBottom: SHEET_OVERLAP + spacing.lg,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -120,
    top: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  sheet: {
    flexGrow: 1,
    marginTop: -SHEET_OVERLAP,
    paddingTop: spacing.lg,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  handle: {
    position: 'absolute',
    top: 9,
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.dividerStrong,
  },
});
