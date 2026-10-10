import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as appointmentsService from '@/services/appointments';
import { useAuth } from '@/context/AuthProvider';

export function useAppointments() {
  return useQuery({ queryKey: ['appointments'], queryFn: () => appointmentsService.fetchAppointments() });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsService.fetchAppointment(id!),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: appointmentsService.SaveAppointmentInput) =>
      appointmentsService.createAppointment(userId!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useUpdateAppointment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: appointmentsService.SaveAppointmentInput) => appointmentsService.updateAppointment(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.deleteAppointment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useProviderQuestions(appointmentId: string | undefined) {
  return useQuery({
    queryKey: ['provider-questions', appointmentId],
    queryFn: () => appointmentsService.fetchProviderQuestions(appointmentId!),
    enabled: !!appointmentId,
  });
}

export function useAddProviderQuestion(appointmentId: string) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ question, position }: { question: string; position: number }) =>
      appointmentsService.addProviderQuestion(userId!, appointmentId, question, position),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['provider-questions', appointmentId] }),
  });
}

export function useToggleProviderQuestion(appointmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isChecked }: { id: string; isChecked: boolean }) =>
      appointmentsService.toggleProviderQuestion(id, isChecked),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['provider-questions', appointmentId] }),
  });
}

export function useDeleteProviderQuestion(appointmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.deleteProviderQuestion(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['provider-questions', appointmentId] }),
  });
}

export function useAppointmentReminders(appointmentId: string | undefined) {
  return useQuery({
    queryKey: ['appointment-reminders', appointmentId],
    queryFn: () => appointmentsService.fetchAppointmentReminders(appointmentId!),
    enabled: !!appointmentId,
  });
}

export function useAddAppointmentReminder(appointmentId: string) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { minutesBefore?: number | null; customLocal?: string | null; notificationId: string | null }) =>
      appointmentsService.addAppointmentReminder(userId!, appointmentId, params),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['appointment-reminders', appointmentId] }),
  });
}

export function useDeleteAppointmentReminder(appointmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.deleteAppointmentReminder(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['appointment-reminders', appointmentId] }),
  });
}
