/**
 * Formats a p-value for display. Values below 0.0001 are never shown as 0.0000.
 */
export function formatP(p: number | null | undefined): string {
  if (p === null || p === undefined || Number.isNaN(p)) return '—';
  if (p < 0.0001) return '< 0.0001';
  return p.toFixed(4);
}

/**
 * Formats a signed number with a fixed number of decimals ("+0.133", "-1.20").
 */
export function formatSigned(value: number, digits = 3): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}`;
}
