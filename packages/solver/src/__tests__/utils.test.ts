import { describe, expect, it } from "vitest";
import {
  calculateUtilization,
  daysInMonthUtc,
  getNextDueDate,
  getNextStatementCloseDate,
  nextDateFromDayOfMonth,
  sortCardsByStrategy,
} from "../index";
import {
  highAprCard,
  highBalanceCard,
  highUtilizationCard,
  lowBalanceCard,
  lowUtilizationCard,
  makeCard,
} from "../__fixtures__";

const referenceDate = new Date("2026-01-15T12:00:00.000Z");

describe("calculateUtilization", () => {
  it("returns 0 when credit limit is missing or zero", () => {
    const missingLimit = makeCard({
      cardId: "card-missing",
      cardName: "Missing Limit",
      creditLimitCents: undefined,
      currentBalanceCents: 10_000,
    });
    const zeroLimit = makeCard({
      cardId: "card-zero",
      cardName: "Zero Limit",
      creditLimitCents: 0,
      currentBalanceCents: 10_000,
    });

    expect(calculateUtilization(missingLimit)).toBe(0);
    expect(calculateUtilization(zeroLimit)).toBe(0);
  });

  it("returns percentage and can exceed 100% when over limit", () => {
    const card = makeCard({
      cardId: "card-over",
      cardName: "Over Limit",
      creditLimitCents: 10_000,
      currentBalanceCents: 15_000,
    });

    expect(calculateUtilization(card)).toBeCloseTo(150);
  });
});

describe("sortCardsByStrategy", () => {
  it("sorts by snowball (smallest balance first) without mutating input", () => {
    const cards = [highBalanceCard, lowBalanceCard, highAprCard];
    const originalOrder = cards.map((c) => c.cardId);

    const sorted = sortCardsByStrategy(cards, "snowball");
    const sortedIds = sorted.map((c) => c.cardId);

    expect(sortedIds[0]).toBe(lowBalanceCard.cardId);
    expect(cards.map((c) => c.cardId)).toEqual(originalOrder);
  });

  it("sorts by avalanche (highest APR first)", () => {
    const cards = [highBalanceCard, lowBalanceCard, highAprCard];
    const sorted = sortCardsByStrategy(cards, "avalanche");

    expect(sorted[0].cardId).toBe(highAprCard.cardId);
  });

  it("sorts by utilization (highest utilization first)", () => {
    const cards = [lowUtilizationCard, highUtilizationCard];
    const sorted = sortCardsByStrategy(cards, "utilization");

    expect(sorted[0].cardId).toBe(highUtilizationCard.cardId);
  });
});

describe("date utilities", () => {
  it("calculates days in month in UTC", () => {
    expect(daysInMonthUtc(2024, 1)).toBe(29); // Feb leap year
    expect(daysInMonthUtc(2026, 1)).toBe(28); // Feb non-leap
  });

  it("returns next date from day of month with clamping", () => {
    const nextInMonth = nextDateFromDayOfMonth(20, referenceDate);
    expect(nextInMonth.toISOString().slice(0, 10)).toBe("2026-01-20");

    const nextMonth = nextDateFromDayOfMonth(10, referenceDate);
    expect(nextMonth.toISOString().slice(0, 10)).toBe("2026-02-10");

    const aprilReference = new Date("2026-04-01T00:00:00.000Z");
    const clamped = nextDateFromDayOfMonth(31, aprilReference);
    expect(clamped.toISOString().slice(0, 10)).toBe("2026-04-30");
  });

  it("formats next statement close and due dates as ISO strings", () => {
    expect(getNextStatementCloseDate(20, referenceDate)).toBe("2026-01-20");
    expect(getNextDueDate(10, referenceDate)).toBe("2026-02-10");
  });
});
