import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Section } from '@/components/ui/Section';
import { LiquidCard } from '@/components/ui/LiquidCard';
import { InitialAvatar } from '@/components/ui/InitialAvatar';
import { TextButton, PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { DatePickerField } from '@/components/ui/DateTimeFields';
import { colors, fonts, typography, spacing } from '@/theme';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/constants/categories';
import type { MedicationStatus } from '@/constants/categories';
import { useMedication, useSetMedicationStatus } from '@/hooks/useMedications';
import { useTreatmentRecordsForMedication } from '@/hooks/useTreatmentRecords';
import { useRemindersForMedication } from '@/hooks/useReminders';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { formatLocalDate, formatLocalDayHeading, formatLocalTime, localDateKey, parseDateKey, todayDateKey } from '@/lib/dateTime';
import { formatAmount } from '@/lib/formatAmount';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: medication, isLoading, isError, refetch } = useMedication(id);
  const { data: records } = useTreatmentRecordsForMedication(id);
  const { data: reminders } = useRemindersForMedication(id);
  const setStatus = useSetMedicationStatus(id);
  const { guard } = useWriteGuard();

  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [finishedAt, setFinishedAt] = useState(new Date());
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [reviewRemindersVisible, setReviewRemindersVisible] = useState(false);

  if (isLoading || !medication) {
    return (
      <Screen>
        <Header title="Medication" />
        <LoadingState />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen>
        <Header title="Medication" />
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const nextReminder = reminders?.find((r) => r.isActive && r.reminderDate >= todayDateKey());
  const recentRecords = (records ?? []).slice(0, 5);

  // Records arrive newest first. "Week N" counts from the first dose — there is
  // no prescriber schedule to place the user on, so it never claims a step.
  const takenRecords = (records ?? []).filter((r) => r.taken);
  const latest = takenRecords[0];
  const first = takenRecords[takenRecords.length - 1];
  const currentDose = latest ? formatAmount(latest.amount, latest.amountUnit, latest.amountUnitCustom) : null;
  const weekNumber = first
    ? Math.floor((parseDateKey(todayDateKey()).getTime() - parseDateKey(localDateKey(first.occurredLocal)).getTime()) / (7 * 86400000)) + 1
    : null;
  const defaultDose = formatAmount(medication.defaultAmount, medication.defaultAmountUnit, medication.defaultAmountUnitCustom);
  const lastDoseLabel = latest
    ? `${localDateKey(latest.occurredLocal) === todayDateKey() ? 'Today' : formatLocalDate(latest.occurredLocal, 'EEE d MMM')}, ${formatLocalTime(latest.occurredLocal)}`
    : 'Not logged yet';

  // iOS can't present a second Modal while another one is still on screen,
  // and the whole screen stops responding if we try. Close the status sheet
  // first and open the follow-up sheet once it is gone.
  const openAfterStatusSheet = (open: () => void) => {
    setStatusSheetVisible(false);
    setTimeout(open, 350);
  };

  const handleStatusChange = async (status: MedicationStatus) => {
    if (!guard()) return;
    if (status === 'finished') {
      openAfterStatusSheet(() => setConfirmingFinish(true));
      return;
    }
    const wasInactive = medication.status === 'paused' || medication.status === 'finished';
    await setStatus.mutateAsync({ status });
    if (status === 'active' && wasInactive) {
      openAfterStatusSheet(() => setReviewRemindersVisible(true));
    } else {
      setStatusSheetVisible(false);
    }
  };

  return (
    <Screen scroll>
      <Header title="Treatment" rightLabel="Edit" onRightPress={() => router.push(`/medication/${id}/edit`)} />

      <LiquidCard style={styles.hero}>
        <View style={styles.heroTop}>
          <InitialAvatar name={medication.name} size={44} tone="onAccent" />
          <View style={styles.heroTitle}>
            <Text style={styles.heroName} numberOfLines={1}>
              {medication.name}
            </Text>
            <Text style={styles.heroCategory}>{CATEGORY_LABELS[medication.category]}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change status"
            onPress={() => setStatusSheetVisible(true)}
            style={styles.heroPill}
          >
            <Text style={styles.heroPillLabel}>{STATUS_LABELS[medication.status]}</Text>
            <Ionicons name="chevron-down" size={13} color={colors.textOnAccent} />
          </Pressable>
        </View>
        <View style={styles.heroDoseRow}>
          <View>
            <Text style={styles.heroMuted}>Current dose</Text>
            <Text style={styles.heroDose}>{currentDose ?? '—'}</Text>
          </View>
          {weekNumber != null && (
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>Week {weekNumber}</Text>
            </View>
          )}
        </View>
        <View style={styles.heroFooter}>
          <Text style={styles.heroMuted}>Last dose</Text>
          <Text style={styles.heroFooterValue}>{lastDoseLabel}</Text>
        </View>
      </LiquidCard>

      <Section title="Stock">
        <Pressable style={styles.listCard} onPress={() => router.push(`/medication/${id}/stock`)}>
          <View style={styles.linkRow}>
            <View style={styles.rowIcon}>
              <Ionicons name="cube-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={typography.cardTitle}>
                {medication.stockUnit ? `${medication.totalStock} ${medication.stockUnit}` : 'Not set up'}
              </Text>
              <Text style={typography.caption}>Manage stock & batches</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Pressable>
      </Section>

      <Section title="Reminder" action={<TextButton label={nextReminder ? 'Change' : 'Set'} onPress={() => router.push(`/medication/${id}/reminder`)} />}>
        <View style={styles.listCard}>
          <View style={styles.linkRow}>
            <View style={styles.rowIcon}>
              <Ionicons name="notifications-outline" size={18} color={colors.accent} />
            </View>
            <Text style={[typography.body, styles.flex]}>
              {nextReminder
                ? `${formatLocalDayHeading(`${nextReminder.reminderDate}T00:00:00`)} · ${formatLocalTime(`${nextReminder.reminderDate}T${nextReminder.reminderTime}:00`)}`
                : 'No reminder set'}
            </Text>
          </View>
        </View>
      </Section>

      <Section title="Recent records" action={<TextButton label="Stock history" onPress={() => router.push(`/medication/${id}/stock-history`)} />}>
        {recentRecords.length === 0 ? (
          <EmptyState icon="water-outline" title="No records yet" />
        ) : (
          <View style={styles.listCard}>
            {recentRecords.map((record, index) => (
              <Pressable
                key={record.id}
                style={({ pressed }) => [styles.recordRow, index > 0 && styles.rowDivider, pressed && { opacity: 0.6 }]}
                onPress={() => router.push(`/record/${record.id}/edit`)}
              >
                <View style={styles.flex}>
                  <Text style={typography.cardTitle}>
                    {record.taken ? formatAmount(record.amount, record.amountUnit, record.amountUnitCustom) ?? 'Taken' : 'Not recorded'}
                  </Text>
                  <Text style={typography.caption}>
                    {[`${formatLocalDate(record.occurredLocal)} · ${formatLocalTime(record.occurredLocal)}`, record.taken && record.site]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </Section>

      <Text style={styles.disclaimer}>Mediary only records — it never changes your dose.</Text>
      <PrimaryButton
        label={defaultDose ? `Log ${defaultDose} dose` : 'Log injection / treatment'}
        icon="create-outline"
        onPress={() => router.push(`/record/new?medicationId=${id}`)}
        style={styles.logButton}
      />

      <BottomSheet visible={statusSheetVisible} onClose={() => setStatusSheetVisible(false)}>
        <Text style={[typography.sectionTitle, { marginBottom: spacing.sm }]}>Status</Text>
        {(['active', 'paused', 'finished'] as MedicationStatus[]).map((status) => (
          <Pressable key={status} style={styles.statusOption} onPress={() => handleStatusChange(status)}>
            <Text style={typography.body}>
              {status === 'active' ? 'Active' : status === 'paused' ? 'Paused' : 'Finished'}
            </Text>
            {medication.status === status && <Ionicons name="checkmark" size={20} color={colors.accent} />}
          </Pressable>
        ))}
      </BottomSheet>

      <BottomSheet visible={confirmingFinish} onClose={() => setConfirmingFinish(false)} maxHeight="55%">
        <Text style={typography.sectionTitle}>Mark as Finished</Text>
        <Text style={[typography.bodySecondary, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
          Finished date is optional.
        </Text>
        <DatePickerField label="Finished date" value={finishedAt} onChange={setFinishedAt} maximumDate={new Date()} />
        <PrimaryButton
          label="Mark Finished"
          onPress={async () => {
            await setStatus.mutateAsync({ status: 'finished', finishedAt: todayDateKey(finishedAt) });
            setConfirmingFinish(false);
            setStatusSheetVisible(false);
          }}
          style={{ marginTop: spacing.sm }}
        />
        <SecondaryButton label="Cancel" onPress={() => setConfirmingFinish(false)} style={{ marginTop: spacing.xs, marginBottom: spacing.sm }} />
      </BottomSheet>

      <ConfirmationDialog
        visible={reviewRemindersVisible}
        title="Review reminders?"
        message="Reminders from before this medication was paused or finished were not automatically restarted."
        confirmLabel="Review Reminders"
        cancelLabel="Not Now"
        onConfirm={() => {
          setReviewRemindersVisible(false);
          router.push(`/medication/${id}/reminder`);
        }}
        onCancel={() => setReviewRemindersVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: spacing.xs,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroTitle: {
    flex: 1,
  },
  heroName: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.textOnAccent,
  },
  heroCategory: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroPillLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textOnAccent,
  },
  heroDoseRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  heroMuted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  heroDose: {
    fontFamily: fonts.serif,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.8,
    color: colors.textOnAccent,
    marginTop: 4,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.22)',
  },
  heroFooterValue: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textOnAccent,
  },
  listCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    gap: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.dividerSoft,
  },
  disclaimer: {
    ...typography.caption,
    marginTop: spacing.lg,
  },
  logButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
