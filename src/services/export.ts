import { fetchHistory } from '@/services/history';
import { formatLocalDayHeading, formatLocalDate, formatLocalTime, localDateKey } from '@/lib/dateTime';
import { STATUS_LABELS } from '@/constants/categories';
import { formatAmount } from '@/lib/formatAmount';
import type { HistoryItem, WeightRecord } from '@/types/domain';
import type { HealthSummaryData } from '@/services/healthSummary';

function describe(item: HistoryItem): string {
  switch (item.type) {
    case 'treatment':
      return item.subtitle === 'Not recorded'
        ? `${item.title} (not taken)`
        : [item.title, item.subtitle].filter(Boolean).join(' ');
    case 'symptom':
      return `Symptom: ${item.title}${item.subtitle ? ` (${item.subtitle})` : ''}`;
    case 'weight':
      return `Weight ${item.subtitle ?? ''}`.trim();
    case 'note':
      return `Note: ${item.subtitle ?? ''}`.trim();
    case 'appointment':
      return `Appointment${item.subtitle ? `: ${item.subtitle}` : ''}`;
    default:
      return `${item.title}${item.subtitle ? ` ${item.subtitle}` : ''}`;
  }
}

/**
 * Plain-text history for a date range, grouped by day (newest first), meant
 * for the system share sheet. Stock movements are left out on purpose.
 */
export async function buildHistoryShareText(
  startDateKey: string,
  endDateKey: string,
): Promise<{ text: string; itemCount: number }> {
  const all = await fetchHistory({ startDateKey, endDateKey });
  const items = all.filter((i) => i.type !== 'stock');

  const byDay = new Map<string, HistoryItem[]>();
  for (const item of items) {
    const key = localDateKey(item.occurredLocal);
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }

  const lines = ['Mediary history', `Period: ${startDateKey} to ${endDateKey}`];
  for (const [dateKey, dayItems] of [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))) {
    lines.push('', formatLocalDayHeading(`${dateKey}T00:00:00`));
    for (const item of dayItems) {
      lines.push(`• ${formatLocalTime(item.occurredLocal)}  ${describe(item)}`);
    }
  }
  return { text: lines.join('\n'), itemCount: items.length };
}

function weightTrendLines(records: WeightRecord[]): string[] {
  if (records.length === 0) return [];
  const chronological = [...records].reverse();
  const first = chronological[0];
  const latest = chronological[chronological.length - 1];
  const lines = ['', 'WEIGHT TREND', `${latest.weightKg.toFixed(1)} kg (latest)`];
  if (chronological.length > 1) {
    lines.push(`${formatLocalDate(first.recordedLocal)}: ${first.weightKg.toFixed(1)} kg  →  ${formatLocalDate(latest.recordedLocal)}: ${latest.weightKg.toFixed(1)} kg`);
  }
  return lines;
}

/**
 * Plain-text version of a Health Summary report (the same medications,
 * records, symptoms, appointments and weight trend shown on screen), meant
 * for the system share sheet so it can be sent to a provider via Messages,
 * Mail, etc.
 */
export function buildHealthSummaryShareText(
  data: HealthSummaryData,
  startDateKey: string,
  endDateKey: string,
): string {
  const lines = ['Mediary health summary', `Period: ${startDateKey} to ${endDateKey}`];

  for (const section of data.sections) {
    const { medication, records, symptoms, appointments } = section;
    lines.push('', `${medication.name.toUpperCase()} — ${STATUS_LABELS[medication.status]}`);

    if (records.length > 0) {
      lines.push('Records:');
      for (const record of records) {
        const detail = record.taken
          ? [formatAmount(record.amount, record.amountUnit, record.amountUnitCustom), record.site ?? record.treatmentArea]
              .filter(Boolean)
              .join(' · ') || 'Taken'
          : 'Not recorded';
        lines.push(`• ${formatLocalDate(record.occurredLocal)} ${formatLocalTime(record.occurredLocal)}  ${detail}`);
        if (record.notes) lines.push(`  Note: ${record.notes}`);
      }
    }

    if (symptoms.length > 0) {
      lines.push('Linked symptoms:');
      for (const symptom of symptoms) {
        lines.push(`• ${formatLocalDate(symptom.startLocal)}  ${symptom.name} — ${symptom.severity}`);
      }
    }

    if (appointments.length > 0) {
      lines.push('Linked appointments:');
      for (const appointment of appointments) {
        lines.push(`• ${formatLocalDate(appointment.visitLocal)} ${formatLocalTime(appointment.visitLocal)}`);
        if (appointment.providerInstructions) lines.push(`  Provider instructions: ${appointment.providerInstructions}`);
        if (appointment.treatmentChanges) lines.push(`  Changes: ${appointment.treatmentChanges}`);
      }
    }

    if (records.length === 0 && symptoms.length === 0 && appointments.length === 0) {
      lines.push('No records in this period.');
    }
  }

  lines.push(...weightTrendLines(data.weightRecords));

  return lines.join('\n');
}
