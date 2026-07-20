// Single currency helper. Money is ALWAYS integer cents (smallest currency unit).
// Onvo amounts are in the smallest unit: ₡2,500.00 -> 250000. Never inline the ×100.

/** Convert a major-unit decimal (e.g. 2500.00 colones) to integer cents. */
export function toCents(major: number): number {
  return Math.round(major * 100);
}

/** Convert integer cents back to a major-unit number. */
export function fromCents(cents: number): number {
  return cents / 100;
}
