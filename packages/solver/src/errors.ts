/**
 * Custom error types for the solver package.
 * All error messages are deterministic: same inputs produce the same message.
 */

/** Error code for constraint validation failures. */
export const CONSTRAINT_VIOLATION_CODE = "CONSTRAINT_VIOLATION" as const;

/** Suggestion kind for actionable remediation. */
export type ConstraintSuggestionKind = "increase_cash" | "reduce_cards";

/** Single actionable suggestion with deterministic message. */
export interface ConstraintSuggestion {
  kind: ConstraintSuggestionKind;
  message: string;
}

/** Structured payload for constraint violations. */
export interface ConstraintViolationPayload {
  code: typeof CONSTRAINT_VIOLATION_CODE;
  totalMinimumCents: number;
  availableCashCents: number;
  shortfallCents: number;
  cardCount: number;
  suggestions: ConstraintSuggestion[];
}

/**
 * Error thrown when total minimum payments exceed available cash.
 * Includes deterministic message and actionable suggestions.
 */
export class ConstraintViolationError extends Error {
  readonly code: typeof CONSTRAINT_VIOLATION_CODE = CONSTRAINT_VIOLATION_CODE;
  readonly totalMinimumCents: number;
  readonly availableCashCents: number;
  readonly shortfallCents: number;
  readonly cardCount: number;
  readonly suggestions: ConstraintSuggestion[];

  constructor(payload: ConstraintViolationPayload) {
    const message = buildConstraintViolationMessage(payload);
    super(message);
    this.name = "ConstraintViolationError";
    this.totalMinimumCents = payload.totalMinimumCents;
    this.availableCashCents = payload.availableCashCents;
    this.shortfallCents = payload.shortfallCents;
    this.cardCount = payload.cardCount;
    this.suggestions = payload.suggestions;
    Object.setPrototypeOf(this, ConstraintViolationError.prototype);
  }

  /** Returns the structured payload for programmatic handling. */
  getPayload(): ConstraintViolationPayload {
    return {
      code: this.code,
      totalMinimumCents: this.totalMinimumCents,
      availableCashCents: this.availableCashCents,
      shortfallCents: this.shortfallCents,
      cardCount: this.cardCount,
      suggestions: this.suggestions,
    };
  }
}

/**
 * Builds a deterministic error message from the payload.
 * Same payload always produces the same string.
 */
function buildConstraintViolationMessage(
  payload: ConstraintViolationPayload
): string {
  const parts = [
    "Total minimum payments exceed available cash.",
    `Required: ${payload.totalMinimumCents} cents.`,
    `Available: ${payload.availableCashCents} cents.`,
    `Shortfall: ${payload.shortfallCents} cents.`,
  ];
  return parts.join(" ");
}
