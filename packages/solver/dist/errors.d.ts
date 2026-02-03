/**
 * Custom error types for the solver package.
 * All error messages are deterministic: same inputs produce the same message.
 */
/** Error code for constraint validation failures. */
export declare const CONSTRAINT_VIOLATION_CODE: "CONSTRAINT_VIOLATION";
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
export declare class ConstraintViolationError extends Error {
    readonly code: typeof CONSTRAINT_VIOLATION_CODE;
    readonly totalMinimumCents: number;
    readonly availableCashCents: number;
    readonly shortfallCents: number;
    readonly cardCount: number;
    readonly suggestions: ConstraintSuggestion[];
    constructor(payload: ConstraintViolationPayload);
    /** Returns the structured payload for programmatic handling. */
    getPayload(): ConstraintViolationPayload;
}
//# sourceMappingURL=errors.d.ts.map