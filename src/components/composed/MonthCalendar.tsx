import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, typography, spacing, radius } from '@/theme';
import { todayDateKey } from '@/lib/dateTime';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface MonthCalendarProps {
  year: number;
  month: number; // 0-indexed
  selectedDateKey: string | null;
  markedDateKeys: Set<string>;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (year: number, month: number) => void;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function MonthCalendar({
  year,
  month,
  selectedDateKey,
  markedDateKeys,
  onSelectDate,
  onChangeMonth,
}: MonthCalendarProps) {
  const today = todayDateKey();

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (string | null)[] = Array(startOffset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(`${year}-${pad(month + 1)}-${pad(day)}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const result: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
    return result;
  }, [year, month]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => onChangeMonth(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1)}
          hitSlop={8}
          style={styles.monthButton}
        >
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => onChangeMonth(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1)}
          hitSlop={8}
          style={styles.monthButton}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((dateKey, di) => {
            if (!dateKey) return <View key={di} style={styles.dayCell} />;
            const isSelected = dateKey === selectedDateKey;
            const isToday = dateKey === today;
            const hasMark = markedDateKeys.has(dateKey);
            const dayNumber = Number(dateKey.slice(-2));

            return (
              <Pressable key={di} style={styles.dayCell} onPress={() => onSelectDate(dateKey)}>
                {isSelected && <View style={styles.selectedDisc} />}
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {dayNumber}
                </Text>
                {hasMark && <View style={[styles.dot, isSelected && { backgroundColor: colors.textOnAccent }]} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    ...typography.sectionTitle,
    fontSize: 18,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xxs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.metadata,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDisc: {
    position: 'absolute',
    width: '78%',
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  dayText: {
    ...typography.body,
    fontSize: 14,
  },
  dayTextSelected: {
    color: colors.textOnAccent,
    fontFamily: fonts.semibold,
  },
  dayTextToday: {
    color: colors.accent,
    fontFamily: fonts.semibold,
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
