import { supabase } from '@/lib/supabase';
import { parseDateKey } from '@/lib/dateTime';
import { mapMedication, mapTreatmentRecord, mapSymptom, mapWeightRecord } from '@/lib/mappers';
import type { Medication, TreatmentRecord, Symptom, WeightRecord } from '@/types/domain';

export interface ShareSummaryData {
  medications: Medication[];
  records: TreatmentRecord[]; // taken records only, newest first
  symptoms: Symptom[]; // newest first
  weightRecords: WeightRecord[]; // oldest first
}

/** Everything the shareable summary image needs for one period, across all medications. */
export async function fetchShareSummary(startDateKey: string, endDateKey: string): Promise<ShareSummaryData> {
  // Date keys are the user's local days, so bound the range by local midnight.
  const startUtc = parseDateKey(startDateKey).toISOString();
  const endDay = parseDateKey(endDateKey);
  endDay.setDate(endDay.getDate() + 1);
  const endUtc = new Date(endDay.getTime() - 1).toISOString();

  const [medicationsRes, recordsRes, symptomsRes, weightRes] = await Promise.all([
    supabase.from('medications').select('*'),
    supabase
      .from('treatment_records')
      .select('*')
      .eq('taken', true)
      .gte('occurred_utc', startUtc)
      .lte('occurred_utc', endUtc)
      .order('occurred_utc', { ascending: false }),
    supabase
      .from('symptoms')
      .select('*')
      .gte('start_utc', startUtc)
      .lte('start_utc', endUtc)
      .order('start_utc', { ascending: false }),
    supabase
      .from('weight_records')
      .select('*')
      .gte('recorded_utc', startUtc)
      .lte('recorded_utc', endUtc)
      .order('recorded_utc', { ascending: true }),
  ]);
  if (medicationsRes.error) throw medicationsRes.error;
  if (recordsRes.error) throw recordsRes.error;
  if (symptomsRes.error) throw symptomsRes.error;
  if (weightRes.error) throw weightRes.error;

  return {
    medications: medicationsRes.data.map(mapMedication),
    records: recordsRes.data.map(mapTreatmentRecord),
    symptoms: symptomsRes.data.map(mapSymptom),
    weightRecords: weightRes.data.map(mapWeightRecord),
  };
}
