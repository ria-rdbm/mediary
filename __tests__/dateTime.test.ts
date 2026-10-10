import {
  captureLocalDateTime,
  formatLocalDate,
  formatLocalTime,
  formatLocalDateTime,
  isFutureLocalDateTime,
  isFutureLocalDate,
  todayDateKey,
  localDateKey,
  defaultRecordTime,
} from '@/lib/dateTime';

describe('captureLocalDateTime', () => {
  it('preserves the wall-clock value regardless of later device timezone changes', () => {
    // Simulate "8:00 PM in New Zealand" by constructing the Date with the
    // LOCAL constructor (as a date/time picker would hand back) — the
    // stored `local` string must read exactly these numbers forever,
    // independent of what timezone the device is later changed to.
    const nzEntry = new Date(2026, 9, 7, 20, 0, 0); // 7 Oct 2026, 8:00 PM
    const { local } = captureLocalDateTime(nzEntry);

    expect(local).toBe('2026-10-07T20:00:00');
    expect(formatLocalDate(local)).toBe('7 Oct 2026');
  });

  it('computes a UTC offset consistent with Date.getTimezoneOffset()', () => {
    const date = new Date(2026, 0, 15, 9, 30, 0);
    const { utcOffsetMinutes } = captureLocalDateTime(date);
    expect(utcOffsetMinutes).toBe(-date.getTimezoneOffset());
  });

  it('derives the UTC instant as the local wall-clock value shifted by the offset', () => {
    const date = new Date(2026, 5, 1, 23, 45, 0);
    const { local, utc, utcOffsetMinutes } = captureLocalDateTime(date);

    const [datePart, timePart] = local.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    const civilMillis = Date.UTC(y, m - 1, d, hh, mm, 0);
    const expectedUtcMillis = civilMillis - utcOffsetMinutes * 60000;

    expect(new Date(utc).getTime()).toBe(expectedUtcMillis);
  });
});

describe('formatLocalTime', () => {
  it('formats using a fixed hour/minute regardless of current locale time', () => {
    const local = '2026-10-07T08:05:00';
    const formatted = formatLocalTime(local);
    // Accept either 12h or 24h rendering depending on the test runner's ICU data,
    // but the hour/minute digits must always be present somewhere in the output.
    expect(formatted).toMatch(/8:05|08:05/);
  });
});

describe('formatLocalDateTime', () => {
  it('combines date and time for display', () => {
    const local = '2026-10-07T20:00:00';
    expect(formatLocalDateTime(local)).toContain('7 Oct 2026');
  });
});

describe('isFutureLocalDateTime', () => {
  it('returns false for a time at or before now', () => {
    const now = new Date(2026, 9, 7, 12, 0, 0);
    const { local } = captureLocalDateTime(new Date(2026, 9, 7, 11, 59, 0));
    expect(isFutureLocalDateTime(local, now)).toBe(false);
  });

  it('returns true for a time after now (future completed records are blocked)', () => {
    const now = new Date(2026, 9, 7, 12, 0, 0);
    const { local } = captureLocalDateTime(new Date(2026, 9, 7, 12, 1, 0));
    expect(isFutureLocalDateTime(local, now)).toBe(true);
  });
});

describe('isFutureLocalDate', () => {
  it('compares date-only keys', () => {
    const now = new Date(2026, 9, 7);
    expect(isFutureLocalDate('2026-10-08', now)).toBe(true);
    expect(isFutureLocalDate('2026-10-07', now)).toBe(false);
    expect(isFutureLocalDate('2026-10-06', now)).toBe(false);
  });
});

describe('todayDateKey / localDateKey', () => {
  it('extracts the date portion consistently', () => {
    const now = new Date(2026, 9, 7, 23, 0, 0);
    expect(todayDateKey(now)).toBe('2026-10-07');
    expect(localDateKey('2026-10-07T23:00:00')).toBe('2026-10-07');
  });
});

describe('defaultRecordTime', () => {
  it('rounds the minute down to :00, keeping the hour (section 19)', () => {
    const now = new Date(2026, 9, 7, 19, 43, 12);
    const rounded = defaultRecordTime(now);
    expect(rounded.getHours()).toBe(19);
    expect(rounded.getMinutes()).toBe(0);
    expect(rounded.getSeconds()).toBe(0);
  });
});
