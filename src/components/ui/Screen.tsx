import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, tabBarClearance } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Soft sky wash behind the top of the screen (the default brand backdrop). */
  tinted?: boolean;
  /** Tab screens: pads the scroll end so content clears the floating tab bar. */
  aboveTabBar?: boolean;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'bottom'],
  style,
  contentStyle,
  refreshing,
  onRefresh,
  tinted = true,
  aboveTabBar = false,
}: ScreenProps) {
  const content = (
    <View style={[styles.content, padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      {tinted && (
        <LinearGradient
          colors={[colors.backgroundTint, colors.background]}
          style={styles.tint}
          pointerEvents="none"
        />
      )}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, aboveTabBar && { paddingBottom: tabBarClearance }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
});
