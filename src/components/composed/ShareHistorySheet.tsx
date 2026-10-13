import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Share, Alert, StyleSheet } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DatePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton } from '@/components/ui/Button';
import { colors, typography, spacing, radius } from '@/theme';
import { parseDateKey, todayDateKey } from '@/lib/dateTime';
import { buildHistoryShareText } from '@/services/export';

type Period = '7d' | '30d' | '3m' | '6m' | 'custom';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: 'custom', label: 'Custom' },
];

function periodStartKey(period: Exclude<Period, 'custom'>): string {
  const d = new Date();
  if (period === '7d') d.setDate(d.getDate() - 7);
  else if (period === '30d') d.setDate(d.getDate() - 30);
  else d.setMonth(d.getMonth() - (period === '3m' ? 3 : 6));
  return todayDateKey(d);
}

export function ShareHistorySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [period, setPeriod] = useState<Period>('30d');
  const [customStart, setCustomStart] = useState(() => parseDateKey(periodStartKey('3m')));
  const [customEnd, setCustomEnd] = useState(() => new Date());
  const [busy, setBusy] = useState(false);

  const range = useMemo(
    () =>
      period === 'custom'
        ? { start: todayDateKey(customStart), end: todayDateKey(customEnd) }
        : { start: periodStartKey(period), end: todayDateKey() },
    [period, customStart, customEnd],
  );
  const invalidRange = range.start > range.end;

  const handleShare = async () => {
    setBusy(true);
    try {
      const { text, itemCount } = await buildHistoryShareText(range.start, range.end);
      if (itemCount === 0) {
        Alert.alert('Nothing to share', 'There are no records in this period.');
        return;
      }
      // Close first and let the modal finish dismissing: iOS can't present
      // the share sheet on top of (or while dismissing) another modal, and the
      // share promise stays pending while its sheet is open.
      onClose();
      setBusy(false);
      await new Promise((resolve) => setTimeout(resolve, 600));
      await Share.share({ message: text });
    } catch (err) {
      console.warn('Share failed', err);
      Alert.alert('Could not share', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="80%">
      <Text style={typography.sectionTitle}>Share history</Text>
      <Text style={styles.hint}>Sent as plain text to the app you choose. Stock changes are not included.</Text>
      <View style={styles.chips}>
        {PERIOD_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => setPeriod(option.value)}
            style={[styles.chip, period === option.value && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, period === option.value && styles.chipLabelActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      {period === 'custom' && (
        <View style={styles.customRow}>
          <DatePickerField label="From" value={customStart} onChange={setCustomStart} maximumDate={new Date()} containerStyle={styles.customField} />
          <DatePickerField label="To" value={customEnd} onChange={setCustomEnd} maximumDate={new Date()} containerStyle={styles.customField} />
        </View>
      )}
      {invalidRange && <Text style={styles.error}>The start date must be before the end date.</Text>}
      <PrimaryButton label="Share" onPress={handleShare} loading={busy} disabled={invalidRange} style={styles.button} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: { ...typography.caption, marginTop: spacing.xxs, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  chipActive: { backgroundColor: colors.accent },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipLabelActive: { color: colors.textOnAccent },
  customRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  customField: { flex: 1 },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.sm },
  button: { marginTop: spacing.lg, marginBottom: spacing.sm },
});
