import { buildHistoryShareText } from '@/services/export';
import { fetchHistory } from '@/services/history';

jest.mock('@/services/history', () => ({ fetchHistory: jest.fn() }));

const item = (over: Record<string, unknown>) => ({
  id: 'x',
  medicationId: null,
  subtitle: null,
  ...over,
});

describe('buildHistoryShareText', () => {
  it('groups by day newest first, skips stock, and describes each type', async () => {
    (fetchHistory as jest.Mock).mockResolvedValue([
      item({ id: '1', type: 'treatment', occurredLocal: '2026-10-11T17:00:00', title: 'Ozempic', subtitle: '0.5 mg · Abdomen Left' }),
      item({ id: '2', type: 'weight', occurredLocal: '2026-10-11T08:00:00', title: 'Weight', subtitle: '71.2 kg' }),
      item({ id: '3', type: 'stock', occurredLocal: '2026-10-11T07:00:00', title: 'Ozempic — Stock used', subtitle: '-1 pen' }),
      item({ id: '4', type: 'symptom', occurredLocal: '2026-10-08T09:10:00', title: 'Nausea', subtitle: 'Mild' }),
    ]);
    const { text, itemCount } = await buildHistoryShareText('2026-10-01', '2026-10-11');
    expect(itemCount).toBe(3);
    expect(text).toContain('Period: 2026-10-01 to 2026-10-11');
    expect(text).toContain('Ozempic 0.5 mg · Abdomen Left');
    expect(text).toContain('Weight 71.2 kg');
    expect(text).toContain('Symptom: Nausea (Mild)');
    expect(text).not.toContain('Stock used');
    expect(text.indexOf('11 Oct 2026')).toBeLessThan(text.indexOf('8 Oct 2026'));
  });
});
