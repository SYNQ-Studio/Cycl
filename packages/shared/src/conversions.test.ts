import { describe, expect, it } from "vitest";
import type { CardMeta, PlanSnapshot } from "@ccpp/shared";
import type { Card, Plan } from "@ccpp/shared/schema";
import {
  cardMetaToDbCard,
  dbCardToCardMeta,
  dbPlanToPlanSnapshot,
  parseAIAnswer,
  parseAIQuestion,
  planSnapshotToDbPlan,
} from "@ccpp/shared";

describe("shared conversions", () => {
  it("converts cards to solver meta", () => {
    const card: Card = {
      id: "card-1",
      userId: "user-1",
      name: "Rewards",
      issuer: null,
      creditLimitCents: 100_000,
      currentBalanceCents: 25_000,
      minimumPaymentCents: 2_500,
      aprBps: 1999,
      statementCloseDay: 10,
      dueDateDay: 18,
      excludeFromOptimization: false,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    const meta = dbCardToCardMeta(card, new Date("2024-01-05T00:00:00Z"));

    expect(meta.cardId).toBe("card-1");
    expect(meta.issuer).toBe("Rewards");
    expect(meta.dueDate).toBe("2024-01-18");
    expect(meta.statementCloseDate).toBe("2024-01-10");
  });

  it("converts card meta to database input", () => {
    const meta: CardMeta = {
      cardId: "card-2",
      issuer: "Bank",
      cardName: "Everyday",
      creditLimitCents: 200_000,
      aprBps: 1599,
      dueDate: "2024-02-20",
      statementCloseDate: "2024-02-12",
      minimumDueCents: 3_000,
    };

    const dbCard = cardMetaToDbCard(meta, {
      userId: "user-2",
      currentBalanceCents: 50_000,
    });

    expect(dbCard.userId).toBe("user-2");
    expect(dbCard.dueDateDay).toBe(20);
    expect(dbCard.statementCloseDay).toBe(12);
  });

  it("throws when card meta is missing required dates", () => {
    const meta: CardMeta = {
      cardId: "card-3",
      issuer: "Bank",
      cardName: "Everyday",
      creditLimitCents: 200_000,
      aprBps: 1599,
      minimumDueCents: 3_000,
    };

    expect(() =>
      cardMetaToDbCard(meta, {
        userId: "user-3",
        currentBalanceCents: 10_000,
      })
    ).toThrow("statementCloseDay and dueDateDay are required");
  });

  it("round-trips plan snapshots", () => {
    const snapshot: PlanSnapshot = {
      planId: "plan-1",
      generatedAt: new Date("2024-01-20T00:00:00Z").toISOString(),
      cycleLabel: "This Cycle",
      focusSummary: ["Focus"],
      actions: [
        {
          cardId: "card-1",
          cardName: "Rewards",
          actionType: "BY_DUE_DATE",
          amountCents: 5_000,
          targetDate: "2024-02-10",
          priority: 0.6,
          reason: "Priority",
          reasonTags: [],
        },
      ],
      portfolio: {
        confidence: "medium",
      },
    };

    const dbPlan = planSnapshotToDbPlan(snapshot, {
      userId: "user-1",
      strategy: "snowball",
      availableCashCents: 10_000,
      totalPaymentCents: 10_000,
    });

    const roundTrip = dbPlanToPlanSnapshot({
      ...(dbPlan as Plan),
      createdAt: new Date("2024-01-20T00:00:00Z"),
    });

    expect(roundTrip.planId).toBe(snapshot.planId);
    expect(roundTrip.generatedAt).toBe(snapshot.generatedAt);
  });

  it("parses AI question and answer payloads", () => {
    const question = parseAIQuestion({
      questionId: "q1",
      askedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
      intent: "explain_plan",
      userText: "Why this plan?",
    });

    const answer = parseAIAnswer({
      answerId: "a1",
      questionId: "q1",
      generatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
      summary: "Summary",
      candidates: [],
      confidence: "medium",
      dataUsed: [],
      disclaimer: "Informational guidance only.",
    });

    expect(question.intent).toBe("explain_plan");
    expect(answer.confidence).toBe("medium");
  });
});
