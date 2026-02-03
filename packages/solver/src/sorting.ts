/**
 * Strategy-based card sorting (pure, no side effects).
 * Returns a new sorted array; does not mutate the input.
 */

import type { CardMeta, Strategy } from "./types";
import { calculateUtilization } from "./utilization";

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
export function sortCardsByStrategy(
  cards: CardMeta[],
  strategy: Strategy
): CardMeta[] {
  const copy = [...cards];

  if (strategy === "snowball") {
    copy.sort((a, b) => a.currentBalanceCents - b.currentBalanceCents);
    return copy;
  }

  if (strategy === "avalanche") {
    copy.sort((a, b) => (b.aprBps ?? 0) - (a.aprBps ?? 0));
    return copy;
  }

  if (strategy === "utilization") {
    copy.sort((a, b) => calculateUtilization(b) - calculateUtilization(a));
    return copy;
  }

  return copy;
}
