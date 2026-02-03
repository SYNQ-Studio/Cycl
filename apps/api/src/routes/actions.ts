import { Hono, type Context } from "hono";
import { and, eq, sql } from "drizzle-orm";
import { cards as cardsTable, plans as plansTable } from "@ccpp/shared/schema";
import type { Strategy } from "@ccpp/solver";
import type { AppEnv, WithRls } from "../types.js";
import { AppError, ERROR_CODES } from "../errors.js";
import { validateParams } from "../middleware/validate.js";
import {
  actionIdParamsSchema,
  type ActionIdParams,
} from "../schemas/actions.js";
import {
  fetchLatestPlan,
  generateAndPersistPlan,
  loadPlanPreferences,
  upsertPlanPreferences,
} from "../services/plan.js";

const router = new Hono<AppEnv>();

function requireUserId(c: Context<AppEnv>): string {
  const userId = c.get("userId");
  if (!userId) {
    throw new AppError({
      status: 401,
      code: ERROR_CODES.UNAUTHORIZED,
      message: "Unauthorized request.",
    });
  }
  return userId;
}

function requireWithRls(c: Context<AppEnv>): WithRls {
  const withRls = c.get("withRls");
  if (!withRls) {
    throw new AppError({
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Database context not available.",
    });
  }
  return withRls;
}

router.post(
  "/plan/actions/:actionId/mark-paid",
  validateParams(actionIdParamsSchema),
  async (c) => {
    const userId = requireUserId(c);
    const withRls = requireWithRls(c);
    const { actionId } = c.get("validatedParams") as ActionIdParams;

    const response = await withRls(async (tx) => {
      const latestPlan = await fetchLatestPlan(tx, userId);

      if (!latestPlan) {
        throw new AppError({
          status: 404,
          code: ERROR_CODES.NOT_FOUND,
          message: "Plan not found.",
        });
      }

      const snapshot = latestPlan.snapshotJson as Record<string, unknown>;
      const actions = Array.isArray(snapshot?.actions)
        ? (snapshot.actions as Array<Record<string, unknown>>)
        : [];

      if (actionId < 0 || actionId >= actions.length) {
        throw new AppError({
          status: 404,
          code: ERROR_CODES.NOT_FOUND,
          message: "Plan action not found.",
        });
      }

      const action = actions[actionId] ?? {};
      const cardId = action.cardId as string | undefined;
      const amountCents = action.amountCents as number | undefined;

      if (!cardId || typeof amountCents !== "number") {
        throw new AppError({
          status: 400,
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Plan action data is invalid.",
        });
      }

      const [card] = await tx
        .select()
        .from(cardsTable)
        .where(and(eq(cardsTable.id, cardId), eq(cardsTable.userId, userId)))
        .limit(1);

      if (!card) {
        throw new AppError({
          status: 404,
          code: ERROR_CODES.NOT_FOUND,
          message: "Card not found for plan action.",
        });
      }

      const nextBalance = Math.max(0, card.currentBalanceCents - amountCents);

      const [updatedCard] = await tx
        .update(cardsTable)
        .set({ currentBalanceCents: nextBalance, updatedAt: new Date() })
        .where(and(eq(cardsTable.id, cardId), eq(cardsTable.userId, userId)))
        .returning();

      if (!updatedCard) {
        throw new AppError({
          status: 500,
          code: ERROR_CODES.INTERNAL_ERROR,
          message: "Failed to update card balance.",
        });
      }

      const jsonPath = `{actions,${actionId},markedPaidAt}`;

      const [updatedPlan] = await tx
        .update(plansTable)
        .set({
          snapshotJson: sql`jsonb_set(${plansTable.snapshotJson}, ${sql.raw(
            `'${jsonPath}'`
          )}, to_jsonb(NOW()), false)`,
        })
        .where(eq(plansTable.id, latestPlan.id))
        .returning();

      if (!updatedPlan) {
        throw new AppError({
          status: 404,
          code: ERROR_CODES.NOT_FOUND,
          message: "Plan action not found.",
        });
      }

      const preferences = await loadPlanPreferences(tx, userId);
      const strategy = (preferences?.strategy ??
        latestPlan.strategy) as Strategy;
      const availableCashCents =
        preferences?.availableCashCents ?? latestPlan.availableCashCents;

      if (!preferences) {
        await upsertPlanPreferences(tx, {
          userId,
          strategy,
          availableCashCents,
        });
      }

      return generateAndPersistPlan(tx, {
        userId,
        strategy,
        availableCashCents,
      });
    });

    return c.json(response);
  }
);

export default router;
