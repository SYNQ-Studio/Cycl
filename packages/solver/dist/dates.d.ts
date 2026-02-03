/**
 * Pure date utilities for next statement close and due date occurrence.
 * All functions are side-effect free.
 */
/**
 * Number of days in the given month (UTC).
 * monthIndex is 0-based (0 = January, 11 = December).
 */
export declare function daysInMonthUtc(year: number, monthIndex: number): number;
/**
 * Next occurrence of a day-of-month on or after the reference date (UTC).
 * dayOfMonth is 1–31; clamped to the actual days in the month.
 * Pure: same inputs always produce the same output.
 */
export declare function nextDateFromDayOfMonth(dayOfMonth: number, referenceDate: Date): Date;
/**
 * Next occurrence of statement close date as ISO string (YYYY-MM-DD).
 * dayOfMonth is 1–31 (e.g. from card.statementCloseDay).
 * Pure: same inputs always produce the same output.
 *
 * @param dayOfMonth - Day of month (1–31) for statement close
 * @param referenceDate - Reference date (e.g. today)
 * @returns Next statement close date in YYYY-MM-DD format
 */
export declare function getNextStatementCloseDate(dayOfMonth: number, referenceDate: Date): string;
/**
 * Next occurrence of due date as ISO string (YYYY-MM-DD).
 * dayOfMonth is 1–31 (e.g. from card.dueDateDay).
 * Pure: same inputs always produce the same output.
 *
 * @param dayOfMonth - Day of month (1–31) for due date
 * @param referenceDate - Reference date (e.g. today)
 * @returns Next due date in YYYY-MM-DD format
 */
export declare function getNextDueDate(dayOfMonth: number, referenceDate: Date): string;
//# sourceMappingURL=dates.d.ts.map