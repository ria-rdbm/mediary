import { supabase } from '@/lib/supabase';
import { mapTreatmentRecord } from '@/lib/mappers';
import { captureLocalDateTime, isFutureLocalDateTime } from '@/lib/dateTime';
import type { TreatmentRecord } from '@/types/domain';
import type { DoseUnit, InjectionSite } from '@/constants/units';

export interface LogTreatmentInput {
  medicationId: string;
  taken: boolean;
  occurredAt: Date;
  amount?: number | null;
  amountUnit?: DoseUnit | null;
  amountUnitCustom?: string | null;
  site?: InjectionSite | null;
  siteCustom?: string | null;
  treatmentArea?: string | null;
  notes?: string | null;
  stockUsed?: number | null;
}

export interface LogTreatmentResult {
  record: TreatmentRecord;
  stockDeducted: number;
  stockShortfall: number;
  cancelledReminderNotificationId: string | null;
}

function assertNotFuture(occurredAt: Date) {
  const { local } = captureLocalDateTime(occurredAt);
  if (isFutureLocalDateTime(local)) {
    throw new Error('Future completed records are not allowed. Use a reminder instead.');
  }
}

export async function logTreatmentRecord(input: LogTreatmentInput): Promise<LogTreatmentResult> {
  assertNotFuture(input.occurredAt);
  const { local, utc, utcOffsetMinutes } = captureLocalDateTime(input.occurredAt);

  const { data, error } = await supabase.rpc('log_treatment_record', {
    p_medication_id: input.medicationId,
    p_taken: input.taken,
    p_occurred_local: local,
    p_occurred_utc: utc,
    p_utc_offset_minutes: utcOffsetMinutes,
    p_amount: input.amount ?? null,
    p_amount_unit: input.amountUnit ?? null,
    p_amount_unit_custom: input.amountUnitCustom ?? null,
    p_site: input.site ?? null,
    p_site_custom: input.siteCustom ?? null,
    p_treatment_area: input.treatmentArea ?? null,
    p_notes: input.notes ?? null,
    p_stock_used: input.stockUsed ?? null,
  });
  if (error) throw error;

  return {
    record: mapTreatmentRecord(data.record),
    stockDeducted: data.stock_deducted,
    stockShortfall: data.stock_shortfall,
    cancelledReminderNotificationId: data.cancelled_reminder_notification_id,
  };
}

export async function updateTreatmentRecord(
  recordId: string,
  input: LogTreatmentInput,
): Promise<{ record: TreatmentRecord; stockDeducted: number; stockShortfall: number }> {
  assertNotFuture(input.occurredAt);
  const { local, utc, utcOffsetMinutes } = captureLocalDateTime(input.occurredAt);

  const { data, error } = await supabase.rpc('update_treatment_record', {
    p_record_id: recordId,
    p_medication_id: input.medicationId,
    p_taken: input.taken,
    p_occurred_local: local,
    p_occurred_utc: utc,
    p_utc_offset_minutes: utcOffsetMinutes,
    p_amount: input.amount ?? null,
    p_amount_unit: input.amountUnit ?? null,
    p_amount_unit_custom: input.amountUnitCustom ?? null,
    p_site: input.site ?? null,
    p_site_custom: input.siteCustom ?? null,
    p_treatment_area: input.treatmentArea ?? null,
    p_notes: input.notes ?? null,
    p_stock_used: input.stockUsed ?? null,
  });
  if (error) throw error;

  return {
    record: mapTreatmentRecord(data.record),
    stockDeducted: data.stock_deducted,
    stockShortfall: data.stock_shortfall,
  };
}

export async function deleteTreatmentRecord(recordId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_treatment_record', { p_record_id: recordId });
  if (error) throw error;
}

export async function recordStockUsage(
  recordId: string,
  stockUsed: number,
  rememberAsDefault: boolean,
): Promise<{ stockDeducted: number; stockShortfall: number }> {
  const { data, error } = await supabase.rpc('record_stock_usage', {
    p_record_id: recordId,
    p_stock_used: stockUsed,
    p_remember_default: rememberAsDefault,
  });
  if (error) throw error;
  return { stockDeducted: data.stock_deducted, stockShortfall: data.stock_shortfall };
}

export async function fetchTreatmentRecordsForMedication(medicationId: string): Promise<TreatmentRecord[]> {
  const { data, error } = await supabase
    .from('treatment_records')
    .select('*')
    .eq('medication_id', medicationId)
    .order('occurred_utc', { ascending: false });
  if (error) throw error;
  return data.map(mapTreatmentRecord);
}

export async function fetchTreatmentRecord(id: string): Promise<TreatmentRecord> {
  const { data, error } = await supabase.from('treatment_records').select('*').eq('id', id).single();
  if (error) throw error;
  return mapTreatmentRecord(data);
}

/** Taken records across all medications, newest first — for the Home snapshot. */
export async function fetchRecentTakenRecords(limit = 60): Promise<TreatmentRecord[]> {
  const { data, error } = await supabase
    .from('treatment_records')
    .select('*')
    .eq('taken', true)
    .order('occurred_utc', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(mapTreatmentRecord);
}
