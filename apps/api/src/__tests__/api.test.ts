import { beforeEach, describe, expect, it, vi } from "vitest";
import { testClient } from "hono/testing";
import type { Card, Plan, PlanPreferences } from "@ccpp/shared/schema";
import {
  cards as cardsTable,
  plans as plansTable,
  planPreferences as planPreferencesTable,
} from "@ccpp/shared/schema";
import type { PlanSnapshot } from "@ccpp/shared";
import { ConstraintViolationError } from "@ccpp/solver";
import { ERROR_CODES } from "../errors.js";
import { app } from "../index.js";

type DbState = {
  cards: Card[];
  plans: Plan[];
  preferences: PlanPreferences[];
};

type Condition =
  | { op: "eq"; col: unknown; value: unknown }
  | { op: "and"; conditions: Condition[] }
  | { op: "desc"; col: unknown }
  | { op: "sql"; strings: string[]; values: unknown[] }
  | { op: "raw"; value: string }
  | null
  | undefined;

const mocks = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
  mockGeneratePlan: vi.fn(),
}));

let mockState: DbState;

vi.mock("drizzle-orm", () => {
  const sql = Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({
      op: "sql",
      strings: Array.from(strings),
      values,
    }),
    {
      raw: (value: string) => ({ op: "raw", value }),
    }
  );

  return {
    and: (...conditions: Condition[]) => ({ op: "and", conditions }),
    eq: (col: unknown, value: unknown) => ({ op: "eq", col, value }),
    desc: (col: unknown) => ({ op: "desc", col }),
    sql,
  };
});

function columnKey(column: unknown): keyof Card | keyof Plan | null {
  if (column === cardsTable.id) return "id";
  if (column === cardsTable.userId) return "userId";
  if (column === cardsTable.updatedAt) return "updatedAt";
  if (column === plansTable.id) return "id";
  if (column === plansTable.userId) return "userId";
  if (column === plansTable.generatedAt) return "generatedAt";
  if (column === planPreferencesTable.userId) return "userId";
  return null;
}

function matchCondition(item: Card | Plan, condition: Condition): boolean {
  if (!condition) return true;
  if (condition.op === "and") {
    return condition.conditions.every((entry) => matchCondition(item, entry));
  }
  if (condition.op === "eq") {
    const key = columnKey(condition.col);
    if (!key) return true;
    return item[key] === condition.value;
  }
  return true;
}

function sortDesc<T extends Card | Plan>(items: T[], order: Condition): T[] {
  if (!order || order.op !== "desc") return items;
  const key = columnKey(order.col);
  if (!key) return items;
  return [...items].sort((a, b) => {
    const aValue = a[key] instanceof Date ? a[key] : new Date(a[key] as any);
    const bValue = b[key] instanceof Date ? b[key] : new Date(b[key] as any);
    return bValue.getTime() - aValue.getTime();
  });
}

function extractActionIndex(expr: Condition): number | null {
  if (!expr || expr.op !== "sql") return null;
  const raw = expr.values.find(
    (value): value is { op: "raw"; value: string } =>
      typeof value === "object" && value !== null && (value as any).op === "raw"
  );
  if (!raw) return null;
  const cleaned = raw.value.replace(/'/g, "").replace(/[{}]/g, "");
  const parts = cleaned.split(",");
  if (parts[0] !== "actions") return null;
  const index = Number(parts[1]);
  return Number.isFinite(index) ? index : null;
}

function applyUpdates<T extends Card | Plan>(
  item: T,
  updates: Record<string, any>
): T {
  const next = { ...updates };
  if ("snapshotJson" in updates) {
    const actionIndex = extractActionIndex(updates.snapshotJson as Condition);
    if (actionIndex != null && "snapshotJson" in item) {
      const snapshot = item.snapshotJson as Record<string, any>;
      const actions = Array.isArray(snapshot.actions)
        ? [...snapshot.actions]
        : [];
      if (actions[actionIndex]) {
        actions[actionIndex] = {
          ...actions[actionIndex],
          markedPaidAt: new Date().toISOString(),
        };
        next.snapshotJson = {
          ...snapshot,
          actions,
        };
      }
    }
  }
  return { ...item, ...next };
}

function createTx(state: DbState, userId: string) {
  return {
    select() {
      return {
        from(table: unknown) {
          let condition: Condition;
          let order: Condition;
          let limitValue: number | undefined;

          const data = () => {
            if (table === cardsTable) return state.cards;
            if (table === plansTable) return state.plans;
            return state.preferences;
          };

          const query = {
            where(nextCondition: Condition) {
              condition = nextCondition;
              return query;
            },
            orderBy(nextOrder: Condition) {
              order = nextOrder;
              return query;
            },
            limit(nextLimit: number) {
              limitValue = nextLimit;
              return query;
            },
            then(resolve: (value: any) => any, reject: (err: any) => any) {
              const results = data()
                .filter((item) => item.userId === userId)
                .filter((item) => matchCondition(item, condition));
              const ordered = sortDesc(results, order);
              const limited =
                limitValue == null ? ordered : ordered.slice(0, limitValue);
              return Promise.resolve(limited).then(resolve, reject);
            },
          };

          return query;
        },
      };
    },
    insert(table: unknown) {
      let values: Record<string, any> | Record<string, any>[] | undefined;
      let conflictUpdate: { set: Record<string, any> } | null = null;
      const query = {
        values(nextValues: Record<string, any> | Record<string, any>[]) {
          values = nextValues;
          return query;
        },
        onConflictDoUpdate(config: { set: Record<string, any> }) {
          conflictUpdate = config;
          return query;
        },
        returning() {
          return query;
        },
        then(resolve: (value: any) => any, reject: (err: any) => any) {
          if (!values) {
            return Promise.resolve([]).then(resolve, reject);
          }
          const input = Array.isArray(values) ? values : [values];
          const now = new Date();
          const inserted = input.map((entry) => {
            const base = { ...entry };
            if (
              !base.id &&
              typeof crypto !== "undefined" &&
              "randomUUID" in crypto
            ) {
              base.id = crypto.randomUUID();
            }
            if (!base.id) {
              base.id = "mock-" + Math.random().toString(16).slice(2);
            }
            if (table === cardsTable) {
              base.createdAt = base.createdAt ?? now;
              base.updatedAt = base.updatedAt ?? now;
            }
            if (table === plansTable) {
              base.createdAt = base.createdAt ?? now;
            }
            return base;
          });

          if (table === planPreferencesTable && conflictUpdate) {
            const results: PlanPreferences[] = [];
            inserted.forEach((entry) => {
              const userId = entry.userId;
              const index = state.preferences.findIndex(
                (pref) => pref.userId === userId
              );
              if (index >= 0) {
                const updated = {
                  ...state.preferences[index],
                  ...conflictUpdate.set,
                } as PlanPreferences;
                state.preferences[index] = updated;
                results.push(updated);
              } else {
                state.preferences.push(entry as PlanPreferences);
                results.push(entry as PlanPreferences);
              }
            });
            return Promise.resolve(results).then(resolve, reject);
          }

          if (table === cardsTable) {
            state.cards.push(...(inserted as Card[]));
          } else if (table === plansTable) {
            state.plans.push(...(inserted as Plan[]));
          } else {
            state.preferences.push(...(inserted as PlanPreferences[]));
          }

          return Promise.resolve(inserted).then(resolve, reject);
        },
      };
      return query;
    },
    update(table: unknown) {
      let updates: Record<string, any> | undefined;
      let condition: Condition;
      const query = {
        set(nextUpdates: Record<string, any>) {
          updates = nextUpdates;
          return query;
        },
        where(nextCondition: Condition) {
          condition = nextCondition;
          return query;
        },
        returning() {
          return query;
        },
        then(resolve: (value: any) => any, reject: (err: any) => any) {
          const data =
            table === cardsTable
              ? state.cards
              : table === plansTable
              ? state.plans
              : state.preferences;
          const updated: Array<Card | Plan | PlanPreferences> = [];

          data.forEach((item, index) => {
            if (item.userId !== userId) return;
            if (!matchCondition(item, condition)) return;
            const nextItem = applyUpdates(item, updates ?? {});
            data[index] = nextItem;
            updated.push(nextItem);
          });

          return Promise.resolve(updated).then(resolve, reject);
        },
      };
      return query;
    },
    delete(table: unknown) {
      let condition: Condition;
      const query = {
        where(nextCondition: Condition) {
          condition = nextCondition;
          return query;
        },
        returning() {
          return query;
        },
        then(resolve: (value: any) => any, reject: (err: any) => any) {
          const data =
            table === cardsTable
              ? state.cards
              : table === plansTable
              ? state.plans
              : state.preferences;
          const remaining: Array<Card | Plan | PlanPreferences> = [];
          const deleted: Array<Card | Plan | PlanPreferences> = [];

          data.forEach((item) => {
            if (item.userId !== userId || !matchCondition(item, condition)) {
              remaining.push(item);
            } else {
              deleted.push(item);
            }
          });

          if (table === cardsTable) {
            state.cards = remaining as Card[];
          } else if (table === plansTable) {
            state.plans = remaining as Plan[];
          } else {
            state.preferences = remaining as PlanPreferences[];
          }

          return Promise.resolve(deleted).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

vi.mock("@clerk/backend", () => ({
  verifyToken: mocks.mockVerifyToken,
}));

vi.mock("@ccpp/solver", async () => {
  const actual = await vi.importActual<typeof import("@ccpp/solver")>(
    "@ccpp/solver"
  );
  return {
    ...actual,
    generatePlan: mocks.mockGeneratePlan,
  };
});

vi.mock("../db.js", () => ({
  db: {},
  withRls: async (userId: string, work: (tx: any) => Promise<any>) => {
    const tx = createTx(mockState, userId);
    return work(tx);
  },
}));

const client = testClient(app);

function authHeader(userId: string) {
  return { Authorization: `Bearer token-${userId}` };
}

function makeCard(overrides: Partial<Card> = {}): Card {
  const now = new Date("2024-01-01T00:00:00Z");
  return {
    id: overrides.id ?? "card-" + Math.random().toString(16).slice(2),
    userId: overrides.userId ?? "user-a",
    name: overrides.name ?? "Test Card",
    issuer: overrides.issuer ?? "Test Bank",
    creditLimitCents: overrides.creditLimitCents ?? 500_000,
    currentBalanceCents: overrides.currentBalanceCents ?? 120_000,
    minimumPaymentCents: overrides.minimumPaymentCents ?? 25_00,
    aprBps: overrides.aprBps ?? 1999,
    statementCloseDay: overrides.statementCloseDay ?? 10,
    dueDateDay: overrides.dueDateDay ?? 20,
    excludeFromOptimization: overrides.excludeFromOptimization ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function makeSnapshot(overrides: Partial<PlanSnapshot> = {}): PlanSnapshot {
  return {
    planId: overrides.planId ?? "plan-1",
    generatedAt:
      overrides.generatedAt ?? new Date("2024-01-01T00:00:00Z").toISOString(),
    cycleLabel: overrides.cycleLabel ?? "This Cycle",
    focusSummary: overrides.focusSummary ?? [],
    actions: overrides.actions ?? [
      {
        cardId: "card-1",
        cardName: "Test Card",
        actionType: "BY_DUE_DATE",
        amountCents: 123_00,
        targetDate: "2024-02-01",
        priority: 0.5,
        reason: "Pay down balance",
        reasonTags: [],
      },
    ],
    portfolio: overrides.portfolio ?? {
      confidence: "medium",
    },
    nextAction: overrides.nextAction,
  };
}

function makePlan(overrides: Partial<Plan> = {}): Plan {
  const snapshot = makeSnapshot(
    overrides.snapshotJson as PlanSnapshot | undefined
  );
  return {
    id: overrides.id ?? snapshot.planId,
    userId: overrides.userId ?? "user-a",
    generatedAt: overrides.generatedAt ?? new Date(snapshot.generatedAt),
    strategy: overrides.strategy ?? "snowball",
    availableCashCents: overrides.availableCashCents ?? 200_00,
    totalPaymentCents: overrides.totalPaymentCents ?? 200_00,
    snapshotJson: overrides.snapshotJson ?? snapshot,
    createdAt: overrides.createdAt ?? new Date("2024-01-01T00:00:00Z"),
  };
}

function makePreferences(
  overrides: Partial<PlanPreferences> = {}
): PlanPreferences {
  const now = new Date("2024-01-01T00:00:00Z");
  return {
    userId: overrides.userId ?? "user-a",
    strategy: overrides.strategy ?? "snowball",
    availableCashCents: overrides.availableCashCents ?? 200_00,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

beforeEach(() => {
  mockState = { cards: [], plans: [], preferences: [] };
  mocks.mockVerifyToken.mockReset();
  mocks.mockGeneratePlan.mockReset();
  mocks.mockVerifyToken.mockImplementation(async (token: string) => {
    if (!token || token === "invalid") {
      throw new Error("Invalid token");
    }
    return { sub: token.replace("token-", "") } as any;
  });
});

describe("health", () => {
  it("responds with ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});

describe("auth", () => {
  it("rejects missing authorization", async () => {
    const res = await client.api.cards.$get();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("rejects invalid authorization", async () => {
    const res = await client.api.cards.$get({
      header: { Authorization: "Bearer invalid" },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });
});

describe("cards", () => {
  it("lists only cards for the authenticated user", async () => {
    mockState.cards.push(
      makeCard({ id: "card-user-a", userId: "user-a" }),
      makeCard({ id: "card-user-b", userId: "user-b" })
    );

    const res = await client.api.cards.$get({
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("card-user-a");
  });

  it("creates a card with defaults", async () => {
    const payload = {
      name: "Rewards",
      creditLimitCents: 100_000,
      currentBalanceCents: 40_000,
      minimumPaymentCents: 25_00,
      aprBps: 1899,
      statementCloseDay: 12,
      dueDateDay: 22,
    };

    const res = await client.api.cards.$post({
      json: payload,
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.userId).toBe("user-a");
    expect(body.issuer).toBeNull();
    expect(body.excludeFromOptimization).toBe(false);
    expect(mockState.cards).toHaveLength(1);
  });

  it("updates a card for the authenticated user", async () => {
    const card = makeCard({
      id: "11111111-1111-1111-1111-111111111111",
      userId: "user-a",
    });
    mockState.cards.push(card);

    const res = await client.api.cards[":id"].$patch({
      param: { id: card.id },
      json: { name: "Updated" },
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Updated");
    expect(mockState.cards[0]?.name).toBe("Updated");
  });

  it("prevents updating another user's card", async () => {
    const otherCard = makeCard({
      id: "22222222-2222-2222-2222-222222222222",
      userId: "user-b",
    });
    mockState.cards.push(otherCard);

    const res = await client.api.cards[":id"].$patch({
      param: { id: otherCard.id },
      json: { name: "Updated" },
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it("deletes a card for the authenticated user", async () => {
    const card = makeCard({
      id: "33333333-3333-3333-3333-333333333333",
      userId: "user-a",
    });
    mockState.cards.push(card);

    const res = await client.api.cards[":id"].$delete({
      param: { id: card.id },
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(card.id);
    expect(mockState.cards).toHaveLength(0);
  });

  it("returns validation errors for invalid JSON", async () => {
    const res = await app.request("/api/cards", {
      method: "POST",
      headers: {
        Authorization: "Bearer token-user-a",
        "Content-Type": "application/json",
      },
      body: "{bad-json",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });
});

describe("overrides", () => {
  it("updates card fields and recomputes the plan", async () => {
    const card = makeCard({
      id: "44444444-4444-4444-4444-444444444444",
      userId: "user-a",
    });
    mockState.cards.push(card);
    mockState.preferences.push(
      makePreferences({ strategy: "snowball", availableCashCents: 180_00 })
    );

    const snapshot = makeSnapshot({ planId: "plan-after-override" });
    mocks.mockGeneratePlan.mockResolvedValue(snapshot);

    const res = await client.api.overrides.$post({
      json: { cardId: card.id, updates: { aprBps: 1799 } },
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan.planId).toBe("plan-after-override");
    expect(mockState.cards[0]?.aprBps).toBe(1799);
    expect(mocks.mockGeneratePlan).toHaveBeenCalledTimes(1);
  });
});

describe("plans", () => {
  it("generates a plan using active cards", async () => {
    mockState.cards.push(
      makeCard({ id: "card-1", excludeFromOptimization: false }),
      makeCard({ id: "card-2", excludeFromOptimization: true })
    );

    const snapshot = makeSnapshot({ planId: "plan-123" });
    mocks.mockGeneratePlan.mockResolvedValue(snapshot);

    const res = await client.api.plan.generate.$post({
      json: { availableCashCents: 200_00, strategy: "snowball" },
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan.planId).toBe("plan-123");
    expect(body.strategy).toBe("snowball");
    expect(body.availableCashCents).toBe(200_00);
    expect(mocks.mockGeneratePlan).toHaveBeenCalledTimes(1);
    const [cardsArg, cashArg, strategyArg] =
      mocks.mockGeneratePlan.mock.calls[0] ?? [];
    expect(cardsArg).toHaveLength(1);
    expect(cashArg).toBe(200_00);
    expect(strategyArg).toBe("snowball");
    expect(mockState.plans).toHaveLength(1);
  });

  it("maps solver constraint violations", async () => {
    mockState.cards.push(makeCard({ id: "card-1" }));

    const constraintError = new ConstraintViolationError({
      code: "CONSTRAINT_VIOLATION",
      totalMinimumCents: 100_00,
      availableCashCents: 50_00,
      shortfallCents: 50_00,
      cardCount: 1,
      suggestions: [{ kind: "increase_cash", message: "Increase cash" }],
    });
    mocks.mockGeneratePlan.mockImplementation(() => {
      throw constraintError;
    });

    const res = await client.api.plan.generate.$post({
      json: { availableCashCents: 50_00, strategy: "snowball" },
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(ERROR_CODES.SOLVER_CONSTRAINT_VIOLATION);
  });

  it("maps solver errors", async () => {
    mockState.cards.push(makeCard({ id: "card-1" }));

    mocks.mockGeneratePlan.mockRejectedValue(new Error("Boom"));

    const res = await client.api.plan.generate.$post({
      json: { availableCashCents: 50_00, strategy: "snowball" },
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe(ERROR_CODES.SOLVER_ERROR);
  });

  it("returns the latest plan for plan/current", async () => {
    const plan = makePlan({ id: "plan-latest", strategy: "avalanche" });
    mockState.plans.push(plan);

    const res = await client.api.plan.current.$get({
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan.planId).toBe("plan-latest");
    expect(body.strategy).toBe("avalanche");
  });

  it("auto-generates plan/current using stored preferences", async () => {
    mockState.cards.push(makeCard({ id: "card-1" }));
    mockState.preferences.push(
      makePreferences({ strategy: "utilization", availableCashCents: 150_00 })
    );

    const snapshot = makeSnapshot({ planId: "plan-auto" });
    mocks.mockGeneratePlan.mockResolvedValue(snapshot);

    const res = await client.api.plan.current.$get({
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan.planId).toBe("plan-auto");
    expect(body.strategy).toBe("utilization");
    expect(body.availableCashCents).toBe(150_00);
  });
});

describe("actions", () => {
  it("marks the latest plan action as paid", async () => {
    const plan = makePlan({
      snapshotJson: makeSnapshot({
        actions: [
          {
            cardId: "card-1",
            cardName: "Card",
            actionType: "BY_DUE_DATE",
            amountCents: 50_00,
            targetDate: "2024-02-10",
            priority: 0.2,
            reason: "Reason",
            reasonTags: [],
          },
        ],
      }),
    });
    mockState.plans.push(plan);
    mockState.cards.push(
      makeCard({ id: "card-1", currentBalanceCents: 100_00 })
    );

    const snapshot = makeSnapshot({ planId: "plan-after-paid" });
    mocks.mockGeneratePlan.mockResolvedValue(snapshot);

    const res = await client.api.plan.actions[":actionId"]["mark-paid"].$post({
      param: { actionId: "0" },
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan.planId).toBe("plan-after-paid");
    expect(mockState.cards[0]?.currentBalanceCents).toBe(50_00);
    expect(mockState.plans).toHaveLength(2);
  });

  it("returns not found when the action index is invalid", async () => {
    const plan = makePlan();
    mockState.plans.push(plan);

    const res = await client.api.plan.actions[":actionId"]["mark-paid"].$post({
      param: { actionId: "5" },
      header: authHeader("user-a"),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND);
  });
});
