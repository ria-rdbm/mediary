import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton } from '@/components/ui/Button';
import { colors, typography, spacing } from '@/theme';
import { GENDER_LABELS, ALL_GENDERS, isValidNhiNumber, type Gender } from '@/constants/profile';
import { todayDateKey, parseDateKey } from '@/lib/dateTime';
import type { ProfileDetailsInput } from '@/services/profile';

export interface ProfileDetailsInitialValues {
  fullName?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null; // "YYYY-MM-DD"
  weightKg?: number | null;
  nhiNumber?: string | null;
  preferredProviderName?: string | null;
}

interface ProfileDetailsFormProps {
  initial?: ProfileDetailsInitialValues;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: ProfileDetailsInput) => void | Promise<void>;
}

export function ProfileDetailsForm({ initial, submitLabel, submitting, onSubmit }: ProfileDetailsFormProps) {
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [gender, setGender] = useState<Gender | null>(initial?.gender ?? null);
  const [dateOfBirth, setDateOfBirth] = useState<Date>(
    initial?.dateOfBirth ? parseDateKey(initial.dateOfBirth) : new Date(2000, 0, 1),
  );
  const [weight, setWeight] = useState(initial?.weightKg ? String(initial.weightKg) : '');
  const [nhiNumber, setNhiNumber] = useState(initial?.nhiNumber ?? '');
  const [preferredProviderName, setPreferredProviderName] = useState(initial?.preferredProviderName ?? '');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = fullName.trim().length > 0 && !!gender;

  const handleSubmit = async () => {
    if (!canSubmit || !gender) return;

    const trimmedNhi = nhiNumber.trim();
    if (trimmedNhi && !isValidNhiNumber(trimmedNhi)) {
      setError('That NHI number doesn’t look right. It should be 3 letters followed by 4 characters (e.g. ABC1234).');
      return;
    }

    const weightValue = weight.trim() ? Number(weight) : null;
    if (weightValue !== null && (!Number.isFinite(weightValue) || weightValue <= 0)) {
      setError('Please enter a valid weight.');
      return;
    }

    setError(null);
    await onSubmit({
      fullName: fullName.trim(),
      gender,
      dateOfBirth: todayDateKey(dateOfBirth),
      weightKg: weightValue,
      nhiNumber: trimmedNhi ? trimmedNhi.toUpperCase() : null,
      preferredProviderName: preferredProviderName.trim() || null,
    });
  };

  return (
    <>
      <Input label="Full name" placeholder="e.g. Jane Smith" value={fullName} onChangeText={setFullName} required />

      <Select
        label="Gender"
        placeholder="Select gender"
        value={gender}
        options={ALL_GENDERS.map((g) => ({ value: g, label: GENDER_LABELS[g] }))}
        onChange={setGender}
        required
      />

      <DatePickerField
        label="Date of birth"
        value={dateOfBirth}
        onChange={setDateOfBirth}
        maximumDate={new Date()}
        required
      />

      <Text style={styles.sectionLabel}>Optional</Text>

      <Input
        label="Weight (kg)"
        placeholder="e.g. 70"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
      />

      <Input
        label="NHI number"
        placeholder="e.g. ABC1234"
        value={nhiNumber}
        onChangeText={setNhiNumber}
        autoCapitalize="characters"
        helperText="Your National Health Index number"
      />

      <Input
        label="Preferred medical provider"
        placeholder="e.g. Dr. Smith — Auckland Clinic"
        value={preferredProviderName}
        onChangeText={setPreferredProviderName}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton
        label={submitLabel}
        onPress={handleSubmit}
        disabled={!canSubmit}
        loading={submitting}
        style={styles.submitButton}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
