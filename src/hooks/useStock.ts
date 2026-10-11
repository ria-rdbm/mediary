import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as stockService from '@/services/stock';

export function useStockBatches(medicationId: string | undefined) {
  return useQuery({
    queryKey: ['stock-batches', medicationId],
    queryFn: () => stockService.fetchStockBatches(medicationId!),
    enabled: !!medicationId,
  });
}

export function useStockTransactions(medicationId: string | undefined) {
  return useQuery({
    queryKey: ['stock-transactions', medicationId],
    queryFn: () => stockService.fetchStockTransactions(medicationId!),
    enabled: !!medicationId,
  });
}

function invalidateStock(queryClient: ReturnType<typeof useQueryClient>, medicationId: string) {
  void queryClient.invalidateQueries({ queryKey: ['stock-batches', medicationId] });
  void queryClient.invalidateQueries({ queryKey: ['stock-transactions', medicationId] });
  void queryClient.invalidateQueries({ queryKey: ['medications'] });
  void queryClient.invalidateQueries({ queryKey: ['medication', medicationId] });
  void queryClient.invalidateQueries({ queryKey: ['history'] });
}

export function useAddStockBatch(medicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<stockService.AddStockBatchInput, 'medicationId'>) =>
      stockService.addStockBatch({ ...input, medicationId }),
    onSuccess: () => invalidateStock(queryClient, medicationId),
  });
}

export function useManualStockAdjustment(medicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actualStock: number) => stockService.manualStockAdjustment(medicationId, actualStock),
    onSuccess: () => invalidateStock(queryClient, medicationId),
  });
}

export function useDeleteStockTransaction(medicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) => stockService.deleteStockTransaction(transactionId),
    onSuccess: () => invalidateStock(queryClient, medicationId),
  });
}

export function useUpdateBatchDetails(medicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, ...details }: { batchId: string; expiryDate: string | null; batchNumber: string | null; barcode: string | null }) =>
      stockService.updateBatchDetails(batchId, details),
    onSuccess: () => invalidateStock(queryClient, medicationId),
  });
}

export function useDiscardStockBatch(medicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => stockService.discardStockBatch(batchId),
    onSuccess: () => invalidateStock(queryClient, medicationId),
  });
}
