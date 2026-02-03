/**
 * Utilization calculation (pure, no side effects).
 */
import type { CardMeta } from "./types";
/**
 * Computes utilization percentage for a card: (balance / limit) * 100.
 * Returns 0 when credit limit is missing or zero to avoid division by zero.
 *
 * @param card - Card with currentBalanceCents and optional creditLimitCents
 * @returns Utilization percentage (0–100+; may exceed 100 if over limit)
 */
export declare function calculateUtilization(card: CardMeta): number;
//# sourceMappingURL=utilization.d.ts.map