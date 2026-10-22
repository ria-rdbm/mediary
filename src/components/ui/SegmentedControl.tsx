import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '@/theme';

interface SegmentedControlProps<T extends string> {
  /** `dot` draws a small coloured marker before the label (e.g. severity). */
  segments: { value: T; label: string; dot?: string }[];
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
            <View style={styles.labelRow}>
              {segment.dot && <View style={[styles.dot, { backgroundColor: segment.dot }]} />}
              <Text style={[styles.label, active && styles.activeLabel]}>{segment.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  activeSegment: {
    backgroundColor: colors.surface,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  activeLabel: {
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
});
