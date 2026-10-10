import React from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, description, value, onValueChange, disabled }: ToggleProps) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={spacing.xs}
    >
      <View style={styles.textContainer}>
        <Text style={[typography.body, disabled && { color: colors.disabledText }]}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        trackColor={{ false: colors.divider, true: colors.accent }}
        thumbColor={colors.surface}
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
  textContainer: {
    flex: 1,
  },
  description: {
    ...typography.caption,
    marginTop: 2,
  },
});
