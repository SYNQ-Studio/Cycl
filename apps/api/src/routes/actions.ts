import { Hono, type Context } from "hono";
import { desc, eq, sql } from "drizzle-orm";
import { plans as plansTable } from "@ccpp/shared/schema";
import { dbPlanToPlanSnapshot } from "@ccpp/shared";
import type { AppEnv, WithRls } from "../types.js";
import { AppError, ERROR_CODES } from "../errors.js";
import { validateParams } from "../middleware/validate.js";
import {
  actionIdParamsSchema,
  type ActionIdParams,
} from "../schemas/actions.js";

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

    const [latestPlan] = await withRls((tx) =>
      tx
        .select()
        .from(plansTable)
        .where(eq(plansTable.userId, userId))
        .orderBy(desc(plansTable.generatedAt))
        .limit(1)
    );

    if (!latestPlan) {
      throw new AppError({
        status: 404,
        code: ERROR_CODES.NOT_FOUND,
        message: "Plan not found.",
      });
    }

    const snapshot = latestPlan.snapshotJson as Record<string, unknown>;
    const actions = Array.isArray(snapshot?.actions)
      ? (snapshot.actions as unknown[])
      : [];

    if (actionId < 0 || actionId >= actions.length) {
      throw new AppError({
        status: 404,
        code: ERROR_CODES.NOT_FOUND,
        message: "Plan action not found.",
      });
    }

    const jsonPath = `{actions,${actionId},markedPaidAt}`;

    const [updated] = await withRls((tx) =>
      tx
        .update(plansTable)
        .set({
          snapshotJson: sql`jsonb_set(${plansTable.snapshotJson}, ${sql.raw(
            `'${jsonPath}'`
          )}, to_jsonb(NOW()), false)`,
        })
        .where(eq(plansTable.id, latestPlan.id))
        .returning()
    );

    if (!updated) {
      throw new AppError({
        status: 404,
        code: ERROR_CODES.NOT_FOUND,
        message: "Plan action not found.",
      });
    }

    return c.json(dbPlanToPlanSnapshot(updated));
  }
);

export default router;
