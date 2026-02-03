/**
 * Main solver entry point: validation, allocation, and plan snapshot creation.
 * Deterministic: same inputs (and optional reference date) produce the same output.
 */
import type { PlanSnapshot } from "@ccpp/shared";
import type { CardMeta, Strategy } from "./types";
/** Options for deterministic plan generation (e.g. tests or reproducible runs). */
export interface GeneratePlanOptions {
    /** Reference date for due-date fallbacks and generatedAt; enables deterministic output. */
    referenceDate?: Date;
    /** Override plan ID; when set with referenceDate, output is fully reproducible. */
    planId?: string;
    /** Override generatedAt (ISO string); when set, used as snapshot timestamp. */
    generatedAt?: string;
}
/**
 * Generates a full plan: validates, allocates, and returns a PlanSnapshot.
 * Orchestrates validation, allocation, and snapshot creation.
 *
 * - Validation: throws ConstraintViolationError if cash cannot cover minimums.
 * - Plan ID and generatedAt: deterministic when options.referenceDate (and optionally planId/generatedAt) are set.
 * - Portfolio: total utilization (0–10 scale) and confidence from data completeness.
 *
 * @param cards - Card metadata with balances and terms
 * @param availableCashCents - Total cash available for payments (cents)
 * @param strategy - Strategy for distributing extra cash after minimums
 * @param options - Optional reference date and overrides for deterministic output
 * @returns PlanSnapshot with actions, portfolio metrics, focusSummary, and nextAction
 */
export declare function generatePlan(cards: CardMeta[], availableCashCents: number, strategy: Strategy, options?: GeneratePlanOptions): PlanSnapshot;
//# sourceMappingURL=plan.d.ts.map