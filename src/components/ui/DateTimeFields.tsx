import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, type ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './Button';
import { formatLocalDate, formatLocalTime, captureLocalDateTime } from '@/lib/dateTime';

interface FieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  required?: boolean;
  containerStyle?: ViewStyle;
  /** When set, shown (muted) instead of the date — for optional, still-empty fields. */
  placeholder?: string;
}

function displayValue(date: Date, mode: 'date' | 'time'): string {
  const local = captureLocalDateTime(date).local;
  return mode === 'date' ? formatLocalDate(local) : formatLocalTime(local);
}

function Field({
  label,
  value,
  mode,
  icon,
  onChange,
  maximumDate,
  required,
  containerStyle,
  placeholder,
}: FieldProps & { mode: 'date' | 'time'; icon: keyof typeof Ionicons.glyphMap }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        maximumDate,
        onValueChange: (_, date) => onChange(date),
      });
    } else {
      setDraft(value);
      setSheetOpen(true);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <Pressable style={styles.field} onPress={openPicker} accessibilityRole="button">
        <Ionicons name={icon} size={18} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
        <Text style={placeholder ? [typography.body, { color: colors.textMuted }] : typography.body}>
          {placeholder ?? displayValue(value, mode)}
        </Text>
      </Pressable>

      {Platform.OS === 'ios' && (
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} maxHeight="50%">
          <Text style={[typography.sectionTitle, { marginBottom: spacing.sm }]}>{label}</Text>
          <DateTimePicker
            value={draft}
            mode={mode}
            display="spinner"
            maximumDate={maximumDate}
            onValueChange={(_, date) => setDraft(date)}
          />
          <PrimaryButton
            label="Done"
            onPress={() => {
              onChange(draft);
              setSheetOpen(false);
            }}
            style={{ marginTop: spacing.sm }}
          />
        </BottomSheet>
      )}
    </View>
  );
}

export function DatePickerField(props: FieldProps) {
  return <Field {...props} mode="date" icon="calendar-outline" />;
}

export function TimePickerField(props: FieldProps) {
  return <Field {...props} mode="time" icon="time-outline" />;
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
});
