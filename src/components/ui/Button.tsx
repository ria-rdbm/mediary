import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, touchTarget } from '@/theme';

interface BaseButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function PrimaryButton({ label, onPress, disabled, loading, style, icon }: BaseButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnAccent} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={colors.textOnAccent} style={styles.icon} />}
          <Text style={styles.primaryLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, loading, style, icon }: BaseButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles.secondary,
        (disabled || loading) && styles.disabledSecondary,
        pressed && !disabled && !loading && styles.pressedSecondary,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.accentStrong} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={colors.accentStrong} style={styles.icon} />}
          <Text style={styles.secondaryLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function TextButton({
  label,
  onPress,
  disabled,
  style,
  tone = 'default',
}: Omit<BaseButtonProps, 'loading' | 'icon'> & { tone?: 'default' | 'destructive' }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.textButton, pressed && { opacity: 0.6 }, style]}
      hitSlop={6}
    >
      <Text
        style={[
          styles.textButtonLabel,
          tone === 'destructive' && { color: colors.error },
          disabled && { color: colors.disabledText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 22,
  tone = 'default',
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  tone?: 'default' | 'muted' | 'destructive';
  disabled?: boolean;
}) {
  const color =
    tone === 'destructive' ? colors.error : tone === 'muted' ? colors.textMuted : colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
      hitSlop={6}
    >
      <Ionicons name={icon} size={size} color={disabled ? colors.disabledText : color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget.minHeight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  primaryLabel: {
    color: colors.textOnAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentSoftBorder,
  },
  secondaryLabel: {
    color: colors.accentStrong,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    backgroundColor: colors.disabled,
  },
  disabledSecondary: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.divider,
  },
  pressed: {
    opacity: 0.85,
  },
  pressedSecondary: {
    opacity: 0.7,
  },
  icon: {
    marginRight: spacing.xs,
  },
  textButton: {
    minHeight: touchTarget.minHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  textButtonLabel: {
    color: colors.textLink,
    fontSize: 15,
    fontWeight: '600',
  },
  iconButton: {
    minHeight: touchTarget.minHeight,
    minWidth: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
