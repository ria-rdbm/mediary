import { supabase } from '@/lib/supabase';
import { captureLocalDateTime, localDateKey } from '@/lib/dateTime';
import { SEVERITY_LABELS } from '@/constants/symptoms';
import { CATEGORY_LABELS } from '@/constants/categories';
import type { HistoryItem, HistoryRecordType } from '@/types/domain';

export interface HistoryFilter {
  startDateKey?: string;
  endDateKey?: string;
  types?: HistoryRecordType[];
  medicationId?: string | null;
  searchText?: string;
}

interface MedicationLookupEntry {
  name: string;
  color: string | null;
  category: string;
}

async function medicationLookup(): Promise<Map<string, MedicationLookupEntry>> {
  const { data, error } = await supabase.from('medications').select('id, name, color, category');
  if (error) throw error;
  return new Map(data.map((m) => [m.id, { name: m.name, color: m.color, category: m.category }]));
}

function withinRange(localDate: string, filter: HistoryFilter): boolean {
  const key = localDateKey(localDate);
  if (filter.startDateKey && key < filter.startDateKey) return false;
  if (filter.endDateKey && key > filter.endDateKey) return false;
  return true;
}

export async function fetchHistory(filter: HistoryFilter = {}): Promise<HistoryItem[]> {
  const medications = await medicationLookup();
  const items: HistoryItem[] = [];
  const wantsType = (t: HistoryRecordType) => !filter.types?.length || filter.types.includes(t);

  if (wantsType('treatment')) {
    let query = supabase.from('treatment_records').select('*').order('occurred_utc', { ascending: false });
    if (filter.medicationId) query = query.eq('medication_id', filter.medicationId);
    const { data, error } = await query;
    if (error) throw error;
    for (const r of data ?? []) {
      if (!withinRange(r.occurred_local, filter)) continue;
      const med = medications.get(r.medication_id);
      items.push({
        id: r.id,
        type: 'treatment',
        occurredLocal: r.occurred_local,
        medicationId: r.medication_id,
        title: med?.name ?? 'Medication',
        subtitle: r.taken
          ? [r.amount ? `${r.amount} ${r.amount_unit}` : null, r.site ?? r.treatment_area].filter(Boolean).join(' · ') || 'Taken'
          : 'Not recorded',
      });
    }
  }

  if (wantsType('symptom') && !filter.medicationId) {
    const { data, error } = await supabase.from('symptoms').select('*').order('start_utc', { ascending: false });
    if (error) throw error;
    for (const s of data ?? []) {
      if (!withinRange(s.start_local, filter)) continue;
      items.push({
        id: s.id,
        type: 'symptom',
        occurredLocal: s.start_local,
        medicationId: s.medication_id,
        title: s.name,
        subtitle: SEVERITY_LABELS[s.severity as keyof typeof SEVERITY_LABELS],
      });
    }
  }

  if (wantsType('weight') && !filter.medicationId) {
    const { data, error } = await supabase.from('weight_records').select('*').order('recorded_utc', { ascending: false });
    if (error) throw error;
    for (const w of data ?? []) {
      if (!withinRange(w.recorded_local, filter)) continue;
      items.push({
        id: w.id,
        type: 'weight',
        occurredLocal: w.recorded_local,
        medicationId: null,
        title: 'Weight',
        subtitle: `${w.weight_kg} kg`,
      });
    }
  }

  if (wantsType('note')) {
    let query = supabase.from('notes').select('*').order('occurred_utc', { ascending: false });
    if (filter.medicationId) query = query.eq('medication_id', filter.medicationId);
    const { data, error } = await query;
    if (error) throw error;
    for (const n of data ?? []) {
      if (!withinRange(n.occurred_local, filter)) continue;
      items.push({
        id: n.id,
        type: 'note',
        occurredLocal: n.occurred_local,
        medicationId: n.medication_id,
        title: 'Note',
        subtitle: n.note,
      });
    }
  }

  if (wantsType('appointment')) {
    let query = supabase.from('appointments').select('*').order('visit_utc', { ascending: false });
    if (filter.medicationId) query = query.eq('medication_id', filter.medicationId);
    const { data, error } = await query;
    if (error) throw error;
    for (const a of data ?? []) {
      if (!withinRange(a.visit_local, filter)) continue;
      items.push({
        id: a.id,
        type: 'appointment',
        occurredLocal: a.visit_local,
        medicationId: a.medication_id,
        title: 'Appointment',
        subtitle: a.provider_name_snapshot,
      });
    }
  }

  if (wantsType('stock')) {
    let query = supabase
      .from('stock_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);
    if (filter.medicationId) query = query.eq('medication_id', filter.medicationId);
    const { data, error } = await query;
    if (error) throw error;
    for (const t of data ?? []) {
      const occurredLocal = captureLocalDateTime(new Date(t.created_at)).local;
      const localKey = localDateKey(occurredLocal);
      if (filter.startDateKey && localKey < filter.startDateKey) continue;
      if (filter.endDateKey && localKey > filter.endDateKey) continue;
      const med = medications.get(t.medication_id);
      const label =
        t.type === 'add'
          ? 'Stock added'
          : t.type === 'manual_adjustment'
            ? 'Manual adjustment'
            : t.type === 'reversal'
              ? 'Stock reversal'
              : 'Stock used';
      items.push({
        id: t.id,
        type: 'stock',
        occurredLocal,
        medicationId: t.medication_id,
        title: `${med?.name ?? 'Medication'} — ${label}`,
        subtitle: `${t.quantity > 0 ? '+' : ''}${t.quantity} ${t.stock_unit}`,
      });
    }
  }

  let results = items.sort((a, b) => (a.occurredLocal < b.occurredLocal ? 1 : -1));

  if (filter.searchText) {
    const q = filter.searchText.trim().toLowerCase();
    if (q) {
      results = results.filter(
        (item) => item.title.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q),
      );
    }
  }

  return results;
}

export function categoryLabelFor(category: string): string {
  return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
}
