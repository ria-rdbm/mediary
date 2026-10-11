import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as medicationsService from '@/services/medications';
import { useAuth } from '@/context/AuthProvider';
import type { MedicationStatus } from '@/constants/categories';

export function useMedications(status?: MedicationStatus[]) {
  return useQuery({
    queryKey: ['medications', status ?? 'all'],
    queryFn: () => medicationsService.fetchMedications(status ? { status } : undefined),
  });
}

export function useMedication(id: string | undefined) {
  return useQuery({
    queryKey: ['medication', id],
    queryFn: () => medicationsService.fetchMedication(id!),
    enabled: !!id,
  });
}

export function useCreateMedication() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: medicationsService.CreateMedicationInput) =>
      medicationsService.createMedication(userId!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

export function useUpdateMedication(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: medicationsService.UpdateMedicationInput) => medicationsService.updateMedication(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] });
      void queryClient.invalidateQueries({ queryKey: ['medication', id] });
    },
  });
}

export function useSetMedicationStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, finishedAt }: { status: MedicationStatus; finishedAt?: string | null }) =>
      medicationsService.setMedicationStatus(id, status, finishedAt),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] });
      void queryClient.invalidateQueries({ queryKey: ['medication', id] });
      void queryClient.invalidateQueries({ queryKey: ['medication-reminders', id] });
    },
  });
}

export function useDeleteMedication(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => medicationsService.deleteMedication(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] });
      void queryClient.removeQueries({ queryKey: ['medication', id] });
      void queryClient.invalidateQueries({ queryKey: ['medication-reminders'] });
    },
  });
}
