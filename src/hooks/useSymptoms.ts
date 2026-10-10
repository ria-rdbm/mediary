import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as symptomsService from '@/services/symptoms';
import { useAuth } from '@/context/AuthProvider';

export function useSymptoms() {
  return useQuery({ queryKey: ['symptoms'], queryFn: () => symptomsService.fetchSymptoms() });
}

export function useCreateSymptom() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: symptomsService.SaveSymptomInput) => symptomsService.createSymptom(userId!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useUpdateSymptom(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: symptomsService.SaveSymptomInput) => symptomsService.updateSymptom(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useDeleteSymptom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => symptomsService.deleteSymptom(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
