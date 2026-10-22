import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, touchTarget } from '@/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Ionicon shown in a soft-blue puck — the standard leading for settings-style rows. */
  icon?: keyof typeof Ionicons.glyphMap;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Short value shown before the chevron, e.g. "60 kg". */
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  /** Draws the hairline separating this row from the one above it. */
  divider?: boolean;
}

export function ListRow({
  title,
  subtitle,
  icon,
  leading,
  trailing,
  value,
  onPress,
  showChevron,
  destructive,
  divider,
}: ListRowProps) {
  const iconTint = destructive ? colors.error : colors.accent;
  const rowStyle = [styles.row, divider && styles.divider];
  const content = (
    <>
      {icon ? (
        <View style={[styles.iconPuck, destructive && { backgroundColor: colors.errorSoft }]}>
          <Ionicons name={icon} size={18} color={iconTint} />
        </View>
      ) : (
        leading && <View style={styles.leading}>{leading}</View>
      )}
      <View style={styles.textContainer}>
        <Text style={[typography.body, destructive && { color: colors.error }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[typography.caption, styles.subtitle]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {value && <Text style={styles.value}>{value}</Text>}
      {trailing}
      {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </>
  );

  // View doesn't accept a style function, so only the Pressable gets one.
  return onPress ? (
    <Pressable
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  ) : (
    <View style={rowStyle}>{content}</View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: spacing.xs,
    gap: 14,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.dividerSoft,
  },
  pressed: {
    opacity: 0.6,
  },
  iconPuck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leading: {
    minWidth: 32,
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  value: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  },
});
