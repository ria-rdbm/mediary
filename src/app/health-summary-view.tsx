import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { TextButton } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { WeightChart } from '@/components/composed/WeightChart';
import { colors, typography, spacing, radius } from '@/theme';
import { useHealthSummary } from '@/hooks/useHealthSummary';
import { formatLocalDate, formatLocalTime } from '@/lib/dateTime';
import { STATUS_LABELS } from '@/constants/categories';
import type { HealthSummarySection } from '@/services/healthSummary';

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MedicationSection({ section }: { section: HealthSummarySection }) {
  const { medication, records, symptoms, appointments } = section;

  return (
    <View style={styles.medicationSection}>
      <View style={styles.medicationHeader}>
        <Text style={typography.sectionTitle}>{medication.name}</Text>
        <Text style={styles.statusText}>
          {STATUS_LABELS[medication.status]}
          {medication.status === 'finished' && medication.finishedAt
            ? ` · ${formatLocalDate(`${medication.finishedAt}T00:00:00`)}`
            : ''}
        </Text>
      </View>

      {records.length > 0 && (
        <SectionBlock title="Records">
          {records.map((record) => (
            <View key={record.id} style={styles.recordRow}>
              <Text style={styles.recordDate}>
                {formatLocalDate(record.occurredLocal)} · {formatLocalTime(record.occurredLocal)}
              </Text>
              <Text style={typography.body}>
                {record.taken
                  ? [record.amount ? `${record.amount} ${record.amountUnit}` : null, record.site ?? record.treatmentArea]
                      .filter(Boolean)
                      .join(' · ') || 'Taken'
                  : 'Not recorded'}
              </Text>
              {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
            </View>
          ))}
        </SectionBlock>
      )}

      {symptoms.length > 0 && (
        <SectionBlock title="Linked symptoms">
          {symptoms.map((symptom) => (
            <View key={symptom.id} style={styles.recordRow}>
              <Text style={styles.recordDate}>{formatLocalDate(symptom.startLocal)}</Text>
              <Text style={typography.body}>
                {symptom.name} — {symptom.severity}
              </Text>
            </View>
          ))}
        </SectionBlock>
      )}

      {appointments.length > 0 && (
        <SectionBlock title="Linked appointments">
          {appointments.map((appointment) => (
            <View key={appointment.id} style={styles.recordRow}>
              <Text style={styles.recordDate}>{formatLocalDate(appointment.visitLocal)}</Text>
              {appointment.providerInstructions && (
                <Text style={typography.body}>Provider instructions: {appointment.providerInstructions}</Text>
              )}
              {appointment.treatmentChanges && (
                <Text style={[typography.body, { marginTop: 2 }]}>Changes: {appointment.treatmentChanges}</Text>
              )}
            </View>
          ))}
        </SectionBlock>
      )}

      {records.length === 0 && symptoms.length === 0 && appointments.length === 0 && (
        <Text style={typography.bodySecondary}>No records in this period.</Text>
      )}
    </View>
  );
}

export default function HealthSummaryViewScreen() {
  const params = useLocalSearchParams<{
    medicationIds: string;
    startDateKey: string;
    endDateKey: string;
    includeWeight: string;
  }>();
  const medicationIds = params.medicationIds?.split(',').filter(Boolean) ?? [];
  const includeWeight = params.includeWeight === '1';

  const { data, isLoading } = useHealthSummary(medicationIds, params.startDateKey, params.endDateKey, includeWeight);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TextButton label="Back" onPress={() => router.back()} />
        <Text style={typography.cardTitle}>Health Summary</Text>
        <TextButton label="Done" onPress={() => router.dismissTo('/(app)/health-summary')} />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : (
        <Screen scroll padded={false} edges={[]}>
          <View style={styles.content}>
            <Text style={styles.rangeText}>
              {formatLocalDate(`${params.startDateKey}T00:00:00`)} – {formatLocalDate(`${params.endDateKey}T00:00:00`)}
            </Text>

            {data?.sections.map((section) => <MedicationSection key={section.medication.id} section={section} />)}

            {includeWeight &&
              (data?.weightRecords.length ? (
                <View style={styles.medicationSection}>
                  <Text style={typography.sectionTitle}>Weight trend</Text>
                  <View style={{ marginTop: spacing.sm }}>
                    <WeightChart records={data.weightRecords} />
                  </View>
                </View>
              ) : null)}

            {!data?.sections.length && (
              <EmptyState icon="document-text-outline" title="No data for this period" />
            )}
          </View>
        </Screen>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  rangeText: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  medicationSection: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  medicationHeader: {
    marginBottom: spacing.sm,
  },
  statusText: {
    ...typography.caption,
    marginTop: 2,
  },
  block: {
    marginTop: spacing.sm,
  },
  blockTitle: {
    ...typography.metadata,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  recordRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  recordDate: {
    ...typography.caption,
    marginBottom: 2,
  },
  recordNotes: {
    ...typography.bodySecondary,
    marginTop: 2,
  },
});
