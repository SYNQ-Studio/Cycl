/**
 * Core payment allocation logic.
 * Allocates minimum payments first, then distributes remaining cash by strategy.
 * Produces PlanAction objects with amounts, target dates, action types, and reasons.
 */
import type { PlanAction } from "@ccpp/shared";
import type { CardMeta, Strategy } from "./types";
/**
 * Allocates payments across cards: first minimums to all cards, then
 * distributes remaining cash by strategy (snowball, avalanche, or utilization).
 *
 * @param cards - Card metadata with balances and terms (only active cards; no filtering here)
 * @param availableCashCents - Total cash available for payments (cents)
 * @param strategy - Strategy for distributing extra cash after minimums
 * @param referenceDate - Optional date for deterministic due-date fallbacks; defaults to now
 * @returns PlanAction[] — one BY_DUE_DATE per card (minimum), plus optional BEFORE_STATEMENT_CLOSE for utilization
 */
export declare function allocatePayments(cards: CardMeta[], availableCashCents: number, strategy: Strategy, referenceDate?: Date): PlanAction[];
//# sourceMappingURL=allocator.d.ts.map