/**
 * Solver package types.
 * CardMeta is extended with currentBalanceCents for utilization and strategy sorting.
 */
import type { CardMeta as SharedCardMeta } from "@ccpp/shared/ai";
/** Payment strategy for prioritizing which card to pay first. */
export type Strategy = "snowball" | "avalanche" | "utilization";
/**
 * Card metadata with balance for solver calculations.
 * Extends shared CardMeta with required currentBalanceCents for utilization and sorting.
 */
export type CardMeta = SharedCardMeta & {
    currentBalanceCents: number;
};
//# sourceMappingURL=types.d.ts.map