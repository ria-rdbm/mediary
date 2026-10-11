import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { TextButton, PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { DatePickerField } from '@/components/ui/DateTimeFields';
import { colors, typography, spacing, radius } from '@/theme';
import { CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_DEFAULT_COLOR_INDEX } from '@/constants/categories';
import type { MedicationStatus } from '@/constants/categories';
import { useMedication, useSetMedicationStatus } from '@/hooks/useMedications';
import { useTreatmentRecordsForMedication } from '@/hooks/useTreatmentRecords';
import { useRemindersForMedication } from '@/hooks/useReminders';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { formatLocalDate, formatLocalTime, todayDateKey } from '@/lib/dateTime';

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

  const accentColor = medication.color ?? colors.medicationPalette[CATEGORY_DEFAULT_COLOR_INDEX[medication.category]];
  const nextReminder = reminders?.find((r) => r.isActive && r.reminderDate >= todayDateKey());
  const recentRecords = (records ?? []).slice(0, 5);

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
      <Header title={medication.name} rightLabel="Edit" onRightPress={() => router.push(`/medication/${id}/edit`)} />

      <View style={styles.titleRow}>
        <View style={[styles.iconCircle, { backgroundColor: `${accentColor}22` }]}>
          <Ionicons name={CATEGORY_ICONS[medication.category]} size={22} color={accentColor} />
        </View>
        <View style={styles.titleText}>
          <Text style={typography.caption}>{CATEGORY_LABELS[medication.category]}</Text>
          <Pressable onPress={() => setStatusSheetVisible(true)} style={styles.statusPress}>
            <StatusBadge status={medication.status} />
          </Pressable>
        </View>
      </View>

      <Section title="Log">
        <PrimaryButton label="Log Injection / Treatment" onPress={() => router.push(`/record/new?medicationId=${id}`)} />
      </Section>

      <Section title="Stock">
        <Card>
          <Pressable style={styles.linkRow} onPress={() => router.push(`/medication/${id}/stock`)}>
            <View>
              <Text style={typography.cardTitle}>
                {medication.stockUnit ? `${medication.totalStock} ${medication.stockUnit}` : 'Not set up'}
              </Text>
              <Text style={typography.caption}>Manage stock & batches</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Card>
      </Section>

      <Section title="Reminder" action={<TextButton label={nextReminder ? 'Change' : 'Set'} onPress={() => router.push(`/medication/${id}/reminder`)} />}>
        <Text style={typography.bodySecondary}>
          {nextReminder
            ? `${formatLocalDate(`${nextReminder.reminderDate}T${nextReminder.reminderTime}:00`)} at ${formatLocalTime(`${nextReminder.reminderDate}T${nextReminder.reminderTime}:00`)}`
            : 'No reminder set'}
        </Text>
      </Section>

      <Section title="Recent records" action={<TextButton label="Stock history" onPress={() => router.push(`/medication/${id}/stock-history`)} />}>
        {recentRecords.length === 0 ? (
          <EmptyState icon="water-outline" title="No records yet" />
        ) : (
          recentRecords.map((record) => (
            <Pressable key={record.id} style={styles.recordRow} onPress={() => router.push(`/record/${record.id}/edit`)}>
              <Text style={typography.body}>
                {formatLocalDate(record.occurredLocal)} · {formatLocalTime(record.occurredLocal)}
              </Text>
              <Text style={typography.caption}>
                {record.taken
                  ? [record.amount ? `${record.amount} ${record.amountUnit}` : null, record.site].filter(Boolean).join(' · ') || 'Taken'
                  : 'Not recorded'}
              </Text>
            </Pressable>
          ))
        )}
      </Section>

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
            await setStatus.mutateAsync({ status: 'finished', finishedAt: finishedAt.toISOString().slice(0, 10) });
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    gap: 4,
  },
  statusPress: {
    alignSelf: 'flex-start',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
