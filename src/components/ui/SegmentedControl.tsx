import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface SegmentedControlProps<T extends string> {
  segments: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            style={[styles.segment, active && styles.activeSegment]}
            onPress={() => onChange(segment.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  activeSegment: {
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeLabel: {
    color: colors.textPrimary,
  },
});
