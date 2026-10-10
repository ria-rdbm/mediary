import { format, parse, isValid } from 'date-fns';

/**
 * Mediary stores every health-record timestamp as a "local civil" value —
 * the wall-clock date/time exactly as the user entered it, e.g.
 * "2026-10-07T20:00:00" — plus the UTC offset that was in effect when it
 * was recorded. Display ALWAYS uses the local civil value, never a
 * re-interpretation through the device's current timezone. This is what
 * keeps a record made in New Zealand reading "7 Oct, 8:00 PM" even after
 * the user travels to Korea.
 *
 * `occurredUtc` (a true UTC instant) exists only so the database can sort
 * and range-filter records efficiently — it is never used for display.
 */
export type LocalDateTime = {
  /** Civil wall-clock value, no zone: "YYYY-MM-DDTHH:mm:00" */
  local: string;
  /** True UTC instant, ISO 8601, for sorting/filtering only */
  utc: string;
  /** Minutes ahead of UTC at the moment of recording (NZDT = 780) */
  utcOffsetMinutes: number;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Capture a JS Date (interpreted via the device's CURRENT local getters,
 * which is correct whether it came from "now" or from a date/time picker)
 * into a LocalDateTime record.
 */
export function captureLocalDateTime(date: Date): LocalDateTime {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = date.getHours();
  const mm = date.getMinutes();
  const local = `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00`;
  const offsetMinutes = -date.getTimezoneOffset();
  const civilMillis = Date.UTC(y, m - 1, d, hh, mm, 0);
  const utcMillis = civilMillis - offsetMinutes * 60000;
  return { local, utc: new Date(utcMillis).toISOString(), utcOffsetMinutes: offsetMinutes };
}

/** Combine a date-only picker value with a time-only picker value. */
export function combineDateAndTime(datePart: Date, timePart: Date): Date {
  const combined = new Date(datePart);
  combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return combined;
}

/** Default time for a new record: current hour, minute rounded to :00. */
export function defaultRecordTime(now: Date = new Date()): Date {
  const rounded = new Date(now);
  rounded.setMinutes(0, 0, 0);
  return rounded;
}

/** Parse a stored local civil string back into a displayable Date object. */
function parseLocalForDisplay(local: string): Date {
  const [datePart, timePart] = local.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = (timePart ?? '00:00:00').split(':').map(Number);
  // Constructed with the LOCAL Date constructor on purpose: date-fns'
  // format() reads getFullYear/getHours/etc, and the local constructor
  // guarantees those getters return exactly these numbers regardless of
  // the device's current timezone.
  return new Date(y, m - 1, d, hh, mm, 0);
}

const uses24Hour = (() => {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
    return !parts.hour12;
  } catch {
    return false;
  }
})();

export function formatLocalDate(local: string, pattern = 'd MMM yyyy'): string {
  return format(parseLocalForDisplay(local), pattern);
}

export function formatLocalTime(local: string): string {
  return format(parseLocalForDisplay(local), uses24Hour ? 'HH:mm' : 'h:mm a');
}

export function formatLocalDateTime(local: string): string {
  return `${formatLocalDate(local)}, ${formatLocalTime(local)}`;
}

export function formatLocalDayHeading(local: string): string {
  return format(parseLocalForDisplay(local), 'EEEE, d MMM yyyy');
}

/** Today's date in the device's current local terms, as "YYYY-MM-DD". */
export function todayDateKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function localDateKey(local: string): string {
  return local.slice(0, 10);
}

/**
 * True if the given local civil date/time is strictly after the device's
 * current moment — used to block future "completed" treatment records
 * while still allowing same-day entries at any time.
 */
export function isFutureLocalDateTime(local: string, now: Date = new Date()): boolean {
  return parseLocalForDisplay(local).getTime() > now.getTime();
}

export function isFutureLocalDate(dateKey: string, now: Date = new Date()): boolean {
  return dateKey > todayDateKey(now);
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidDateKey(dateKey: string): boolean {
  return isValid(parse(dateKey, 'yyyy-MM-dd', new Date()));
}
