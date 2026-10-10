import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, touchTarget } from '@/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

export function ListRow({ title, subtitle, leading, trailing, onPress, showChevron, destructive }: ListRowProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      style={({ pressed }: { pressed?: boolean }) => [styles.row, onPress && pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.textContainer}>
        <Text style={[typography.body, destructive && { color: colors.error }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={typography.caption} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.minHeight,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  leading: {
    width: 32,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
});
