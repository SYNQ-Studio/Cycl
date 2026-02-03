export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function formatCentsPlain(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatAprBps(aprBps: number): string {
  return (aprBps / 100).toFixed(2);
}

export function parseCurrencyToCents(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (cleaned.length === 0) return null;
  const parsed = Number.parseFloat(cleaned);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

export function parseAprToBps(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (cleaned.length === 0) return null;
  const parsed = Number.parseFloat(cleaned);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

export function parseDayOfMonth(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (Number.isNaN(parsed)) return null;
  if (parsed < 1 || parsed > 31) return null;
  return parsed;
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}
