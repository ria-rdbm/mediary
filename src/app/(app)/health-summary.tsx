import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { colors, typography, spacing, radius } from '@/theme';
import { useMedications } from '@/hooks/useMedications';
import { CATEGORY_ICONS, CATEGORY_DEFAULT_COLOR_INDEX } from '@/constants/categories';
import { todayDateKey } from '@/lib/dateTime';

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

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const dateRange = useMemo(() => {
    const endDateKey = todayDateKey();
    const startDateKey = period === 'custom' ? periodToStartDateKey('3m') : periodToStartDateKey(period);
    return { startDateKey, endDateKey };
  }, [period]);

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
    <Screen scroll>
      <Text style={[typography.screenTitle, styles.title]}>Health Summary</Text>
      <Text style={[typography.bodySecondary, styles.subtitle]}>
        Choose what to include, then view a clean summary you can show your healthcare professional.
      </Text>

      <Text style={styles.sectionLabel}>Medication / Treatment</Text>
      {isLoading ? (
        <LoadingState />
      ) : !medications?.length ? (
        <EmptyState icon="document-text-outline" title="No medications yet" message="Add a medication first." />
      ) : (
        <View style={styles.medList}>
          {medications.map((medication) => {
            const active = selectedIds.includes(medication.id);
            const accentColor =
              medication.color ?? colors.medicationPalette[CATEGORY_DEFAULT_COLOR_INDEX[medication.category]];
            return (
              <Pressable
                key={medication.id}
                style={[styles.medRow, active && styles.medRowActive]}
                onPress={() => toggle(medication.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${accentColor}22` }]}>
                  <Ionicons name={CATEGORY_ICONS[medication.category]} size={16} color={accentColor} />
                </View>
                <Text style={typography.body}>{medication.name}</Text>
                {active && <Ionicons name="checkmark-circle" size={18} color={colors.accent} style={styles.check} />}
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionLabel}>Period</Text>
      <View style={styles.periodList}>
        {PERIOD_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.periodChip, period === option.value && styles.periodChipActive]}
            onPress={() => setPeriod(option.value)}
          >
            <Text style={[styles.periodLabel, period === option.value && styles.periodLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.toggleRow}>
        <Toggle label="Include weight trend" value={includeWeight} onValueChange={setIncludeWeight} />
      </View>

      <PrimaryButton
        label="View Health Summary"
        onPress={handleView}
        disabled={selectedIds.length === 0}
        style={styles.viewButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm },
  subtitle: { marginTop: spacing.xxs, marginBottom: spacing.lg },
  sectionLabel: {
    ...typography.bodySecondary,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  medList: { gap: spacing.xs },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  medRowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { marginLeft: 'auto' },
  periodList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  periodChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  periodChipActive: {
    backgroundColor: colors.accent,
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodLabelActive: {
    color: colors.textOnAccent,
  },
  toggleRow: {
    marginTop: spacing.md,
  },
  viewButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
