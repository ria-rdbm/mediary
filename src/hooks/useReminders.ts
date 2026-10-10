import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as remindersService from '@/services/reminders';
import { useAuth } from '@/context/AuthProvider';
import { todayDateKey } from '@/lib/dateTime';

export function useUpcomingMedicationReminders() {
  return useQuery({
    queryKey: ['medication-reminders', 'upcoming'],
    queryFn: () => remindersService.fetchUpcomingMedicationReminders(todayDateKey()),
  });
}

export function useRemindersForMedication(medicationId: string | undefined) {
  return useQuery({
    queryKey: ['medication-reminders', medicationId],
    queryFn: () => remindersService.fetchRemindersForMedication(medicationId!),
    enabled: !!medicationId,
  });
}

export function useUpsertMedicationReminder(medicationId: string) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reminderDate,
      reminderTime,
      notificationId,
    }: {
      reminderDate: string;
      reminderTime: string;
      notificationId: string | null;
    }) => remindersService.upsertMedicationReminder(userId!, medicationId, reminderDate, reminderTime, notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medication-reminders'] });
    },
  });
}

export function useDeleteMedicationReminder(medicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reminderId: string) => remindersService.deleteMedicationReminder(reminderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medication-reminders'] });
      void queryClient.invalidateQueries({ queryKey: ['medication-reminders', medicationId] });
    },
  });
}
