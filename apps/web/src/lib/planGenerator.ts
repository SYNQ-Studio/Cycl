/**
 * Deterministic plan generator: produces per-card payment recommendations
 * from current cards, available cash, and strategy.
 */

import type { CreditCard, PaymentRecommendation } from "../types/card";
import type { Strategy } from "../components/StrategyModal";

/** Per-card plan output: payment recommendations for display and summary. */
export interface PlanAction {
  cardId: string;
  paymentBeforeStatement?: PaymentRecommendation;
  paymentByDueDate: PaymentRecommendation;
}

/**
 * Generates a deterministic payment plan for active cards.
 * Ensures minimums are covered, then distributes extra cash by strategy.
 */
export function generatePlan(
  cards: CreditCard[],
  availableCash: number,
  strategy: Strategy
): PlanAction[] {
  const active = cards.filter((c) => !c.excludeFromOptimization);
  if (active.length === 0) return [];

  const totalMinimums = active.reduce((sum, c) => sum + c.minimumPayment, 0);
  let extraCash = Math.max(0, availableCash - totalMinimums);

  const actions: PlanAction[] = active.map((card) => ({
    cardId: card.id,
    paymentByDueDate: {
      amount: card.minimumPayment,
      date: card.dueDate,
      explanation: "Minimum payment to avoid late fees",
    },
  }));

  if (extraCash <= 0) {
    return actions;
  }

  if (strategy === "utilization") {
    // Prioritize paying before statement on high-utilization cards.
    const byUtil = [...active].sort(
      (a, b) => (b.currentUtilization ?? 0) - (a.currentUtilization ?? 0)
    );
    for (const card of byUtil) {
      if (extraCash <= 0) break;
      if (card.currentUtilization <= 30 || !card.statementCloseDate) continue;
      const balanceAfterMin = Math.max(0, card.balance - card.minimumPayment);
      const targetUtil = 30;
      const targetBalance = Math.floor((card.creditLimit * targetUtil) / 100);
      const payBefore = Math.min(
        balanceAfterMin - targetBalance,
        balanceAfterMin,
        extraCash
      );
      if (payBefore > 0) {
        extraCash -= payBefore;
        const act = actions.find((a) => a.cardId === card.id);
        if (act) {
          act.paymentBeforeStatement = {
            amount: Math.round(payBefore),
            date: card.statementCloseDate,
            explanation: "Reduces utilization below 30% before reporting",
          };
          act.paymentByDueDate = {
            ...act.paymentByDueDate,
            explanation: "Minimum after pre-statement payment",
          };
        }
      }
    }
  } else if (strategy === "snowball") {
    // Smallest balance first: add extra to paymentByDueDate.
    const byBalance = [...active].sort((a, b) => a.balance - b.balance);
    for (const card of byBalance) {
      if (extraCash <= 0) break;
      const maxExtra = card.balance - card.minimumPayment;
      const add = Math.min(maxExtra, extraCash, Math.max(0, maxExtra));
      if (add > 0) {
        extraCash -= add;
        const act = actions.find((a) => a.cardId === card.id);
        if (act) {
          act.paymentByDueDate = {
            amount: card.minimumPayment + Math.round(add),
            date: card.dueDate,
            explanation: "Extra toward balance (snowball)",
          };
        }
      }
    }
  } else {
    // avalanche: highest APR first
    const byApr = [...active].sort((a, b) => b.apr - a.apr);
    for (const card of byApr) {
      if (extraCash <= 0) break;
      const maxExtra = card.balance - card.minimumPayment;
      const add = Math.min(maxExtra, extraCash, Math.max(0, maxExtra));
      if (add > 0) {
        extraCash -= add;
        const act = actions.find((a) => a.cardId === card.id);
        if (act) {
          act.paymentByDueDate = {
            amount: card.minimumPayment + Math.round(add),
            date: card.dueDate,
            explanation: "Extra toward balance (avalanche — high APR)",
          };
        }
      }
    }
  }

  return actions;
}

/**
 * Merges plan actions onto cards for display (Plan Summary, Needs Attention, CardRow).
 */
export function applyPlanToCards(
  cards: CreditCard[],
  planActions: PlanAction[]
): CreditCard[] {
  return cards.map((card) => {
    const action = planActions.find((a) => a.cardId === card.id);
    if (!action) return card;
    const paymentBeforeStatement = action.paymentBeforeStatement;
    const paymentByDueDate = action.paymentByDueDate;
    const totalPay =
      (paymentBeforeStatement?.amount ?? 0) + paymentByDueDate.amount;
    const newBalance = Math.max(0, card.balance - totalPay);
    const limit = card.creditLimit > 0 ? card.creditLimit : 1;
    const projectedUtilization = (newBalance / limit) * 100;
    return {
      ...card,
      paymentBeforeStatement,
      paymentByDueDate,
      projectedUtilization,
    };
  });
}

/**
 * Splits cards with plan into "needs attention" vs "on track" from plan outputs.
 */
export function categorizeByPlan(cardsWithPlan: CreditCard[]): {
  needsAttention: CreditCard[];
  onTrack: CreditCard[];
} {
  const active = cardsWithPlan.filter((c) => !c.excludeFromOptimization);
  const needsAttention = active.filter(
    (c) => c.currentUtilization > 30 || c.balance > c.minimumPayment * 10
  );
  const onTrack = active.filter(
    (c) => c.currentUtilization <= 30 && c.balance <= c.minimumPayment * 10
  );
  return { needsAttention, onTrack };
}
