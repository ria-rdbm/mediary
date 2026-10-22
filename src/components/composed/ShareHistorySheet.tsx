import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Share, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DatePickerField } from '@/components/ui/DateTimeFields';
import { PrimaryButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { colors, fonts, typography, spacing } from '@/theme';
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
  const [mode, setMode] = useState<'image' | 'text'>('image');
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

  const openImagePreview = () => {
    const label = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? 'Summary';
    onClose();
    router.push({
      pathname: '/share-preview',
      params: { start: range.start, end: range.end, label: period === 'custom' ? 'Custom period' : label },
    });
  };

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
      <View style={styles.titleRow}>
        <View style={styles.titleIcon}>
          <Ionicons name="share-outline" size={18} color={colors.accent} />
        </View>
        <Text style={styles.title}>Share history</Text>
      </View>

      <SegmentedControl
        segments={[
          { value: 'image', label: 'Image' },
          { value: 'text', label: 'Text' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'image' ? (
        <Pressable
          accessibilityRole="button"
          onPress={openImagePreview}
          disabled={invalidRange}
          style={({ pressed }) => [styles.imageTile, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.thumb}>
            <View style={styles.thumbHeader} />
            <View style={styles.thumbTiles}>
              <View style={styles.thumbTile} />
              <View style={styles.thumbTile} />
              <View style={[styles.thumbTile, { backgroundColor: colors.successSoft }]} />
            </View>
            <View style={styles.thumbLine} />
            <View style={[styles.thumbLine, { width: '70%' }]} />
          </View>
          <View style={styles.imageTileText}>
            <Text style={typography.cardTitle}>Summary image</Text>
            <Text style={typography.caption}>Doses, weight trend and symptoms on one card. Ready to send or post.</Text>
            <Text style={styles.previewLink}>Preview ›</Text>
          </View>
        </Pressable>
      ) : null}
      <Text style={styles.hint}>
        {mode === 'image'
          ? 'Stock changes are not included.'
          : 'Sent as plain text to the app you choose. Stock changes are not included.'}
      </Text>
      <View style={styles.chips}>
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
      {invalidRange && <Text style={styles.error}>The start date must be before the end date.</Text>}
      <PrimaryButton
        label={mode === 'image' ? 'Share image' : 'Share text'}
        icon="share-outline"
        onPress={mode === 'image' ? openImagePreview : handleShare}
        loading={busy}
        disabled={invalidRange}
        style={styles.button}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.sectionTitle, fontFamily: fonts.semibold },
  hint: { ...typography.caption, marginTop: spacing.sm, marginBottom: spacing.sm },
  imageTile: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.lightBackground,
  },
  thumb: {
    width: 92,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingBottom: 6,
  },
  thumbHeader: { height: 26, backgroundColor: colors.heroTop },
  thumbTiles: { flexDirection: 'row', gap: 3, padding: 5 },
  thumbTile: { flex: 1, height: 14, borderRadius: 3, backgroundColor: colors.accentSoft },
  thumbLine: { height: 3, borderRadius: 2, marginHorizontal: 5, marginTop: 4, backgroundColor: colors.divider },
  imageTileText: { flex: 1, gap: 2, justifyContent: 'center' },
  previewLink: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  customRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  customField: { flex: 1 },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.sm },
  button: { marginTop: spacing.lg, marginBottom: spacing.sm },
});
