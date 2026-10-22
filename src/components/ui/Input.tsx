import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/theme';
import { fieldStyles } from './fieldStyles';

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  /** Optional leading icon, shown in a white puck inside the field. */
  icon?: keyof typeof Ionicons.glyphMap;
  rightAccessory?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  helperText,
  errorText,
  required,
  icon,
  rightAccessory,
  style,
  containerStyle,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[fieldStyles.container, containerStyle]}>
      {label && (
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.required}> *</Text>}
        </Text>
      )}
      <View
        style={[
          fieldStyles.field,
          multiline && fieldStyles.fieldMultiline,
          focused && fieldStyles.fieldFocused,
          errorText && fieldStyles.fieldError,
        ]}
      >
        {icon && (
          <View style={fieldStyles.iconPuck}>
            <Ionicons name={icon} size={16} color={colors.accent} />
          </View>
        )}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline, style]}
          placeholderTextColor={colors.textPlaceholder}
          multiline={multiline}
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
        <Text style={fieldStyles.errorText}>{errorText}</Text>
      ) : helperText ? (
        <Text style={fieldStyles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    // No lineHeight: on iOS it shifts single-line TextInput text off-centre.
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: typography.body.color,
    flex: 1,
    minHeight: 44,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 66,
    textAlignVertical: 'top',
  },
});
