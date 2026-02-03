/**
 * Pure date utilities for next statement close and due date occurrence.
 * All functions are side-effect free.
 */

/**
 * Number of days in the given month (UTC).
 * monthIndex is 0-based (0 = January, 11 = December).
 */
export function daysInMonthUtc(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Next occurrence of a day-of-month on or after the reference date (UTC).
 * dayOfMonth is 1–31; clamped to the actual days in the month.
 * Pure: same inputs always produce the same output.
 */
export function nextDateFromDayOfMonth(
  dayOfMonth: number,
  referenceDate: Date
): Date {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const todayUtc = new Date(Date.UTC(year, month, referenceDate.getUTCDate()));
  const currentDay = Math.min(dayOfMonth, daysInMonthUtc(year, month));
  const candidate = new Date(Date.UTC(year, month, currentDay));

  if (candidate >= todayUtc) {
    return candidate;
  }

  const nextMonth = month + 1;
  const nextYear = year + Math.floor(nextMonth / 12);
  const nextMonthIndex = nextMonth % 12;
  const nextDay = Math.min(
    dayOfMonth,
    daysInMonthUtc(nextYear, nextMonthIndex)
  );

  return new Date(Date.UTC(nextYear, nextMonthIndex, nextDay));
}

/**
 * Formats a Date as ISO date string (YYYY-MM-DD).
 */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Next occurrence of statement close date as ISO string (YYYY-MM-DD).
 * dayOfMonth is 1–31 (e.g. from card.statementCloseDay).
 * Pure: same inputs always produce the same output.
 *
 * @param dayOfMonth - Day of month (1–31) for statement close
 * @param referenceDate - Reference date (e.g. today)
 * @returns Next statement close date in YYYY-MM-DD format
 */
export function getNextStatementCloseDate(
  dayOfMonth: number,
  referenceDate: Date
): string {
  return toIsoDate(nextDateFromDayOfMonth(dayOfMonth, referenceDate));
}

/**
 * Next occurrence of due date as ISO string (YYYY-MM-DD).
 * dayOfMonth is 1–31 (e.g. from card.dueDateDay).
 * Pure: same inputs always produce the same output.
 *
 * @param dayOfMonth - Day of month (1–31) for due date
 * @param referenceDate - Reference date (e.g. today)
 * @returns Next due date in YYYY-MM-DD format
 */
export function getNextDueDate(
  dayOfMonth: number,
  referenceDate: Date
): string {
  return toIsoDate(nextDateFromDayOfMonth(dayOfMonth, referenceDate));
}
