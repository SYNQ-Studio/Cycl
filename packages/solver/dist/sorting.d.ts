/**
 * Strategy-based card sorting (pure, no side effects).
 * Returns a new sorted array; does not mutate the input.
 */
import type { CardMeta, Strategy } from "./types";
/**
 * Sorts cards by the given strategy (snowball, avalanche, or utilization).
 * Pure: returns a new array; input array is not mutated.
 *
 * - Snowball: smallest balance first (quick wins).
 * - Avalanche: highest APR first (save on interest).
 * - Utilization: highest utilization first (pay before statement close).
 *
 * @param cards - Array of cards to sort
 * @param strategy - Strategy to use for prioritization
 * @returns New array of cards in priority order
 */
export declare function sortCardsByStrategy(cards: CardMeta[], strategy: Strategy): CardMeta[];
//# sourceMappingURL=sorting.d.ts.map