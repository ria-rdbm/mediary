import { fetchHistory } from '@/services/history';
import { formatLocalDayHeading, formatLocalTime, localDateKey } from '@/lib/dateTime';
import type { HistoryItem } from '@/types/domain';

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
