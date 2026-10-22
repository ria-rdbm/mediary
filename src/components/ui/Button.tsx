import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing, touchTarget, controlHeight } from '@/theme';

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
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={disabled ? colors.disabledText : colors.textOnAccent}
              style={styles.icon}
            />
          )}
          <Text style={[styles.primaryLabel, disabled && styles.disabledLabel]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  icon,
  tone = 'soft',
}: BaseButtonProps & { tone?: 'soft' | 'outline' }) {
  const fg = tone === 'outline' ? colors.textPrimary : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        tone === 'outline' ? styles.outline : styles.secondary,
        (disabled || loading) && styles.disabledSecondary,
        pressed && !disabled && !loading && styles.pressedSecondary,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} style={styles.icon} />}
          <Text style={[styles.secondaryLabel, { color: fg }, disabled && styles.disabledLabel]}>{label}</Text>
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
}: Omit<BaseButtonProps, 'loading' | 'icon'> & { tone?: 'default' | 'muted' | 'destructive' }) {
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
          tone === 'muted' && { color: colors.textPrimary, fontFamily: fonts.medium },
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
    minHeight: controlHeight.button,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  primaryLabel: {
    color: colors.textOnAccent,
    fontFamily: fonts.semibold,
    fontSize: 17,
  },
  secondary: {
    backgroundColor: colors.accentSoft,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  secondaryLabel: {
    color: colors.accent,
    fontFamily: fonts.semibold,
    fontSize: 17,
  },
  disabled: {
    backgroundColor: colors.disabled,
  },
  disabledSecondary: {
    backgroundColor: colors.disabled,
  },
  disabledLabel: {
    color: colors.disabledText,
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
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  iconButton: {
    minHeight: touchTarget.minHeight,
    minWidth: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
