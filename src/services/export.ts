import { fetchHistory } from '@/services/history';
import { formatLocalDate, formatLocalTime } from '@/lib/dateTime';

function csvCell(value: string | null | undefined): string {
  const text = value ?? '';
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Every history entry as CSV (newest first), ready for the share sheet. */
export async function buildHistoryCsv(): Promise<{ csv: string; rowCount: number }> {
  const items = await fetchHistory({});
  const rows = items.map((item) =>
    [
      formatLocalDate(item.occurredLocal, 'yyyy-MM-dd'),
      formatLocalTime(item.occurredLocal),
      item.type,
      item.title,
      item.subtitle,
    ]
      .map(csvCell)
      .join(','),
  );
  return { csv: ['Date,Time,Type,Title,Details', ...rows].join('\n'), rowCount: rows.length };
}
