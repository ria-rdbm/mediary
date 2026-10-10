import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, typography, spacing, radius } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  rightAccessory?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  helperText,
  errorText,
  required,
  rightAccessory,
  style,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          errorText && styles.inputRowError,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightAccessory}
      </View>
      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.sm,
  },
  inputRowFocused: {
    borderColor: colors.accent,
  },
  inputRowError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 44,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xxs,
  },
});
