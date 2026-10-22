import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/ui/Screen';
import { TextButton } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { WeightChart } from '@/components/composed/WeightChart';
import { colors, typography, spacing } from '@/theme';
import { useHealthSummary } from '@/hooks/useHealthSummary';
import { formatLocalDate, formatLocalTime } from '@/lib/dateTime';
import { STATUS_LABELS } from '@/constants/categories';
import type { HealthSummarySection } from '@/services/healthSummary';
import { formatAmount } from '@/lib/formatAmount';

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
                  ? [formatAmount(record.amount, record.amountUnit, record.amountUnitCustom), record.site ?? record.treatmentArea]
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

  // This route is a fullScreenModal, where SafeAreaView reports a zero top
  // inset on iOS — so pad the header from the provider's device insets.
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useHealthSummary(medicationIds, params.startDateKey, params.endDateKey, includeWeight);

  return (
    <Screen edges={['bottom']} padded={false} tinted={false}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TextButton label="Back" onPress={() => router.back()} />
        <Text style={typography.headerTitle}>Health Summary</Text>
        <TextButton label="Done" onPress={() => router.dismissTo('/(app)/health-summary')} />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : (
        // A plain ScrollView (not a nested Screen) so the content scrolls in
        // its own clipped area below the fixed header.
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View>
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
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xxs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    zIndex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  rangeText: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  medicationSection: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.divider,
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
