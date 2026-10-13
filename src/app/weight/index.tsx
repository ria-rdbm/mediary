import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { WeightChart } from '@/components/composed/WeightChart';
import { colors, typography, spacing } from '@/theme';
import { useWeightRecords } from '@/hooks/useWeight';
import { formatLocalDate, formatLocalTime } from '@/lib/dateTime';

export default function WeightTrendScreen() {
  const { data: records, isLoading } = useWeightRecords();

  return (
    <Screen scroll>
      <Header title="Weight" rightLabel="Add" onRightPress={() => router.push('/weight/new')} />

      {isLoading ? (
        <LoadingState />
      ) : !records?.length ? (
        <EmptyState
          icon="scale-outline"
          title="No weight recorded yet"
          message="Log your weight to see your trend over time."
          actionLabel="Add weight"
          onAction={() => router.push('/weight/new')}
        />
      ) : (
        <>
          <Card elevated style={styles.chartCard}>
            <WeightChart records={records} />
          </Card>

          <View style={styles.list}>
            {records.map((record) => (
              <Pressable
                key={record.id}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => router.push(`/weight/${record.id}/edit`)}
              >
                <View style={styles.rowText}>
                  <Text style={typography.body}>
                    {formatLocalDate(record.recordedLocal)} · {formatLocalTime(record.recordedLocal)}
                  </Text>
                  {record.note && (
                    <Text style={typography.caption} numberOfLines={1}>
                      {record.note}
                    </Text>
                  )}
                </View>
                <Text style={styles.rowWeight}>{record.weightKg.toFixed(1)} kg</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
  },
  rowWeight: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
