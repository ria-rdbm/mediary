/** "0.5 mg", "3 clicks" (custom unit), or just "0.5" when no unit was chosen. */
export function formatAmount(
  amount: number | string | null | undefined,
  unit: string | null | undefined,
  unitCustom?: string | null,
): string | null {
  if (amount == null || amount === '' || Number(amount) === 0) return null;
  const label = unit === 'Other' ? unitCustom?.trim() || null : unit;
  return label ? `${amount} ${label}` : String(amount);
}
