import { initialDateTimeForDateKey, todayDateKey } from '@/lib/dateTime';

describe('initialDateTimeForDateKey', () => {
  it('falls back to now for a missing or invalid key', () => {
    const today = todayDateKey();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(fmt(initialDateTimeForDateKey(undefined))).toBe(today);
    expect(fmt(initialDateTimeForDateKey('nonsense'))).toBe(today);
  });

  it('uses the given past day', () => {
    const d = initialDateTimeForDateKey('2020-03-04');
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2020, 3, 4]);
  });

  it('clamps a future day to today unless future dates are allowed', () => {
    const future = '2099-01-02';
    expect(initialDateTimeForDateKey(future).getFullYear()).not.toBe(2099);
    const d = initialDateTimeForDateKey(future, true);
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2099, 1, 2]);
  });
});
