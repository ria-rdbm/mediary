import { supabase } from '@/lib/supabase';
import { mapMedication, mapTreatmentRecord, mapSymptom, mapAppointment, mapWeightRecord } from '@/lib/mappers';
import type { Medication, TreatmentRecord, Symptom, Appointment, WeightRecord } from '@/types/domain';

export interface HealthSummarySection {
  medication: Medication;
  records: TreatmentRecord[];
  symptoms: Symptom[];
  appointments: Appointment[];
}

export interface HealthSummaryData {
  sections: HealthSummarySection[];
  weightRecords: WeightRecord[];
}

export async function fetchHealthSummary(
  medicationIds: string[],
  startDateKey: string,
  endDateKey: string,
  includeWeight: boolean,
): Promise<HealthSummaryData> {
  const startUtc = `${startDateKey}T00:00:00.000Z`;
  const endUtc = `${endDateKey}T23:59:59.999Z`;

  const { data: medicationRows, error: medError } = await supabase
    .from('medications')
    .select('*')
    .in('id', medicationIds);
  if (medError) throw medError;

  const sections: HealthSummarySection[] = [];

  for (const medicationRow of medicationRows ?? []) {
    const [recordsRes, symptomsRes, appointmentsRes] = await Promise.all([
      supabase
        .from('treatment_records')
        .select('*')
        .eq('medication_id', medicationRow.id)
        .gte('occurred_utc', startUtc)
        .lte('occurred_utc', endUtc)
        .order('occurred_utc', { ascending: true }),
      supabase
        .from('symptoms')
        .select('*')
        .eq('medication_id', medicationRow.id)
        .gte('start_utc', startUtc)
        .lte('start_utc', endUtc)
        .order('start_utc', { ascending: true }),
      supabase
        .from('appointments')
        .select('*')
        .eq('medication_id', medicationRow.id)
        .gte('visit_utc', startUtc)
        .lte('visit_utc', endUtc)
        .order('visit_utc', { ascending: true }),
    ]);

    if (recordsRes.error) throw recordsRes.error;
    if (symptomsRes.error) throw symptomsRes.error;
    if (appointmentsRes.error) throw appointmentsRes.error;

    sections.push({
      medication: mapMedication(medicationRow),
      records: recordsRes.data.map(mapTreatmentRecord),
      symptoms: symptomsRes.data.map(mapSymptom),
      appointments: appointmentsRes.data.map(mapAppointment),
    });
  }

  let weightRecords: WeightRecord[] = [];
  if (includeWeight) {
    const { data, error } = await supabase
      .from('weight_records')
      .select('*')
      .gte('recorded_utc', startUtc)
      .lte('recorded_utc', endUtc)
      .order('recorded_utc', { ascending: true });
    if (error) throw error;
    weightRecords = data.map(mapWeightRecord);
  }

  return { sections, weightRecords };
}
