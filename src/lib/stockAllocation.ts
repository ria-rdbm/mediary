/**
 * Pure mirror of the batch-walk allocation algorithm implemented in
 * supabase/migrations/0011_stock_engine_functions.sql (`_stock_deduct`).
 * It exists so the exact ordering and shortfall rules from sections 33-34
 * can be unit tested without a database. If you change the ordering or
 * shortfall behaviour here, make the matching change in the SQL function —
 * the two are intentionally kept in lockstep, not derived from one another.
 */

export interface AllocatableBatch {
  id: string;
  quantity: number;
  expiryDate: string | null; // "YYYY-MM-DD" or null
  createdAt: string; // ISO timestamp, used as the tie-breaker
}

export interface BatchAllocation {
  batchId: string;
  quantity: number;
}

export interface AllocationResult {
  allocations: BatchAllocation[];
  deducted: number;
  shortfall: number;
}

/**
 * Order batches earliest-expiry-first; batches with no expiry sort after
 * every batch that has one, and ties (including "no expiry" vs "no
 * expiry") fall back to oldest-added-first.
 */
export function orderBatchesForAllocation(batches: AllocatableBatch[]): AllocatableBatch[] {
  return [...batches].sort((a, b) => {
    const aHasExpiry = a.expiryDate !== null;
    const bHasExpiry = b.expiryDate !== null;
    if (aHasExpiry !== bHasExpiry) return aHasExpiry ? -1 : 1;
    if (aHasExpiry && bHasExpiry && a.expiryDate !== b.expiryDate) {
      return a.expiryDate! < b.expiryDate! ? -1 : 1;
    }
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });
}

/**
 * Consume `quantity` (always positive) from the given batches, in
 * allocation order, never taking a batch below zero. If the batches don't
 * hold enough in total, deducts everything available and reports the
 * remainder as `shortfall` (section 34) rather than throwing.
 */
export function allocateDeduction(batches: AllocatableBatch[], quantity: number): AllocationResult {
  if (quantity <= 0) {
    return { allocations: [], deducted: 0, shortfall: 0 };
  }

  const ordered = orderBatchesForAllocation(batches.filter((b) => b.quantity > 0));
  const allocations: BatchAllocation[] = [];
  let remaining = quantity;

  for (const batch of ordered) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, batch.quantity);
    if (take > 0) {
      allocations.push({ batchId: batch.id, quantity: take });
      remaining -= take;
    }
  }

  return { allocations, deducted: quantity - remaining, shortfall: remaining };
}
