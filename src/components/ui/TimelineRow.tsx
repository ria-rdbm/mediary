import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';

interface TimelineRowProps {
  time: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  onPress?: () => void;
  isLast?: boolean;
}

export function TimelineRow({ time, title, subtitle, icon, accentColor, onPress, isLast }: TimelineRowProps) {
  const dotColor = accentColor ?? colors.accent;
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => [styles.row, onPress && pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.time}>{time}</Text>
      <View style={styles.railColumn}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {!isLast && <View style={styles.rail} />}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={15} color={dotColor} style={{ marginRight: 6 }} />
          <Text style={typography.body} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {subtitle && (
          <Text style={typography.caption} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingBottom: spacing.md,
  },
  time: {
    ...typography.metadata,
    width: 56,
    paddingTop: 2,
  },
  railColumn: {
    alignItems: 'center',
    width: 16,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 5,
  },
  rail: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.divider,
    marginTop: 2,
  },
  content: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingTop: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
