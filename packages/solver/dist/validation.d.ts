/**
 * Constraint validation for the solver.
 * Pure: same inputs produce the same result or error message.
 */
import type { CardMeta } from "./types";
import { ConstraintViolationError } from "./errors";
/** Result of constraint validation: either success or a structured error. */
export type ValidationResult = {
    success: true;
} | {
    success: false;
    error: ConstraintViolationError;
};
/**
 * Validates that available cash can cover total minimum payments.
 * Pure and deterministic: same inputs produce the same result or error.
 *
 * If total minimum payments exceed available cash, returns a failure result
 * with ConstraintViolationError containing actionable suggestions:
 * - increase_cash: increase available cash by at least the shortfall
 * - reduce_cards: reduce number of cards or minimum payments
 *
 * @param cards - Cards to validate (minimumDueCents summed; missing treated as 0)
 * @param availableCashCents - Available cash in cents
 * @returns ValidationResult; success or failure with structured error
 */
export declare function validateConstraints(cards: CardMeta[], availableCashCents: number): ValidationResult;
//# sourceMappingURL=validation.d.ts.map