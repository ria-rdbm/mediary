import React from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  /** Optional leading icon in a soft-blue puck. */
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Toggle({ label, description, value, onValueChange, disabled, icon }: ToggleProps) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={spacing.xs}
    >
      {icon && (
        <View style={styles.iconPuck}>
          <Ionicons name={icon} size={17} color={colors.accent} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[typography.body, disabled && { color: colors.disabledText }]}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        trackColor={{ false: colors.dividerStrong, true: colors.accentBright }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.dividerStrong}
        pointerEvents="none"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  iconPuck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.xxs,
  },
  textContainer: {
    flex: 1,
  },
  description: {
    ...typography.caption,
    marginTop: 2,
  },
});
