import { supabase } from '@/lib/supabase';
import { mapStockBatch, mapStockTransaction } from '@/lib/mappers';
import type { StockBatch, StockTransaction } from '@/types/domain';
import type { StockUnit } from '@/constants/units';

export async function fetchStockBatches(medicationId: string): Promise<StockBatch[]> {
  const { data, error } = await supabase
    .from('stock_batches')
    .select('*')
    .eq('medication_id', medicationId)
    .order('quantity', { ascending: false });
  if (error) throw error;
  return data.map(mapStockBatch);
}

export async function fetchStockTransactions(medicationId: string): Promise<StockTransaction[]> {
  const { data, error } = await supabase
    .from('stock_transactions')
    .select('*')
    .eq('medication_id', medicationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapStockTransaction);
}

export interface AddStockBatchInput {
  medicationId: string;
  quantity: number;
  stockUnit: StockUnit;
  stockUnitCustom?: string | null;
  expiryDate?: string | null;
  batchNumber?: string | null;
  barcode?: string | null;
}

export async function addStockBatch(input: AddStockBatchInput): Promise<StockBatch> {
  const { data, error } = await supabase.rpc('add_stock_batch', {
    p_medication_id: input.medicationId,
    p_quantity: input.quantity,
    p_stock_unit: input.stockUnit,
    p_stock_unit_custom: input.stockUnitCustom ?? null,
    p_expiry_date: input.expiryDate ?? null,
    p_batch_number: input.batchNumber ?? null,
    p_barcode: input.barcode ?? null,
  });
  if (error) throw error;
  return mapStockBatch(data);
}

export async function manualStockAdjustment(medicationId: string, actualStock: number): Promise<number> {
  const { data, error } = await supabase.rpc('manual_stock_adjustment', {
    p_medication_id: medicationId,
    p_actual_stock: actualStock,
  });
  if (error) throw error;
  return data.diff;
}

export async function deleteStockTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_stock_transaction', { p_transaction_id: transactionId });
  if (error) throw error;
}

export async function updateBatchExpiryReminder(
  batchId: string,
  enabled: boolean,
  daysBefore: number | null,
): Promise<void> {
  const { error } = await supabase
    .from('stock_batches')
    .update({ expiry_reminder_enabled: enabled, expiry_reminder_days_before: daysBefore })
    .eq('id', batchId);
  if (error) throw error;
}

export async function setBatchExpiryNotificationId(batchId: string, notificationId: string | null): Promise<void> {
  const { error } = await supabase
    .from('stock_batches')
    .update({ expiry_reminder_notification_id: notificationId })
    .eq('id', batchId);
  if (error) throw error;
}
