/**
 * Constraint validation for the solver.
 * Pure: same inputs produce the same result or error message.
 */

import type { CardMeta } from "./types";
import { ConstraintViolationError, type ConstraintSuggestion } from "./errors";

/** Result of constraint validation: either success or a structured error. */
export type ValidationResult =
  | { success: true }
  | { success: false; error: ConstraintViolationError };

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
export function validateConstraints(
  cards: CardMeta[],
  availableCashCents: number
): ValidationResult {
  const totalMinimumCents = cards.reduce(
    (sum, card) => sum + (card.minimumDueCents ?? 0),
    0
  );

  if (totalMinimumCents <= availableCashCents) {
    return { success: true };
  }

  const shortfallCents = totalMinimumCents - availableCashCents;
  const suggestions = buildSuggestions(shortfallCents);

  const error = new ConstraintViolationError({
    code: "CONSTRAINT_VIOLATION",
    totalMinimumCents,
    availableCashCents,
    shortfallCents,
    cardCount: cards.length,
    suggestions,
  });

  return { success: false, error };
}

/**
 * Builds deterministic suggestion messages for a given shortfall.
 * Same shortfall always produces the same suggestions.
 */
function buildSuggestions(shortfallCents: number): ConstraintSuggestion[] {
  const result: ConstraintSuggestion[] = [
    {
      kind: "increase_cash",
      message: `Increase available cash by at least ${shortfallCents} cents.`,
    },
    {
      kind: "reduce_cards",
      message:
        "Reduce the number of cards or lower minimum payments so total minimums do not exceed available cash.",
    },
  ];
  return result;
}
