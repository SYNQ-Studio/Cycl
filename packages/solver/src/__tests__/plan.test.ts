import { describe, expect, it } from "vitest";
import { generatePlan } from "../index";
import {
  REFERENCE_DATE,
  cashHigh,
  maxCards,
  makeCard,
  singleCard,
  typicalCards,
} from "../__fixtures__";

const referenceDate = REFERENCE_DATE;

describe("generatePlan", () => {
  it.each(["snowball", "avalanche", "utilization"] as const)(
    "generates a plan for %s strategy",
    (strategy) => {
      const plan = generatePlan(typicalCards, cashHigh, strategy, {
        referenceDate,
      });

      expect(plan.planId).toHaveLength(32);
      expect(plan.generatedAt).toBe(referenceDate.toISOString());
      expect(plan.actions.length).toBeGreaterThanOrEqual(typicalCards.length);
      expect(plan.actions.some((a) => a.actionType === "BY_DUE_DATE")).toBe(
        true
      );
    }
  );

  it("selects the next action by earliest target date", () => {
    const plan = generatePlan(typicalCards, cashHigh, "snowball", {
      referenceDate,
    });

    expect(plan.nextAction?.targetDate).toBe("2026-02-05");
  });

  it("throws when cash is below total minimums", () => {
    expect(() =>
      generatePlan(typicalCards, 100, "snowball", { referenceDate })
    ).toThrow("Total minimum payments exceed available cash.");
  });

  it("handles empty card sets (all cards excluded)", () => {
    const plan = generatePlan([], 10_000, "snowball", { referenceDate });

    expect(plan.actions).toHaveLength(0);
    expect(plan.focusSummary).toHaveLength(0);
    expect(plan.nextAction).toBeUndefined();
  });

  it("allocates correctly for a single card", () => {
    const plan = generatePlan(singleCard, 20_000, "snowball", {
      referenceDate,
    });

    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0]?.amountCents).toBe(20_000);
  });

  it("handles max complexity (20 cards)", () => {
    const plan = generatePlan(maxCards, 200_000, "avalanche", {
      referenceDate,
    });

    expect(plan.actions).toHaveLength(20);
  });

  it("sets portfolio confidence to low when data is missing", () => {
    const cards = [
      makeCard({
        cardId: "card-missing-data",
        cardName: "Missing Data",
        dueDate: undefined,
        creditLimitCents: undefined,
        currentBalanceCents: 5_000,
        minimumDueCents: 100,
      }),
    ];

    const plan = generatePlan(cards, 1_000, "snowball", { referenceDate });
    expect(plan.portfolio.confidence).toBe("low");
    expect(plan.portfolio.utilization).toBe(0);
  });
});
