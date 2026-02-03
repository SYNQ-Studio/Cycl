/**
 * Custom error types for the solver package.
 * All error messages are deterministic: same inputs produce the same message.
 */
/** Error code for constraint validation failures. */
export const CONSTRAINT_VIOLATION_CODE = "CONSTRAINT_VIOLATION";
/**
 * Error thrown when total minimum payments exceed available cash.
 * Includes deterministic message and actionable suggestions.
 */
export class ConstraintViolationError extends Error {
    code = CONSTRAINT_VIOLATION_CODE;
    totalMinimumCents;
    availableCashCents;
    shortfallCents;
    cardCount;
    suggestions;
    constructor(payload) {
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
    getPayload() {
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
function buildConstraintViolationMessage(payload) {
    const parts = [
        "Total minimum payments exceed available cash.",
        `Required: ${payload.totalMinimumCents} cents.`,
        `Available: ${payload.availableCashCents} cents.`,
        `Shortfall: ${payload.shortfallCents} cents.`,
    ];
    return parts.join(" ");
}
