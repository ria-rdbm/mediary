import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TimelineRow } from '@/components/ui/TimelineRow';
import { EmptyState, LoadingState, ErrorState } from '@/components/ui/States';
import { MonthCalendar } from '@/components/composed/MonthCalendar';
import { QuickAddSheet } from '@/components/composed/QuickAddSheet';
import { SecondaryButton } from '@/components/ui/Button';
import { colors, typography, spacing } from '@/theme';
import { useHistory } from '@/hooks/useHistory';
import { formatLocalDayHeading, formatLocalTime, localDateKey, todayDateKey } from '@/lib/dateTime';
import { HISTORY_ICONS, HISTORY_COLORS, historyItemRoute } from '@/lib/historyIcons';
import type { HistoryItem } from '@/types/domain';

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

  const { data: items, isLoading, isError, refetch, isRefetching } = useHistory({ searchText: search });

  const grouped = useMemo(() => groupByDay(items ?? []), [items]);

  const markedDateKeys = useMemo(() => {
    const set = new Set<string>();
    for (const item of items ?? []) set.add(localDateKey(item.occurredLocal));
    return set;
  }, [items]);

  const selectedDayItems = useMemo(
    () => (items ?? []).filter((item) => localDateKey(item.occurredLocal) === selectedDateKey),
    [items, selectedDateKey],
  );

  const openItem = (item: HistoryItem) => {
    const route = historyItemRoute(item.type, item.id);
    if (route) router.push(route as never);
  };

  return (
    <Screen scroll refreshing={isRefetching} onRefresh={refetch}>
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
        value={search}
        onChangeText={setSearch}
        containerStyle={styles.search}
      />

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
                    icon={HISTORY_ICONS[item.type]}
                    accentColor={HISTORY_COLORS[item.type]}
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
          {selectedDateKey && (
            <SecondaryButton
              label={`Add on ${formatLocalDayHeading(`${selectedDateKey}T00:00:00`)}`}
              onPress={() => setAddVisible(true)}
              style={styles.addOnDay}
            />
          )}
          <View style={styles.selectedDaySection}>
            {selectedDayItems.length === 0 ? (
              <Text style={[typography.bodySecondary, styles.noRecords]}>No records on this day.</Text>
            ) : (
              selectedDayItems.map((item, index) => (
                <TimelineRow
                  key={item.id}
                  time={formatLocalTime(item.occurredLocal)}
                  title={item.title}
                  subtitle={item.subtitle ?? undefined}
                  icon={HISTORY_ICONS[item.type]}
                  accentColor={HISTORY_COLORS[item.type]}
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
  timeline: { marginTop: spacing.sm },
  dayGroup: { marginBottom: spacing.lg },
  dayHeading: {
    ...typography.metadata,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  addOnDay: {
    marginTop: spacing.md,
  },
  selectedDaySection: {
    marginTop: spacing.lg,
  },
  noRecords: {
    textAlign: 'center',
    paddingVertical: spacing.lg,
    color: colors.textMuted,
  },
});
