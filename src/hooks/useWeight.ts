import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as weightService from '@/services/weight';
import { useAuth } from '@/context/AuthProvider';

export function useWeightRecords() {
  return useQuery({ queryKey: ['weight-records'], queryFn: () => weightService.fetchWeightRecords() });
}

export function useCreateWeightRecord() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ weightKg, recordedAt, note }: { weightKg: number; recordedAt: Date; note?: string | null }) =>
      weightService.createWeightRecord(userId!, weightKg, recordedAt, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weight-records'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useUpdateWeightRecord(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ weightKg, recordedAt, note }: { weightKg: number; recordedAt: Date; note?: string | null }) =>
      weightService.updateWeightRecord(id, weightKg, recordedAt, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weight-records'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useDeleteWeightRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weightService.deleteWeightRecord(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weight-records'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
