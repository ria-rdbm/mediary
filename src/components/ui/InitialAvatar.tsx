import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/theme';

interface InitialAvatarProps {
  name: string;
  size?: number;
  /** 'onAccent' for use on blue surfaces; 'muted' for not-yet-added items. */
  tone?: 'default' | 'onAccent' | 'muted';
}

/** Dashed circle with a medication's first letter, as used across the brand concept. */
export function InitialAvatar({ name, size = 36, tone = 'default' }: InitialAvatarProps) {
  const palette = {
    default: { border: '#9DB6E8', bg: colors.lightBackground, fg: '#2F5BE0' },
    onAccent: { border: 'rgba(255,255,255,0.7)', bg: colors.onAccentSoft, fg: colors.textOnAccent },
    muted: { border: colors.dividerStrong, bg: '#F8FAFC', fg: colors.textMuted },
  }[tone];

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, borderColor: palette.border, backgroundColor: palette.bg },
      ]}
    >
      <Text style={[styles.letter, { color: palette.fg, fontSize: Math.round(size * 0.36) }]}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: fonts.semibold,
  },
});
