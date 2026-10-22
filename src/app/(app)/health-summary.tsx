import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { DatePickerField } from '@/components/ui/DateTimeFields';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { Chip } from '@/components/ui/Chip';
import { HeroHeader, HeroSheet } from '@/components/composed/HeroLayout';
import { colors, typography, spacing } from '@/theme';
import { useMedications } from '@/hooks/useMedications';
import { STATUS_LABELS } from '@/constants/categories';
import { InitialAvatar } from '@/components/ui/InitialAvatar';
import { parseDateKey, todayDateKey } from '@/lib/dateTime';

type Period = '30d' | '3m' | '6m' | 'custom';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '30d', label: 'Last 30 days' },
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: 'custom', label: 'Custom' },
];

function periodToStartDateKey(period: Period): string {
  const now = new Date();
  const months = period === '30d' ? 0 : period === '3m' ? 3 : period === '6m' ? 6 : 1;
  if (period === '30d') {
    now.setDate(now.getDate() - 30);
  } else {
    now.setMonth(now.getMonth() - months);
  }
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function HealthSummarySelectionScreen() {
  const { data: medications, isLoading } = useMedications();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [includeWeight, setIncludeWeight] = useState(true);
  const [customStart, setCustomStart] = useState(() => parseDateKey(periodToStartDateKey('3m')));
  const [customEnd, setCustomEnd] = useState(() => new Date());

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const dateRange = useMemo(() => {
    if (period === 'custom') {
      return { startDateKey: todayDateKey(customStart), endDateKey: todayDateKey(customEnd) };
    }
    return { startDateKey: periodToStartDateKey(period), endDateKey: todayDateKey() };
  }, [period, customStart, customEnd]);
  const invalidRange = dateRange.startDateKey > dateRange.endDateKey;

  const handleView = () => {
    router.push({
      pathname: '/health-summary-view',
      params: {
        medicationIds: selectedIds.join(','),
        startDateKey: dateRange.startDateKey,
        endDateKey: dateRange.endDateKey,
        includeWeight: includeWeight ? '1' : '0',
      },
    });
  };

  return (
    <Screen scroll padded={false} edges={[]} tinted={false} aboveTabBar>
      <HeroHeader>
        <Text style={styles.title}>Summary</Text>
        <Text style={styles.subtitle}>
          Choose what to include, then view a clean summary you can show your healthcare professional.
        </Text>
      </HeroHeader>

      <HeroSheet>

      <Text style={styles.sectionLabel}>Medication / Treatment</Text>
      {isLoading ? (
        <LoadingState />
      ) : !medications?.length ? (
        <EmptyState icon="document-text-outline" title="No medications yet" message="Add a medication first." />
      ) : (
        <View style={styles.medList}>
          {medications.map((medication) => {
            const active = selectedIds.includes(medication.id);
            return (
              <Pressable
                key={medication.id}
                style={[styles.medRow, active && styles.medRowActive]}
                onPress={() => toggle(medication.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
              >
                <InitialAvatar name={medication.name} size={40} />
                <View style={styles.medName}>
                  <Text style={typography.cardTitle} numberOfLines={1}>
                    {medication.name}
                  </Text>
                  <Text style={typography.caption}>{STATUS_LABELS[medication.status]}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <Ionicons name="checkmark" size={14} color={colors.textOnAccent} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionLabel}>Period</Text>
      <View style={styles.periodList}>
        {PERIOD_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={period === option.value}
            onPress={() => setPeriod(option.value)}
          />
        ))}
      </View>

      {period === 'custom' && (
        <View style={styles.customRow}>
          <DatePickerField label="From" value={customStart} onChange={setCustomStart} maximumDate={new Date()} containerStyle={styles.customField} />
          <DatePickerField label="To" value={customEnd} onChange={setCustomEnd} maximumDate={new Date()} containerStyle={styles.customField} />
        </View>
      )}
      {invalidRange && <Text style={styles.rangeError}>The start date must be before the end date.</Text>}

      <View style={styles.toggleRow}>
        <Toggle label="Include weight trend" value={includeWeight} onValueChange={setIncludeWeight} />
      </View>

      {selectedIds.length === 0 && (
        <Text style={styles.hint}>Choose at least one medication or treatment above.</Text>
      )}

      <PrimaryButton
        label="View Summary"
        onPress={handleView}
        disabled={selectedIds.length === 0 || invalidRange}
        style={styles.viewButton}
      />
      </HeroSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.display,
    color: colors.textOnAccent,
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.bodySecondary,
    color: 'rgba(255,255,255,0.82)',
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  customRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  customField: { flex: 1 },
  rangeError: { ...typography.bodySecondary, color: colors.error, marginTop: spacing.xs },
  medList: { gap: spacing.xs },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  medRowActive: {
    borderColor: colors.accentBright,
    borderWidth: 1.5,
    backgroundColor: colors.lightBackground,
  },
  medName: { flex: 1 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.dividerStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  periodList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  toggleRow: {
    marginTop: spacing.md,
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  viewButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
