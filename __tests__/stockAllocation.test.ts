import { allocateDeduction, orderBatchesForAllocation } from '@/lib/stockAllocation';
import type { AllocatableBatch } from '@/lib/stockAllocation';

function batch(id: string, quantity: number, expiryDate: string | null, createdAt: string): AllocatableBatch {
  return { id, quantity, expiryDate, createdAt };
}

describe('orderBatchesForAllocation', () => {
  it('sorts batches with an expiry date before batches without one', () => {
    const batches = [
      batch('no-expiry', 10, null, '2026-01-01T00:00:00Z'),
      batch('has-expiry', 10, '2026-06-01', '2026-02-01T00:00:00Z'),
    ];
    const ordered = orderBatchesForAllocation(batches);
    expect(ordered.map((b) => b.id)).toEqual(['has-expiry', 'no-expiry']);
  });

  it('orders batches that both have expiry dates by soonest first', () => {
    const batches = [
      batch('later', 10, '2026-12-01', '2026-01-01T00:00:00Z'),
      batch('sooner', 10, '2026-03-01', '2026-01-02T00:00:00Z'),
    ];
    const ordered = orderBatchesForAllocation(batches);
    expect(ordered.map((b) => b.id)).toEqual(['sooner', 'later']);
  });

  it('falls back to oldest-added-first when expiry is absent or equal (section 33)', () => {
    const batches = [
      batch('newer', 10, null, '2026-02-01T00:00:00Z'),
      batch('older', 10, null, '2026-01-01T00:00:00Z'),
    ];
    const ordered = orderBatchesForAllocation(batches);
    expect(ordered.map((b) => b.id)).toEqual(['older', 'newer']);
  });
});

describe('allocateDeduction', () => {
  it('matches the exact worked example from the spec: 2 + 100, use 9 -> 0 and 93', () => {
    const batches = [
      batch('A', 2, '2026-01-01', '2026-01-01T00:00:00Z'),
      batch('B', 100, '2026-06-01', '2026-01-02T00:00:00Z'),
    ];
    const result = allocateDeduction(batches, 9);

    expect(result.deducted).toBe(9);
    expect(result.shortfall).toBe(0);
    expect(result.allocations).toEqual([
      { batchId: 'A', quantity: 2 },
      { batchId: 'B', quantity: 7 },
    ]);
  });

  it('takes everything from a single batch when it covers the full amount', () => {
    const batches = [batch('A', 50, null, '2026-01-01T00:00:00Z')];
    const result = allocateDeduction(batches, 10);
    expect(result.allocations).toEqual([{ batchId: 'A', quantity: 10 }]);
    expect(result.shortfall).toBe(0);
  });

  it('never deducts more than is recorded and reports the shortfall instead (section 34)', () => {
    const batches = [batch('A', 3, null, '2026-01-01T00:00:00Z')];
    const result = allocateDeduction(batches, 10);

    expect(result.deducted).toBe(3);
    expect(result.shortfall).toBe(7);
    expect(result.allocations).toEqual([{ batchId: 'A', quantity: 3 }]);
  });

  it('ignores already-empty batches entirely', () => {
    const batches = [
      batch('empty', 0, '2026-01-01', '2026-01-01T00:00:00Z'),
      batch('full', 5, '2026-02-01', '2026-01-01T00:00:00Z'),
    ];
    const result = allocateDeduction(batches, 5);
    expect(result.allocations).toEqual([{ batchId: 'full', quantity: 5 }]);
  });

  it('is a no-op for zero or negative requested quantity', () => {
    const batches = [batch('A', 10, null, '2026-01-01T00:00:00Z')];
    expect(allocateDeduction(batches, 0)).toEqual({ allocations: [], deducted: 0, shortfall: 0 });
    expect(allocateDeduction(batches, -5)).toEqual({ allocations: [], deducted: 0, shortfall: 0 });
  });

  it('reports a total shortfall when there is no stock at all', () => {
    const result = allocateDeduction([], 4);
    expect(result).toEqual({ allocations: [], deducted: 0, shortfall: 4 });
  });
});
