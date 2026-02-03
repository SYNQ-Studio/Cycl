import { beforeEach, describe, expect, it, vi } from "vitest";
import { testClient } from "hono/testing";
import { cards as cardsTable, plans as plansTable } from "@ccpp/shared/schema";
import { ConstraintViolationError } from "@ccpp/solver";
import { ERROR_CODES } from "../errors.js";
import { app } from "../index.js";
const mocks = vi.hoisted(() => ({
    mockVerifyToken: vi.fn(),
    mockGeneratePlan: vi.fn(),
}));
let mockState;
vi.mock("drizzle-orm", () => {
    const sql = Object.assign((strings, ...values) => ({
        op: "sql",
        strings: Array.from(strings),
        values,
    }), {
        raw: (value) => ({ op: "raw", value }),
    });
    return {
        and: (...conditions) => ({ op: "and", conditions }),
        eq: (col, value) => ({ op: "eq", col, value }),
        desc: (col) => ({ op: "desc", col }),
        sql,
    };
});
function columnKey(column) {
    if (column === cardsTable.id)
        return "id";
    if (column === cardsTable.userId)
        return "userId";
    if (column === cardsTable.updatedAt)
        return "updatedAt";
    if (column === plansTable.id)
        return "id";
    if (column === plansTable.userId)
        return "userId";
    if (column === plansTable.generatedAt)
        return "generatedAt";
    return null;
}
function matchCondition(item, condition) {
    if (!condition)
        return true;
    if (condition.op === "and") {
        return condition.conditions.every((entry) => matchCondition(item, entry));
    }
    if (condition.op === "eq") {
        const key = columnKey(condition.col);
        if (!key)
            return true;
        return item[key] === condition.value;
    }
    return true;
}
function sortDesc(items, order) {
    if (!order || order.op !== "desc")
        return items;
    const key = columnKey(order.col);
    if (!key)
        return items;
    return [...items].sort((a, b) => {
        const aValue = a[key] instanceof Date ? a[key] : new Date(a[key]);
        const bValue = b[key] instanceof Date ? b[key] : new Date(b[key]);
        return bValue.getTime() - aValue.getTime();
    });
}
function extractActionIndex(expr) {
    if (!expr || expr.op !== "sql")
        return null;
    const raw = expr.values.find((value) => typeof value === "object" && value !== null && value.op === "raw");
    if (!raw)
        return null;
    const cleaned = raw.value.replace(/'/g, "").replace(/[{}]/g, "");
    const parts = cleaned.split(",");
    if (parts[0] !== "actions")
        return null;
    const index = Number(parts[1]);
    return Number.isFinite(index) ? index : null;
}
function applyUpdates(item, updates) {
    const next = { ...updates };
    if ("snapshotJson" in updates) {
        const actionIndex = extractActionIndex(updates.snapshotJson);
        if (actionIndex != null && "snapshotJson" in item) {
            const snapshot = item.snapshotJson;
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
function createTx(state, userId) {
    return {
        select() {
            return {
                from(table) {
                    let condition;
                    let order;
                    let limitValue;
                    const data = () => (table === cardsTable ? state.cards : state.plans);
                    const query = {
                        where(nextCondition) {
                            condition = nextCondition;
                            return query;
                        },
                        orderBy(nextOrder) {
                            order = nextOrder;
                            return query;
                        },
                        limit(nextLimit) {
                            limitValue = nextLimit;
                            return query;
                        },
                        then(resolve, reject) {
                            const results = data()
                                .filter((item) => item.userId === userId)
                                .filter((item) => matchCondition(item, condition));
                            const ordered = sortDesc(results, order);
                            const limited = limitValue == null ? ordered : ordered.slice(0, limitValue);
                            return Promise.resolve(limited).then(resolve, reject);
                        },
                    };
                    return query;
                },
            };
        },
        insert(table) {
            let values;
            const query = {
                values(nextValues) {
                    values = nextValues;
                    return query;
                },
                returning() {
                    return query;
                },
                then(resolve, reject) {
                    if (!values) {
                        return Promise.resolve([]).then(resolve, reject);
                    }
                    const input = Array.isArray(values) ? values : [values];
                    const now = new Date();
                    const inserted = input.map((entry) => {
                        const base = { ...entry };
                        if (!base.id && typeof crypto !== "undefined" && "randomUUID" in crypto) {
                            base.id = crypto.randomUUID();
                        }
                        if (!base.id) {
                            base.id = ;
                            "mock-\" + Math.random().toString(16).slice(2);;
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
                    if (table === cardsTable) {
                        state.cards.push(...inserted);
                    }
                    else {
                        state.plans.push(...inserted);
                    }
                    return Promise.resolve(inserted).then(resolve, reject);
                },
            };
            return query;
        },
        update(table) {
            let updates;
            let condition;
            const query = {
                set(nextUpdates) {
                    updates = nextUpdates;
                    return query;
                },
                where(nextCondition) {
                    condition = nextCondition;
                    return query;
                },
                returning() {
                    return query;
                },
                then(resolve, reject) {
                    const data = table === cardsTable ? state.cards : state.plans;
                    const updated = [];
                    data.forEach((item, index) => {
                        if (item.userId !== userId)
                            return;
                        if (!matchCondition(item, condition))
                            return;
                        const nextItem = applyUpdates(item, updates ?? {});
                        data[index] = nextItem;
                        updated.push(nextItem);
                    });
                    return Promise.resolve(updated).then(resolve, reject);
                },
            };
            return query;
        },
        delete(table) {
            let condition;
            const query = {
                where(nextCondition) {
                    condition = nextCondition;
                    return query;
                },
                returning() {
                    return query;
                },
                then(resolve, reject) {
                    const data = table === cardsTable ? state.cards : state.plans;
                    const remaining = [];
                    const deleted = [];
                    data.forEach((item) => {
                        if (item.userId !== userId || !matchCondition(item, condition)) {
                            remaining.push(item);
                        }
                        else {
                            deleted.push(item);
                        }
                    });
                    if (table === cardsTable) {
                        state.cards = remaining;
                    }
                    else {
                        state.plans = remaining;
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
    const actual = await vi.importActual("@ccpp/solver");
    return {
        ...actual,
        generatePlan: mocks.mockGeneratePlan,
    };
});
vi.mock("../db.js", () => ({
    db: {},
    withRls: async (userId, work) => {
        const tx = createTx(mockState, userId);
        return work(tx);
    },
}));
const client = testClient(app);
function authHeader(userId) {
    return { Authorization: `Bearer token-${userId}` };
}
function makeCard(overrides = {}) {
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
function makeSnapshot(overrides = {}) {
    return {
        planId: overrides.planId ?? "plan-1",
        generatedAt: overrides.generatedAt ?? new Date("2024-01-01T00:00:00Z").toISOString(),
        cycleLabel: overrides.cycleLabel ?? "This Cycle",
        focusSummary: overrides.focusSummary ?? [],
        actions: overrides.actions ??
            [
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
function makePlan(overrides = {}) {
    const snapshot = makeSnapshot(overrides.snapshotJson);
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
beforeEach(() => {
    mockState = { cards: [], plans: [] };
    mocks.mockVerifyToken.mockReset();
    mocks.mockGeneratePlan.mockReset();
    mocks.mockVerifyToken.mockImplementation(async (token) => {
        if (!token || token === "invalid") {
            throw new Error("Invalid token");
        }
        return { sub: token.replace("token-", "") };
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
        mockState.cards.push(makeCard({ id: "card-user-a", userId: "user-a" }), makeCard({ id: "card-user-b", userId: "user-b" }));
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
        const card = makeCard({ id: "card-update", userId: "user-a" });
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
    it("prevents updating another user\'s card", async () => {
        const otherCard = makeCard({ id: "other-card", userId: "user-b" });
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
        const card = makeCard({ id: "card-delete", userId: "user-a" });
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
describe("plans", () => {
    it("generates a plan using active cards", async () => {
        mockState.cards.push(makeCard({ id: "card-1", excludeFromOptimization: false }), makeCard({ id: "card-2", excludeFromOptimization: true }));
        const snapshot = makeSnapshot({ planId: "plan-123" });
        mocks.mockGeneratePlan.mockResolvedValue(snapshot);
        const res = await client.api.plan.generate.$post({
            json: { availableCashCents: 200_00, strategy: "snowball" },
            header: authHeader("user-a"),
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.planId).toBe("plan-123");
        expect(mocks.mockGeneratePlan).toHaveBeenCalledTimes(1);
        const [cardsArg, cashArg, strategyArg] = mocks.mockGeneratePlan.mock.calls[0] ?? [];
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
            suggestions: [
                { kind: "increase_cash", message: "Increase cash" },
            ],
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
        const res = await client.api.plan.actions[":actionId"]["mark-paid"].$post({
            param: { actionId: "0" },
            header: authHeader("user-a"),
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.actions[0].markedPaidAt).toBeDefined();
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
