import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, fonts, typography, spacing, touchTarget } from '@/theme';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightLabel?: string;
  onRightPress?: () => void;
  rightDisabled?: boolean;
}

export function Header({ title, onBack, showBack = true, rightLabel, onRightPress, rightDisabled }: HeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack ?? (() => router.back())}
            hitSlop={8}
            style={styles.backButton}
          >
            <Ionicons name="arrow-undo-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>
      {title ? (
        <Text style={[typography.headerTitle, styles.title]} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      <View style={[styles.side, styles.rightSide]}>
        {rightLabel && (
          <Pressable
            accessibilityRole="button"
            onPress={onRightPress}
            disabled={rightDisabled}
            hitSlop={8}
          >
            <Text
              style={[
                typography.body,
                { color: rightDisabled ? colors.disabledText : colors.textLink, fontFamily: fonts.semibold },
              ]}
            >
              {rightLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.md,
  },
  side: {
    minWidth: 44,
    minHeight: touchTarget.minHeight,
    justifyContent: 'center',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  backButton: {
    minHeight: touchTarget.minHeight,
    minWidth: 44,
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
