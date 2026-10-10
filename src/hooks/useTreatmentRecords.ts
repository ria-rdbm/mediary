import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as recordsService from '@/services/treatmentRecords';

export function useTreatmentRecordsForMedication(medicationId: string | undefined) {
  return useQuery({
    queryKey: ['treatment-records', medicationId],
    queryFn: () => recordsService.fetchTreatmentRecordsForMedication(medicationId!),
    enabled: !!medicationId,
  });
}

export function useTreatmentRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['treatment-record', id],
    queryFn: () => recordsService.fetchTreatmentRecord(id!),
    enabled: !!id,
  });
}

function invalidateAfterStockChange(queryClient: ReturnType<typeof useQueryClient>, medicationId: string) {
  void queryClient.invalidateQueries({ queryKey: ['treatment-records', medicationId] });
  void queryClient.invalidateQueries({ queryKey: ['medications'] });
  void queryClient.invalidateQueries({ queryKey: ['medication', medicationId] });
  void queryClient.invalidateQueries({ queryKey: ['stock-batches', medicationId] });
  void queryClient.invalidateQueries({ queryKey: ['stock-transactions', medicationId] });
  void queryClient.invalidateQueries({ queryKey: ['history'] });
  void queryClient.invalidateQueries({ queryKey: ['medication-reminders'] });
}

export function useLogTreatmentRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: recordsService.LogTreatmentInput) => recordsService.logTreatmentRecord(input),
    onSuccess: (result) => invalidateAfterStockChange(queryClient, result.record.medicationId),
  });
}

export function useUpdateTreatmentRecord(recordId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: recordsService.LogTreatmentInput) =>
      recordsService.updateTreatmentRecord(recordId, input),
    onSuccess: (result) => invalidateAfterStockChange(queryClient, result.record.medicationId),
  });
}

export function useDeleteTreatmentRecord(medicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) => recordsService.deleteTreatmentRecord(recordId),
    onSuccess: () => invalidateAfterStockChange(queryClient, medicationId),
  });
}

export function useRecordStockUsage(medicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      recordId,
      stockUsed,
      rememberAsDefault,
    }: {
      recordId: string;
      stockUsed: number;
      rememberAsDefault: boolean;
    }) => recordsService.recordStockUsage(recordId, stockUsed, rememberAsDefault),
    onSuccess: () => invalidateAfterStockChange(queryClient, medicationId),
  });
}
