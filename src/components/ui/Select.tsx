import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/theme';
import { BottomSheet } from './BottomSheet';
import { fieldStyles } from './fieldStyles';

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
  /** Optional leading icon, shown in a white puck inside the field. */
  icon?: keyof typeof Ionicons.glyphMap;
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
  icon,
  containerStyle,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[fieldStyles.container, containerStyle]}>
      {label && (
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.required}> *</Text>}
        </Text>
      )}
      <Pressable style={fieldStyles.field} onPress={() => setOpen(true)} accessibilityRole="button">
        {icon && (
          <View style={fieldStyles.iconPuck}>
            <Ionicons name={icon} size={16} color={colors.accent} />
          </View>
        )}
        <Text style={selected ? fieldStyles.value : fieldStyles.placeholder} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textPrimary} />
      </Pressable>
      {helperText && <Text style={fieldStyles.helperText}>{helperText}</Text>}

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
  sheetTitle: {
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerSoft,
  },
});
