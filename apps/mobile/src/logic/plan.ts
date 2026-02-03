import {
  PlanSnapshot as PlanSnapshotSchema,
  type PlanSnapshot as PlanSnapshotType,
} from "@ccpp/shared/ai";
import type { Strategy, StoredCard } from "@ccpp/shared/mobile";
import { getNextDueDate, getNextStatementCloseDate, generatePlan } from "@ccpp/solver";

export function buildPlanSnapshot(
  cards: StoredCard[],
  availableCashCents: number,
  strategy: Strategy,
  referenceDate: Date = new Date()
) {
  const solverCards = cards.map((card) => ({
    cardId: card.id,
    issuer: card.issuer ?? "Unknown",
    cardName: card.name,
    creditLimitCents: card.creditLimitCents,
    aprBps: card.aprBps,
    dueDate: getNextDueDate(card.dueDateDay, referenceDate),
    statementCloseDate: getNextStatementCloseDate(
      card.statementCloseDay,
      referenceDate
    ),
    minimumDueCents: card.minimumPaymentCents,
    currentBalanceCents: card.currentBalanceCents,
  }));

  const snapshot = generatePlan(
    solverCards,
    availableCashCents,
    strategy,
    { referenceDate }
  );

  const parsed = PlanSnapshotSchema.parse(snapshot) as PlanSnapshotType;
  const totalPaymentCents = parsed.actions.reduce(
    (sum: number, action: PlanSnapshotType["actions"][number]) =>
      sum + action.amountCents,
    0
  );

  return {
    id: parsed.planId,
    generatedAt: parsed.generatedAt,
    strategy,
    availableCashCents,
    totalPaymentCents,
    snapshot: parsed,
  };
}
