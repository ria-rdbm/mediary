import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme';
import { BottomSheet } from './BottomSheet';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  helperText?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
}

export function Select<T extends string>({
  label,
  placeholder = 'Select',
  value,
  options,
  onChange,
  helperText,
  required,
  containerStyle,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <Pressable style={styles.field} onPress={() => setOpen(true)} accessibilityRole="button">
        <Text style={[typography.body, !selected && { color: colors.textMuted }]}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {helperText && <Text style={styles.helperText}>{helperText}</Text>}

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text style={[typography.sectionTitle, styles.sheetTitle]}>{label ?? placeholder}</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              style={styles.option}
              onPress={() => {
                onChange(item.value);
                setOpen(false);
              }}
            >
              <Text style={typography.body}>{item.label}</Text>
              {item.value === value && <Ionicons name="checkmark" size={20} color={colors.accent} />}
            </Pressable>
          )}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  sheetTitle: {
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
