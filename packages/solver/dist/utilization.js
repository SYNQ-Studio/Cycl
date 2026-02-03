/**
 * Utilization calculation (pure, no side effects).
 */
/**
 * Computes utilization percentage for a card: (balance / limit) * 100.
 * Returns 0 when credit limit is missing or zero to avoid division by zero.
 *
 * @param card - Card with currentBalanceCents and optional creditLimitCents
 * @returns Utilization percentage (0–100+; may exceed 100 if over limit)
 */
export function calculateUtilization(card) {
    const limitCents = card.creditLimitCents ?? 0;
    if (limitCents <= 0) {
        return 0;
    }
    return (card.currentBalanceCents / limitCents) * 100;
}
