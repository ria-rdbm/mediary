import { supabase } from '@/lib/supabase';
import { mapMedication, mapMedicationWithStock } from '@/lib/mappers';
import type { Medication, MedicationWithStock } from '@/types/domain';
import type { MedicationCategory, MedicationStatus } from '@/constants/categories';
import type { DoseUnit } from '@/constants/units';
import type { MedicationRow } from '@/types/database';

export async function fetchMedications(options?: { status?: MedicationStatus[] }): Promise<MedicationWithStock[]> {
  let query = supabase.from('medications').select('*').order('created_at', { ascending: true });
  if (options?.status?.length) {
    query = query.in('status', options.status);
  }
  const { data, error } = await query;
  if (error) throw error;
  if (!data?.length) return [];

  const { data: stockTotals, error: stockError } = await supabase
    .from('medication_stock_totals')
    .select('*')
    .in('medication_id', data.map((m) => m.id));
  if (stockError) throw stockError;

  const stockByMedication = new Map(stockTotals?.map((s) => [s.medication_id, s]));
  return data.map((row) => mapMedicationWithStock(row, stockByMedication.get(row.id)));
}

export async function fetchMedication(id: string): Promise<MedicationWithStock> {
  const { data, error } = await supabase.from('medications').select('*').eq('id', id).single();
  if (error) throw error;

  const { data: stock } = await supabase
    .from('medication_stock_totals')
    .select('*')
    .eq('medication_id', id)
    .maybeSingle();

  return mapMedicationWithStock(data, stock);
}

export interface CreateMedicationInput {
  name: string;
  category: MedicationCategory;
  defaultAmount?: number | null;
  defaultAmountUnit?: DoseUnit | null;
  defaultAmountUnitCustom?: string | null;
  color?: string | null;
  defaultProviderId?: string | null;
  reminderDate?: string | null;
  reminderTime?: string | null;
}

export async function createMedication(userId: string, input: CreateMedicationInput): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      category: input.category,
      color: input.color ?? null,
      default_provider_id: input.defaultProviderId ?? null,
      default_amount: input.defaultAmount ?? null,
      default_amount_unit: input.defaultAmountUnit ?? null,
      default_amount_unit_custom: input.defaultAmountUnit === 'Other' ? input.defaultAmountUnitCustom?.trim() || null : null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMedication(data);
}

export interface UpdateMedicationInput {
  name?: string;
  color?: string | null;
  defaultProviderId?: string | null;
  defaultAmount?: number | null;
  defaultAmountUnit?: DoseUnit | null;
  defaultAmountUnitCustom?: string | null;
  autoDeductStock?: boolean;
  stockUsedPerInjection?: number | null;
  lowStockThreshold?: number | null;
}

export async function updateMedication(id: string, input: UpdateMedicationInput): Promise<Medication> {
  const patch: Partial<MedicationRow> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.color !== undefined) patch.color = input.color;
  if (input.defaultProviderId !== undefined) patch.default_provider_id = input.defaultProviderId;
  if (input.defaultAmount !== undefined) patch.default_amount = input.defaultAmount;
  if (input.defaultAmountUnit !== undefined) patch.default_amount_unit = input.defaultAmountUnit;
  if (input.defaultAmountUnitCustom !== undefined) patch.default_amount_unit_custom = input.defaultAmountUnitCustom;
  if (input.autoDeductStock !== undefined) patch.auto_deduct_stock = input.autoDeductStock;
  if (input.stockUsedPerInjection !== undefined) patch.stock_used_per_injection = input.stockUsedPerInjection;
  if (input.lowStockThreshold !== undefined) patch.low_stock_threshold = input.lowStockThreshold;

  const { data, error } = await supabase.from('medications').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return mapMedication(data);
}

export async function setMedicationStatus(
  id: string,
  status: MedicationStatus,
  finishedAt?: string | null,
): Promise<Medication> {
  const { data, error } = await supabase
    .from('medications')
    .update({ status, finished_at: status === 'finished' ? finishedAt ?? null : null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapMedication(data);
}

/**
 * Deletes a medication that has no treatment records or stock history. The
 * database restricts deletion otherwise, which surfaces as `HasHistoryError`.
 */
export class HasHistoryError extends Error {
  constructor() {
    super('Medication has records or stock history');
  }
}

export async function deleteMedication(id: string): Promise<void> {
  const { error } = await supabase.from('medications').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') throw new HasHistoryError();
    throw error;
  }
}
