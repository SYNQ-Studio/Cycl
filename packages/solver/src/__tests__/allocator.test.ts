import { describe, expect, it } from "vitest";
import { allocatePayments } from "../index";
import {
  REFERENCE_DATE,
  highAprCard,
  highUtilizationCard,
  lowBalanceCard,
  lowUtilizationCard,
  makeCard,
} from "../__fixtures__";
import { sumActionAmounts } from "./test-utils";

const referenceDate = REFERENCE_DATE;

describe("allocatePayments", () => {
  it("allocates only minimums when no extra cash is available", () => {
    const cards = [
      makeCard({
        cardId: "card-a",
        cardName: "Card A",
        currentBalanceCents: 12_000,
        minimumDueCents: 1_000,
      }),
      makeCard({
        cardId: "card-b",
        cardName: "Card B",
        currentBalanceCents: 8_000,
        minimumDueCents: 500,
      }),
    ];

    const actions = allocatePayments(cards, 0, "snowball", referenceDate);

    expect(actions).toHaveLength(2);
    expect(sumActionAmounts(actions)).toBe(1_500);
    expect(actions.every((a) => a.actionType === "BY_DUE_DATE")).toBe(true);
  });

  it("distributes extra cash with snowball strategy", () => {
    const cards = [
      makeCard({
        cardId: "card-small",
        cardName: "Small Balance",
        currentBalanceCents: 5_000,
        minimumDueCents: 500,
      }),
      makeCard({
        cardId: "card-large",
        cardName: "Large Balance",
        currentBalanceCents: 15_000,
        minimumDueCents: 500,
      }),
    ];

    const actions = allocatePayments(cards, 4_000, "snowball", referenceDate);
    const small = actions.find((a) => a.cardId === "card-small");
    const large = actions.find((a) => a.cardId === "card-large");

    expect(small?.amountCents).toBe(3_500);
    expect(large?.amountCents).toBe(500);
  });

  it("distributes extra cash with avalanche strategy", () => {
    const cards = [
      makeCard({
        cardId: "card-low-apr",
        cardName: "Low APR",
        currentBalanceCents: 10_000,
        minimumDueCents: 500,
        aprBps: 999,
      }),
      makeCard({
        cardId: "card-high-apr",
        cardName: "High APR",
        currentBalanceCents: 10_000,
        minimumDueCents: 500,
        aprBps: 2999,
      }),
    ];

    const actions = allocatePayments(cards, 3_000, "avalanche", referenceDate);
    const highApr = actions.find((a) => a.cardId === "card-high-apr");

    expect(highApr?.amountCents).toBe(2_500);
  });

  it("adds utilization actions before statement close", () => {
    const cards = [highUtilizationCard, lowUtilizationCard];

    const actions = allocatePayments(cards, 30_000, "utilization", referenceDate);
    const beforeActions = actions.filter(
      (a) => a.actionType === "BEFORE_STATEMENT_CLOSE"
    );

    expect(beforeActions.length).toBeGreaterThan(0);
    expect(beforeActions[0]?.targetDate).toBe(
      highUtilizationCard.statementCloseDate
    );
  });

  it("falls back to reference date when due date is invalid", () => {
    const card = makeCard({
      cardId: "card-invalid-date",
      cardName: "Invalid Date",
      dueDate: "invalid",
      currentBalanceCents: 5_000,
      minimumDueCents: 500,
    });

    const actions = allocatePayments([card], 500, "snowball", referenceDate);
    const expectedDate = new Date(referenceDate);
    expectedDate.setUTCDate(expectedDate.getUTCDate() + 30);

    expect(actions[0]?.targetDate).toBe(
      expectedDate.toISOString().slice(0, 10)
    );
  });

  it("treats missing minimums as zero", () => {
    const card = makeCard({
      cardId: "card-no-min",
      cardName: "No Minimum",
      minimumDueCents: undefined,
      currentBalanceCents: 10_000,
    });

    const actions = allocatePayments([card], 1_000, "snowball", referenceDate);
    expect(actions[0]?.amountCents).toBe(1_000);
  });

  it("uses snowball tiebreaker after utilization payments", () => {
    const cards = [highUtilizationCard, lowBalanceCard, highAprCard];

    const actions = allocatePayments(cards, 80_000, "utilization", referenceDate);
    const snowballTarget = actions.find((a) => a.cardId === lowBalanceCard.cardId);

    expect(snowballTarget?.amountCents).toBeGreaterThan(
      lowBalanceCard.minimumDueCents ?? 0
    );
  });
});
