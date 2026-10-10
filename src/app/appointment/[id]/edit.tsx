import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Section } from '@/components/ui/Section';
import { Input } from '@/components/ui/Input';
import { IconButton, TextButton } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { DatePickerField, TimePickerField } from '@/components/ui/DateTimeFields';
import { AppointmentCoreForm } from '@/components/composed/AppointmentCoreForm';
import { colors, typography, spacing } from '@/theme';
import { useMedications } from '@/hooks/useMedications';
import { useProviders } from '@/hooks/useProviders';
import {
  useAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useProviderQuestions,
  useAddProviderQuestion,
  useToggleProviderQuestion,
  useDeleteProviderQuestion,
  useAppointmentReminders,
  useAddAppointmentReminder,
  useDeleteAppointmentReminder,
} from '@/hooks/useAppointments';
import { touchProviderLastUsed } from '@/services/providers';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import { requestNotificationPermission, scheduleLocalNotification, cancelLocalNotification } from '@/lib/notifications';
import { combineDateAndTime, defaultRecordTime, formatLocalDate, formatLocalTime } from '@/lib/dateTime';
import { APPOINTMENT_REMINDER_PRESETS } from '@/constants/symptoms';

export default function EditAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: medications, isLoading: medicationsLoading } = useMedications();
  const { data: providers, isLoading: providersLoading } = useProviders();
  const { data: appointment, isLoading: appointmentLoading, isError } = useAppointment(id);
  const updateAppointment = useUpdateAppointment(id);
  const deleteAppointment = useDeleteAppointment();
  const { guard } = useWriteGuard();

  const { data: questions } = useProviderQuestions(id);
  const addQuestion = useAddProviderQuestion(id);
  const toggleQuestion = useToggleProviderQuestion(id);
  const deleteQuestion = useDeleteProviderQuestion(id);
  const [newQuestion, setNewQuestion] = useState('');

  const { data: reminders } = useAppointmentReminders(id);
  const addReminder = useAddAppointmentReminder(id);
  const deleteReminder = useDeleteAppointmentReminder(id);
  const [customReminderVisible, setCustomReminderVisible] = useState(false);
  const [customReminderAt, setCustomReminderAt] = useState(combineDateAndTime(new Date(), defaultRecordTime()));

  const [deleteVisible, setDeleteVisible] = useState(false);

  if (medicationsLoading || providersLoading || appointmentLoading || !medications || !providers) {
    return (
      <Screen>
        <Header title="Appointment" />
        <LoadingState />
      </Screen>
    );
  }
  if (isError || !appointment) {
    return (
      <Screen>
        <Header title="Appointment" />
        <ErrorState />
      </Screen>
    );
  }

  const scheduleReminder = async (notifyAt: Date, label: string) => {
    const granted = await requestNotificationPermission();
    let notificationId: string | null = null;
    if (granted) {
      notificationId = await scheduleLocalNotification({
        title: 'Appointment reminder',
        body: appointment.providerNameSnapshot ? `With ${appointment.providerNameSnapshot}` : label,
        date: notifyAt,
        data: { kind: 'appointment_reminder', appointmentId: id },
      });
    }
    return notificationId;
  };

  const handleAddPresetReminder = async (minutesBefore: number) => {
    if (!guard()) return;
    const visitDate = new Date(appointment.visitLocal);
    const notifyAt = new Date(visitDate.getTime() - minutesBefore * 60000);
    const notificationId = await scheduleReminder(notifyAt, `${minutesBefore} minutes before your appointment`);
    await addReminder.mutateAsync({ minutesBefore, notificationId });
  };

  const handleAddCustomReminder = async () => {
    if (!guard()) return;
    const notificationId = await scheduleReminder(customReminderAt, 'Upcoming appointment');
    await addReminder.mutateAsync({
      customLocal: customReminderAt.toISOString(),
      notificationId,
    });
    setCustomReminderVisible(false);
  };

  return (
    <Screen scroll>
      <Header title="Appointment" rightLabel="Delete" onRightPress={() => setDeleteVisible(true)} />

      <AppointmentCoreForm
        medications={medications}
        providers={providers}
        initial={{
          medicationId: appointment.medicationId,
          providerId: appointment.providerId,
          providerNameSnapshot: appointment.providerNameSnapshot,
          visitAt: new Date(appointment.visitLocal),
          providerInstructions: appointment.providerInstructions ?? '',
          myNotes: appointment.myNotes ?? '',
          treatmentChanges: appointment.treatmentChanges ?? '',
          nextAppointmentLocal: appointment.nextAppointmentLocal ?? '',
        }}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          if (!guard()) return;
          await updateAppointment.mutateAsync({
            medicationId: values.medicationId,
            providerId: values.providerId,
            providerNameSnapshot: values.providerNameSnapshot,
            visitAt: values.visitAt,
            providerInstructions: values.providerInstructions || null,
            myNotes: values.myNotes || null,
            treatmentChanges: values.treatmentChanges || null,
            nextAppointmentLocal: values.nextAppointmentLocal || null,
          });
          if (values.providerId) void touchProviderLastUsed(values.providerId);
          router.back();
        }}
      />

      <Section title="Questions for my provider">
        {(questions ?? []).map((q) => (
          <View key={q.id} style={styles.questionRow}>
            <Pressable onPress={() => guard() && toggleQuestion.mutate({ id: q.id, isChecked: !q.isChecked })}>
              <Ionicons
                name={q.isChecked ? 'checkbox' : 'square-outline'}
                size={20}
                color={q.isChecked ? colors.accent : colors.textMuted}
              />
            </Pressable>
            <Text style={[typography.body, styles.questionText, q.isChecked && styles.questionChecked]}>
              {q.question}
            </Text>
            <IconButton icon="close" accessibilityLabel="Remove" size={18} onPress={() => guard() && deleteQuestion.mutate(q.id)} />
          </View>
        ))}
        <View style={styles.addQuestionRow}>
          <Input
            placeholder="Add a question"
            value={newQuestion}
            onChangeText={setNewQuestion}
            containerStyle={styles.addQuestionInput}
          />
          <IconButton
            icon="add-circle"
            accessibilityLabel="Add question"
            size={28}
            onPress={() => {
              if (!guard() || !newQuestion.trim()) return;
              addQuestion.mutate({ question: newQuestion.trim(), position: questions?.length ?? 0 });
              setNewQuestion('');
            }}
          />
        </View>
      </Section>

      <Section title="Appointment reminders">
        {(reminders ?? []).map((r) => (
          <View key={r.id} style={styles.reminderRow}>
            <Text style={typography.body}>
              {r.minutes_before != null
                ? APPOINTMENT_REMINDER_PRESETS.find((p) => p.minutesBefore === r.minutes_before)?.label ??
                  `${r.minutes_before} min before`
                : `${formatLocalDate(r.custom_local!)} · ${formatLocalTime(r.custom_local!)}`}
            </Text>
            <IconButton
              icon="trash-outline"
              tone="destructive"
              accessibilityLabel="Remove reminder"
              onPress={async () => {
                if (!guard()) return;
                const notificationId = await deleteReminder.mutateAsync(r.id);
                await cancelLocalNotification(notificationId);
              }}
            />
          </View>
        ))}
        <View style={styles.presetRow}>
          {APPOINTMENT_REMINDER_PRESETS.map((preset) => (
            <Pressable
              key={preset.label}
              style={styles.presetChip}
              onPress={() =>
                preset.minutesBefore != null ? handleAddPresetReminder(preset.minutesBefore) : setCustomReminderVisible(true)
              }
            >
              <Text style={styles.presetLabel}>{preset.label}</Text>
            </Pressable>
          ))}
        </View>
        {customReminderVisible && (
          <View style={{ marginTop: spacing.sm }}>
            <DatePickerField label="Reminder date" value={customReminderAt} onChange={(d) => setCustomReminderAt(combineDateAndTime(d, customReminderAt))} />
            <TimePickerField label="Reminder time" value={customReminderAt} onChange={(t) => setCustomReminderAt(combineDateAndTime(customReminderAt, t))} />
            <TextButton label="Add custom reminder" onPress={handleAddCustomReminder} />
          </View>
        )}
      </Section>

      <ConfirmationDialog
        visible={deleteVisible}
        title="Delete this appointment?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!guard()) {
            setDeleteVisible(false);
            return;
          }
          await deleteAppointment.mutateAsync(id);
          setDeleteVisible(false);
          router.back();
        }}
        onCancel={() => setDeleteVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  questionText: { flex: 1 },
  questionChecked: { color: colors.textMuted, textDecorationLine: 'line-through' },
  addQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  addQuestionInput: { flex: 1, marginBottom: 0 },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceSecondary,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
