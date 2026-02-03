import { describe, expect, it } from "vitest";
import { validateConstraints } from "../index";
import { ConstraintViolationError } from "../errors";
import { makeCard } from "../__fixtures__";

describe("validateConstraints", () => {
  it("returns success when cash covers minimums", () => {
    const cards = [
      makeCard({
        cardId: "card-a",
        cardName: "Card A",
        minimumDueCents: 1_000,
      }),
      makeCard({
        cardId: "card-b",
        cardName: "Card B",
        minimumDueCents: 2_000,
      }),
    ];

    const result = validateConstraints(cards, 5_000);
    expect(result.success).toBe(true);
  });

  it("returns error with suggestions when cash is below total minimums", () => {
    const cards = [
      makeCard({
        cardId: "card-a",
        cardName: "Card A",
        minimumDueCents: 3_000,
      }),
      makeCard({
        cardId: "card-b",
        cardName: "Card B",
        minimumDueCents: 4_000,
      }),
    ];

    const result = validateConstraints(cards, 5_000);
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error).toBeInstanceOf(ConstraintViolationError);
      expect(result.error.message).toContain("Shortfall: 2000 cents.");

      const payload = result.error.getPayload();
      expect(payload.totalMinimumCents).toBe(7_000);
      expect(payload.availableCashCents).toBe(5_000);
      expect(payload.shortfallCents).toBe(2_000);
      expect(payload.suggestions.map((s) => s.kind)).toEqual([
        "increase_cash",
        "reduce_cards",
      ]);
    }
  });

  it("treats missing minimums as zero", () => {
    const cards = [
      makeCard({
        cardId: "card-a",
        cardName: "Card A",
        minimumDueCents: undefined,
      }),
    ];

    const result = validateConstraints(cards, 0);
    expect(result.success).toBe(true);
  });
});
