import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, typography, spacing, radius } from '@/theme';

export interface TimelineTag {
  label: string;
  tone?: 'accent' | 'teal' | 'neutral';
}

interface TimelineRowProps {
  time: string;
  title: string;
  subtitle?: string;
  /** Shown as small pills under the title in place of the subtitle. */
  tags?: TimelineTag[];
  icon: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  iconBackground?: string;
  onPress?: () => void;
  isLast?: boolean;
}

const TAG_TONES = {
  accent: { bg: colors.accentSoft, fg: colors.accentStrong },
  teal: { bg: colors.secondaryAccentSoft, fg: colors.secondaryAccent },
  neutral: { bg: colors.surfaceSecondary, fg: colors.textSecondary },
} as const;

export function TimelineRow({
  time,
  title,
  subtitle,
  tags,
  icon,
  accentColor,
  iconBackground,
  onPress,
  isLast,
}: TimelineRowProps) {
  const iconColor = accentColor ?? colors.accent;
  // "7:00 PM" stacks as "7:00" over "PM", right-aligned against the rail
  const [clock, meridiem] = time.split(' ');

  const content = (
    <>
      <View style={styles.timeColumn}>
        <Text style={styles.time}>{clock}</Text>
        {meridiem && <Text style={styles.meridiem}>{meridiem}</Text>}
      </View>
      <View style={styles.railColumn}>
        <View style={[styles.iconCircle, iconBackground ? { backgroundColor: iconBackground } : null]}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
        {!isLast && <View style={styles.rail} />}
      </View>
      <View style={styles.card}>
        <View style={styles.cardText}>
          <Text style={typography.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          {tags?.length ? (
            <View style={styles.tags}>
              {tags.map((tag, i) => {
                const tone = TAG_TONES[tag.tone ?? 'neutral'];
                return (
                  <View key={`${tag.label}-${i}`} style={[styles.tag, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.tagLabel, { color: tone.fg }]} numberOfLines={1}>
                      {tag.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            subtitle && (
              <Text style={[typography.caption, styles.subtitle]} numberOfLines={2}>
                {subtitle}
              </Text>
            )
          )}
        </View>
        {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      </View>
    </>
  );

  // View doesn't accept a style function, so only the Pressable gets one.
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 48,
    paddingTop: 14,
    paddingRight: spacing.xs,
    alignItems: 'flex-end',
  },
  time: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textPrimary,
  },
  meridiem: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textMuted,
  },
  railColumn: {
    alignItems: 'center',
    width: 32,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: spacing.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.divider,
    marginTop: spacing.xxs,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  cardText: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  tagLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
