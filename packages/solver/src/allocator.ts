/**
 * Core payment allocation logic.
 * Allocates minimum payments first, then distributes remaining cash by strategy.
 * Produces PlanAction objects with amounts, target dates, action types, and reasons.
 */

import type { PlanAction } from "@ccpp/shared";
import type { CardMeta, Strategy } from "./types";
import { calculateUtilization } from "./utilization";
import { sortCardsByStrategy } from "./sorting";

/** ISO date regex for validation. */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns a valid ISO date string for use as targetDate.
 * Uses card.dueDate if present and valid; otherwise returns a fallback (reference + 30 days).
 */
function getTargetDueDate(card: CardMeta, referenceDate: Date): string {
  const due = card.dueDate;
  if (due != null && typeof due === "string" && ISO_DATE_REGEX.test(due)) {
    return due;
  }
  const d = new Date(referenceDate);
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns a valid ISO date string for statement close target.
 * Uses card.statementCloseDate if present and valid; otherwise returns null.
 */
function getTargetStatementCloseDate(card: CardMeta): string | null {
  const close = card.statementCloseDate;
  if (
    close != null &&
    typeof close === "string" &&
    ISO_DATE_REGEX.test(close)
  ) {
    return close;
  }
  return null;
}

/**
 * Builds the initial list of BY_DUE_DATE actions (minimum payment per card).
 * Includes all cards; uses referenceDate for missing dueDate.
 */
function buildMinimumActions(
  cards: CardMeta[],
  referenceDate: Date
): { actions: PlanAction[]; byCardId: Map<string, PlanAction> } {
  const actions: PlanAction[] = [];
  const byCardId = new Map<string, PlanAction>();

  for (const card of cards) {
    const minCents = card.minimumDueCents ?? 0;
    const targetDate = getTargetDueDate(card, referenceDate);
    const action: PlanAction = {
      cardId: card.cardId,
      cardName: card.cardName,
      actionType: "BY_DUE_DATE",
      amountCents: minCents,
      targetDate,
      priority: 0.5,
      reason: "Minimum payment to avoid late fees",
      reasonTags: ["minimum_payment"],
    };

    actions.push(action);
    byCardId.set(card.cardId, action);
  }

  return { actions, byCardId };
}

/**
 * Distributes extra cash using snowball strategy (smallest balance first).
 * Updates existing BY_DUE_DATE actions with additional amount; does not exceed balance.
 */
function distributeSnowball(
  cards: CardMeta[],
  extraCashCents: number,
  byCardId: Map<string, PlanAction>
): number {
  const sorted = sortCardsByStrategy(cards, "snowball");
  let remaining = extraCashCents;

  for (const card of sorted) {
    if (remaining <= 0) break;

    const action = byCardId.get(card.cardId);
    if (action == null) continue;

    const minCents = card.minimumDueCents ?? 0;
    const maxExtra = Math.max(0, card.currentBalanceCents - minCents);
    const addCents = Math.min(maxExtra, remaining);

    if (addCents > 0) {
      remaining -= addCents;
      const newAmount = action.amountCents + addCents;
      action.amountCents = newAmount;
      action.reason =
        "Extra toward balance (snowball — smallest balance first)";
      action.reasonTags = ["minimum_payment", "stability"];
    }
  }

  return remaining;
}

/**
 * Distributes extra cash using avalanche strategy (highest APR first).
 * Updates existing BY_DUE_DATE actions with additional amount; does not exceed balance.
 */
function distributeAvalanche(
  cards: CardMeta[],
  extraCashCents: number,
  byCardId: Map<string, PlanAction>
): number {
  const sorted = sortCardsByStrategy(cards, "avalanche");
  let remaining = extraCashCents;

  for (const card of sorted) {
    if (remaining <= 0) break;

    const action = byCardId.get(card.cardId);
    if (action == null) continue;

    const minCents = card.minimumDueCents ?? 0;
    const maxExtra = Math.max(0, card.currentBalanceCents - minCents);
    const addCents = Math.min(maxExtra, remaining);

    if (addCents > 0) {
      remaining -= addCents;
      const newAmount = action.amountCents + addCents;
      action.amountCents = newAmount;
      action.reason = "Extra toward balance (avalanche — highest APR first)";
      action.reasonTags = ["apr_priority", "minimum_payment"];
    }
  }

  return remaining;
}

/**
 * Distributes extra cash using utilization strategy: pay before statement close
 * on high-utilization cards to get below 30% before reporting.
 * Adds BEFORE_STATEMENT_CLOSE actions; prioritizes highest utilization and soonest statement close.
 */
function distributeUtilization(
  cards: CardMeta[],
  extraCashCents: number,
  actions: PlanAction[]
): number {
  const withUtilAndClose = cards
    .map((card) => ({
      card,
      util: calculateUtilization(card),
      closeDate: getTargetStatementCloseDate(card),
    }))
    .filter(
      (x): x is { card: CardMeta; util: number; closeDate: string } =>
        x.closeDate != null && x.util > 30
    );

  const sorted = withUtilAndClose.sort((a, b) => {
    if (b.util !== a.util) return b.util - a.util;
    const aTime = new Date(a.closeDate).getTime();
    const bTime = new Date(b.closeDate).getTime();
    return aTime - bTime;
  });

  let remaining = extraCashCents;

  for (const { card, closeDate } of sorted) {
    if (remaining <= 0) break;

    const limitCents = card.creditLimitCents ?? 0;
    if (limitCents <= 0) continue;

    const minCents = card.minimumDueCents ?? 0;
    const balanceAfterMin = Math.max(0, card.currentBalanceCents - minCents);
    const targetUtil = 30;
    const targetBalanceCents = Math.floor((limitCents * targetUtil) / 100);
    const payBeforeCents = Math.min(
      Math.max(0, balanceAfterMin - targetBalanceCents),
      balanceAfterMin,
      remaining
    );

    if (payBeforeCents > 0) {
      remaining -= payBeforeCents;
      const beforeAction: PlanAction = {
        cardId: card.cardId,
        cardName: card.cardName,
        actionType: "BEFORE_STATEMENT_CLOSE",
        amountCents: payBeforeCents,
        targetDate: closeDate,
        priority: 0.9,
        reason: "Reduces utilization below 30% before reporting",
        reasonTags: ["utilization_reporting"],
      };
      actions.push(beforeAction);
    }
  }

  return remaining;
}

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
export function allocatePayments(
  cards: CardMeta[],
  availableCashCents: number,
  strategy: Strategy,
  referenceDate?: Date
): PlanAction[] {
  const ref = referenceDate ?? new Date();

  const totalMinimumsCents = cards.reduce(
    (sum, c) => sum + (c.minimumDueCents ?? 0),
    0
  );
  let extraCashCents = Math.max(0, availableCashCents - totalMinimumsCents);

  const { actions, byCardId } = buildMinimumActions(cards, ref);

  if (extraCashCents <= 0) {
    return actions;
  }

  if (strategy === "utilization") {
    extraCashCents = distributeUtilization(cards, extraCashCents, actions);
    if (extraCashCents > 0) {
      distributeSnowball(cards, extraCashCents, byCardId);
    }
  } else if (strategy === "snowball") {
    distributeSnowball(cards, extraCashCents, byCardId);
  } else {
    distributeAvalanche(cards, extraCashCents, byCardId);
  }

  return actions;
}
