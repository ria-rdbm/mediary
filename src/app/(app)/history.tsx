import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Chip } from '@/components/ui/Chip';
import { TimelineRow, type TimelineTag } from '@/components/ui/TimelineRow';
import { EmptyState, LoadingState, ErrorState } from '@/components/ui/States';
import { MonthCalendar } from '@/components/composed/MonthCalendar';
import { QuickAddSheet } from '@/components/composed/QuickAddSheet';
import { colors, fonts, typography, spacing } from '@/theme';
import { useHistory } from '@/hooks/useHistory';
import { formatLocalDayHeading, formatLocalTime, localDateKey, todayDateKey } from '@/lib/dateTime';
import { useUpcomingMedicationReminders } from '@/hooks/useReminders';
import { useMedications } from '@/hooks/useMedications';
import {
  HISTORY_ICONS,
  HISTORY_COLORS,
  HISTORY_ICON_BACKGROUNDS,
  HISTORY_TYPE_LABELS,
  historyItemRoute,
} from '@/lib/historyIcons';
import type { HistoryItem, HistoryRecordType } from '@/types/domain';

const TYPE_FILTERS: { value: HistoryRecordType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'treatment', label: 'Treatments' },
  { value: 'symptom', label: 'Symptoms' },
  { value: 'weight', label: 'Weight' },
  { value: 'note', label: 'Notes' },
  { value: 'appointment', label: 'Appointments' },
  { value: 'stock', label: 'Stock' },
];

/** Short values become pills (amount, severity, kg); free text stays a subtitle. */
function timelineTags(item: HistoryItem): TimelineTag[] | undefined {
  if (item.type === 'note' || item.type === 'appointment' || !item.subtitle) return undefined;
  const parts = item.subtitle.split(' · ').filter(Boolean);
  const tone: TimelineTag['tone'] = item.type === 'symptom' ? 'teal' : 'accent';
  return [
    ...parts.map((label, i): TimelineTag => ({ label, tone: i === 0 ? tone : 'neutral' })),
    { label: HISTORY_TYPE_LABELS[item.type] },
  ];
}

function groupByDay(items: HistoryItem[]): { dateKey: string; items: HistoryItem[] }[] {
  const groups = new Map<string, HistoryItem[]>();
  for (const item of items) {
    const key = localDateKey(item.occurredLocal);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dateKey, dayItems]) => ({ dateKey, items: dayItems }));
}

export default function HistoryScreen() {
  const [mode, setMode] = useState<'timeline' | 'calendar'>('timeline');
  const [search, setSearch] = useState('');
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(todayDateKey());
  const [addVisible, setAddVisible] = useState(false);
  const [typeFilter, setTypeFilter] = useState<HistoryRecordType | 'all'>('all');

  const { data: items, isLoading, isError, refetch, isRefetching } = useHistory({
    searchText: search,
    types: typeFilter === 'all' ? undefined : [typeFilter],
  });
  const { data: reminders } = useUpcomingMedicationReminders();
  const { data: medications } = useMedications(['active', 'paused']);

  // Other screens (or another device) may have changed data while this tab
  // stayed mounted, so refresh whenever it regains focus.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const reminderDateKeys = useMemo(() => new Set((reminders ?? []).map((r) => r.reminderDate)), [reminders]);
  const selectedDayReminders = useMemo(() => {
    const names = new Map((medications ?? []).map((m) => [m.id, m.name]));
    return (reminders ?? [])
      .filter((r) => r.reminderDate === selectedDateKey && names.has(r.medicationId))
      .map((r) => ({ id: r.id, medicationId: r.medicationId, name: names.get(r.medicationId)!, time: r.reminderTime }));
  }, [reminders, medications, selectedDateKey]);

  const grouped = useMemo(() => groupByDay(items ?? []), [items]);

  const markedDateKeys = useMemo(() => {
    const set = new Set<string>();
    for (const item of items ?? []) set.add(localDateKey(item.occurredLocal));
    for (const key of reminderDateKeys) set.add(key);
    return set;
  }, [items, reminderDateKeys]);

  const selectedDayItems = useMemo(
    () => (items ?? []).filter((item) => localDateKey(item.occurredLocal) === selectedDateKey),
    [items, selectedDateKey],
  );

  const openItem = (item: HistoryItem) => {
    const route = historyItemRoute(item.type, item.id);
    if (route) router.push(route as never);
  };

  return (
    <Screen scroll aboveTabBar refreshing={isRefetching} onRefresh={refetch}>
      <Text style={[typography.screenTitle, styles.title]}>History</Text>

      <SegmentedControl
        segments={[
          { value: 'timeline', label: 'Timeline' },
          { value: 'calendar', label: 'Calendar' },
        ]}
        value={mode}
        onChange={setMode}
      />

      <Input
        placeholder="Search medication, symptom, provider, notes"
        icon="search"
        value={search}
        onChangeText={setSearch}
        containerStyle={styles.search}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {TYPE_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            icon={f.value === 'all' ? undefined : HISTORY_ICONS[f.value]}
            selected={typeFilter === f.value}
            onPress={() => setTypeFilter(f.value)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : mode === 'timeline' ? (
        grouped.length === 0 ? (
          <EmptyState icon="time-outline" title="No history yet" message="Records you add will show up here." />
        ) : (
          <View style={styles.timeline}>
            {grouped.map((group) => (
              <View key={group.dateKey} style={styles.dayGroup}>
                <Text style={styles.dayHeading}>{formatLocalDayHeading(`${group.dateKey}T00:00:00`)}</Text>
                {group.items.map((item, index) => (
                  <TimelineRow
                    key={item.id}
                    time={formatLocalTime(item.occurredLocal)}
                    title={item.title}
                    subtitle={item.subtitle ?? undefined}
                    tags={timelineTags(item)}
                    icon={HISTORY_ICONS[item.type]}
                    accentColor={HISTORY_COLORS[item.type]}
                    iconBackground={HISTORY_ICON_BACKGROUNDS[item.type]}
                    isLast={index === group.items.length - 1}
                    onPress={() => openItem(item)}
                  />
                ))}
              </View>
            ))}
          </View>
        )
      ) : (
        <View>
          <MonthCalendar
            year={calendarYear}
            month={calendarMonth}
            selectedDateKey={selectedDateKey}
            markedDateKeys={markedDateKeys}
            onSelectDate={setSelectedDateKey}
            onChangeMonth={(y, m) => {
              setCalendarYear(y);
              setCalendarMonth(m);
            }}
          />
          <View style={styles.selectedDaySection}>
            {selectedDateKey && (
              <View style={styles.dayHeader}>
                <Text style={styles.dayHeaderTitle} numberOfLines={1}>
                  {formatLocalDayHeading(`${selectedDateKey}T00:00:00`)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add entry on this day"
                  onPress={() => setAddVisible(true)}
                  style={({ pressed }) => [styles.addPill, pressed && { opacity: 0.6 }]}
                  hitSlop={6}
                >
                  <Ionicons name="add" size={18} color={colors.accent} />
                  <Text style={styles.addPillLabel}>Add</Text>
                </Pressable>
              </View>
            )}
            {selectedDayReminders.map((r) => (
              <TimelineRow
                key={`reminder-${r.id}`}
                time={formatLocalTime(`${selectedDateKey}T${r.time}:00`)}
                title={`${r.name} — Reminder`}
                icon="notifications-outline"
                accentColor={colors.accentStrong}
                isLast={false}
                onPress={() => router.push(`/medication/${r.medicationId}/reminder`)}
              />
            ))}
            {selectedDayItems.length === 0 && selectedDayReminders.length === 0 ? (
              <Text style={[typography.bodySecondary, styles.noRecords]}>No records on this day.</Text>
            ) : (
              selectedDayItems.map((item, index) => (
                <TimelineRow
                  key={item.id}
                  time={formatLocalTime(item.occurredLocal)}
                  title={item.title}
                  subtitle={item.subtitle ?? undefined}
                  tags={timelineTags(item)}
                  icon={HISTORY_ICONS[item.type]}
                  accentColor={HISTORY_COLORS[item.type]}
                  iconBackground={HISTORY_ICON_BACKGROUNDS[item.type]}
                  isLast={index === selectedDayItems.length - 1}
                  onPress={() => openItem(item)}
                />
              ))
            )}
          </View>
        </View>
      )}
      <QuickAddSheet visible={addVisible} onClose={() => setAddVisible(false)} dateKey={selectedDateKey} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.md },
  search: { marginTop: spacing.md },
  filterRow: { marginTop: spacing.xs, marginBottom: spacing.xs, flexGrow: 0 },
  filterContent: { gap: spacing.xs, paddingVertical: spacing.xxs },
  timeline: { marginTop: spacing.sm },
  dayGroup: { marginBottom: spacing.lg },
  dayHeading: {
    ...typography.cardTitle,
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayHeaderTitle: { ...typography.cardTitle, fontSize: 17, flex: 1, marginRight: spacing.sm },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 34,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  addPillLabel: { ...typography.body, fontSize: 15, color: colors.accent, fontFamily: fonts.semibold },
  selectedDaySection: {
    marginTop: spacing.lg,
  },
  noRecords: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
    color: colors.textMuted,
  },
});
