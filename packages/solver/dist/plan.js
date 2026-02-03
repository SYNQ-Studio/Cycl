/**
 * Main solver entry point: validation, allocation, and plan snapshot creation.
 * Deterministic: same inputs (and optional reference date) produce the same output.
 */
import { validateConstraints } from "./validation";
import { allocatePayments } from "./allocator";
/**
 * Normalizes card data for hashing so same logical input produces same hash.
 * Sorts by cardId and picks stable fields only.
 */
function normalizedInputForHash(cards, availableCashCents, strategy, referenceTimeMs) {
    const sorted = [...cards].sort((a, b) => a.cardId.localeCompare(b.cardId, "en"));
    const payload = sorted.map((c) => ({
        id: c.cardId,
        bal: c.currentBalanceCents,
        min: c.minimumDueCents ?? 0,
        lim: c.creditLimitCents ?? 0,
        due: c.dueDate ?? null,
        close: c.statementCloseDate ?? null,
    }));
    return JSON.stringify({
        cards: payload,
        availableCashCents,
        strategy,
        ref: referenceTimeMs,
    });
}
/**
 * Deterministic 128-bit hash (hex) for environments without Node crypto.
 * Pure and stable across platforms.
 */
function hashToHex(input) {
    let h1 = 1779033703;
    let h2 = 3144134277;
    let h3 = 1013904242;
    let h4 = 2773480762;
    for (let i = 0; i < input.length; i += 1) {
        const k = input.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    const toHex = (value) => (value >>> 0).toString(16).padStart(8, "0");
    return `${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}`;
}
/**
 * Produces a deterministic plan ID from inputs and reference time.
 * Same inputs + same reference date → same plan ID.
 */
function deterministicPlanId(cards, availableCashCents, strategy, referenceDate) {
    const ref = referenceDate.getTime();
    const input = normalizedInputForHash(cards, availableCashCents, strategy, ref);
    return hashToHex(input);
}
/**
 * Computes projected balance (cents) per card after applying plan actions.
 * Pure: does not mutate inputs.
 */
function projectedBalancesByCard(cards, actions) {
    const map = new Map();
    for (const card of cards) {
        const totalPayCents = actions
            .filter((a) => a.cardId === card.cardId)
            .reduce((sum, a) => sum + a.amountCents, 0);
        const projected = Math.max(0, card.currentBalanceCents - totalPayCents);
        map.set(card.cardId, projected);
    }
    return map;
}
/**
 * Portfolio utilization after plan: total projected balance / total limit.
 * Returns a ratio in 0–10 scale (e.g. 0.3 = 30%); capped at 10.
 */
function portfolioUtilization(cards, projectedByCard) {
    let totalBalance = 0;
    let totalLimit = 0;
    for (const card of cards) {
        const bal = projectedByCard.get(card.cardId) ?? card.currentBalanceCents;
        const lim = card.creditLimitCents ?? 0;
        totalBalance += bal;
        totalLimit += lim;
    }
    if (totalLimit <= 0) {
        return 0;
    }
    const ratio = totalBalance / totalLimit;
    return Math.min(10, Math.max(0, ratio));
}
/**
 * Confidence based on data completeness: high when all cards have due date and limit.
 */
function portfolioConfidence(cards) {
    if (cards.length === 0) {
        return "medium";
    }
    const withDue = cards.filter((c) => c.dueDate != null && typeof c.dueDate === "string");
    const withLimit = cards.filter((c) => c.creditLimitCents != null && c.creditLimitCents > 0);
    if (withDue.length === cards.length && withLimit.length === cards.length) {
        return "high";
    }
    if (withDue.length === 0 && withLimit.length === 0) {
        return "low";
    }
    return "medium";
}
/**
 * Picks the single "next" action: earliest target date, then highest priority.
 * Pure; does not mutate actions.
 */
function pickNextAction(actions) {
    if (actions.length === 0)
        return undefined;
    const sorted = [...actions].sort((a, b) => {
        const dateCmp = a.targetDate.localeCompare(b.targetDate, "en");
        if (dateCmp !== 0)
            return dateCmp;
        return b.priority - a.priority;
    });
    return sorted[0];
}
/**
 * Builds short focus summary lines (max 140 chars each) from the plan.
 */
function buildFocusSummary(cards, actions, strategy) {
    const lines = [];
    const byCard = new Map();
    for (const a of actions) {
        const list = byCard.get(a.cardId) ?? [];
        list.push(a);
        byCard.set(a.cardId, list);
    }
    const minCount = cards.filter((c) => (c.minimumDueCents ?? 0) > 0).length;
    if (minCount > 0) {
        lines.push(`Pay minimums on ${minCount} card${minCount === 1 ? "" : "s"}.`);
    }
    const extra = actions.filter((a) => {
        const card = cards.find((c) => c.cardId === a.cardId);
        if (card == null)
            return false;
        const min = card.minimumDueCents ?? 0;
        return a.actionType === "BY_DUE_DATE" && a.amountCents > min;
    });
    if (extra.length > 0) {
        const first = extra[0];
        const strategyLabel = strategy === "snowball"
            ? "snowball (smallest balance)"
            : strategy === "avalanche"
                ? "avalanche (highest APR)"
                : "utilization";
        lines.push(`Extra to ${first.cardName} (${strategyLabel}).`);
    }
    const beforeStatement = actions.filter((a) => a.actionType === "BEFORE_STATEMENT_CLOSE");
    if (beforeStatement.length > 0) {
        lines.push(`${beforeStatement.length} pre-statement payment${beforeStatement.length === 1 ? "" : "s"} to lower utilization.`);
    }
    return lines.slice(0, 5).map((s) => s.slice(0, 140));
}
/**
 * Generates a full plan: validates, allocates, and returns a PlanSnapshot.
 * Orchestrates validation, allocation, and snapshot creation.
 *
 * - Validation: throws ConstraintViolationError if cash cannot cover minimums.
 * - Plan ID and generatedAt: deterministic when options.referenceDate (and optionally planId/generatedAt) are set.
 * - Portfolio: total utilization (0–10 scale) and confidence from data completeness.
 *
 * @param cards - Card metadata with balances and terms
 * @param availableCashCents - Total cash available for payments (cents)
 * @param strategy - Strategy for distributing extra cash after minimums
 * @param options - Optional reference date and overrides for deterministic output
 * @returns PlanSnapshot with actions, portfolio metrics, focusSummary, and nextAction
 */
export function generatePlan(cards, availableCashCents, strategy, options) {
    const result = validateConstraints(cards, availableCashCents);
    if (!result.success) {
        throw result.error;
    }
    const referenceDate = options?.referenceDate ?? new Date();
    const actions = allocatePayments(cards, availableCashCents, strategy, referenceDate);
    const planId = options?.planId ??
        deterministicPlanId(cards, availableCashCents, strategy, referenceDate);
    const generatedAt = options?.generatedAt ?? referenceDate.toISOString();
    const projectedByCard = projectedBalancesByCard(cards, actions);
    const utilization = portfolioUtilization(cards, projectedByCard);
    const confidence = portfolioConfidence(cards);
    const nextAction = pickNextAction(actions);
    const focusSummary = buildFocusSummary(cards, actions, strategy);
    return {
        planId,
        generatedAt,
        cycleLabel: "This Cycle",
        focusSummary,
        nextAction,
        actions,
        portfolio: {
            utilization,
            confidence,
        },
    };
}
