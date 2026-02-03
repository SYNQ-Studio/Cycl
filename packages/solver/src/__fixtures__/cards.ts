import type { CardMeta } from "../types";

const baseCard: Omit<CardMeta, "cardId" | "cardName"> = {
  issuer: "Test Bank",
  creditLimitCents: 100_000,
  aprBps: 1999,
  dueDate: "2026-02-10",
  statementCloseDate: "2026-01-20",
  minimumDueCents: 2_500,
  currentBalanceCents: 50_000,
};

export const REFERENCE_DATE = new Date("2026-01-15T00:00:00.000Z");

export function makeCard(
  overrides: Partial<CardMeta> & Pick<CardMeta, "cardId" | "cardName">
): CardMeta {
  return {
    ...baseCard,
    ...overrides,
  };
}

export const lowBalanceCard = makeCard({
  cardId: "card-low",
  cardName: "Low Balance",
  currentBalanceCents: 5_000,
  minimumDueCents: 500,
  aprBps: 1599,
  creditLimitCents: 100_000,
  dueDate: "2026-02-05",
  statementCloseDate: "2026-01-18",
});

export const highBalanceCard = makeCard({
  cardId: "card-high",
  cardName: "High Balance",
  currentBalanceCents: 90_000,
  minimumDueCents: 3_000,
  aprBps: 1299,
  creditLimitCents: 100_000,
  dueDate: "2026-02-11",
  statementCloseDate: "2026-01-21",
});

export const highAprCard = makeCard({
  cardId: "card-apr",
  cardName: "High APR",
  currentBalanceCents: 40_000,
  minimumDueCents: 2_000,
  aprBps: 2999,
  creditLimitCents: 80_000,
  dueDate: "2026-02-09",
  statementCloseDate: "2026-01-19",
});

export const highUtilizationCard = makeCard({
  cardId: "card-util-high",
  cardName: "High Util",
  currentBalanceCents: 70_000,
  minimumDueCents: 2_500,
  aprBps: 1799,
  creditLimitCents: 80_000,
  dueDate: "2026-02-12",
  statementCloseDate: "2026-01-17",
});

export const lowUtilizationCard = makeCard({
  cardId: "card-util-low",
  cardName: "Low Util",
  currentBalanceCents: 10_000,
  minimumDueCents: 1_500,
  aprBps: 1899,
  creditLimitCents: 100_000,
  dueDate: "2026-02-08",
  statementCloseDate: "2026-01-23",
});

export const missingLimitCard = makeCard({
  cardId: "card-missing-limit",
  cardName: "No Limit",
  creditLimitCents: undefined,
  currentBalanceCents: 12_000,
  minimumDueCents: 1_000,
});

export const missingMinimumCard = makeCard({
  cardId: "card-missing-min",
  cardName: "No Minimum",
  minimumDueCents: undefined,
  currentBalanceCents: 22_000,
});

export const typicalCards = [
  lowBalanceCard,
  highBalanceCard,
  highAprCard,
  highUtilizationCard,
  lowUtilizationCard,
];

export const singleCard = [
  makeCard({
    cardId: "card-single",
    cardName: "Solo",
    currentBalanceCents: 25_000,
    minimumDueCents: 1_200,
    creditLimitCents: 50_000,
    aprBps: 1899,
    dueDate: "2026-02-07",
    statementCloseDate: "2026-01-16",
  }),
];

export function generateCards(count: number): CardMeta[] {
  return Array.from({ length: count }, (_, index) => {
    const idx = index + 1;
    const dueDay = 5 + (idx % 20); // 5..24
    const closeDay = 10 + (idx % 15); // 10..24
    return makeCard({
      cardId: `card-${idx}`,
      cardName: `Card ${idx}`,
      currentBalanceCents: 30_000 + idx * 2_000,
      creditLimitCents: 100_000,
      aprBps: 1200 + idx * 35,
      minimumDueCents: 800 + idx * 20,
      dueDate: `2026-02-${String(dueDay).padStart(2, "0")}`,
      statementCloseDate: `2026-01-${String(closeDay).padStart(2, "0")}`,
    });
  });
}

export const complexCards = generateCards(15);
export const maxCards = generateCards(20);
