import { Hono, type Context } from "hono";
import { and, eq } from "@ccpp/shared/drizzle";
import { cards as cardsTable } from "@ccpp/shared/schema";
import type { Strategy } from "@ccpp/solver";
import type { AppEnv, WithRls } from "../types.js";
import { AppError, ERROR_CODES } from "../errors.js";
import { validateJson } from "../middleware/validate.js";
import {
  overridesRequestSchema,
  type OverridesRequest,
} from "../schemas/overrides.js";
import {
  generateAndPersistPlan,
  loadPlanPreferences,
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

router.post("/overrides", validateJson(overridesRequestSchema), async (c) => {
  const userId = requireUserId(c);
  const withRls = requireWithRls(c);
  const { cardId, updates } = c.get("validatedBody") as OverridesRequest;

  const response = await withRls(async (tx) => {
    const payload = {
      ...updates,
      issuer:
        updates.issuer === undefined ? undefined : (updates.issuer ?? null),
      updatedAt: new Date(),
    };

    const [updated] = await tx
      .update(cardsTable)
      .set(payload)
      .where(and(eq(cardsTable.id, cardId), eq(cardsTable.userId, userId)))
      .returning();

    if (!updated) {
      throw new AppError({
        status: 404,
        code: ERROR_CODES.NOT_FOUND,
        message: "Card not found.",
      });
    }

    const preferences = await loadPlanPreferences(tx, userId);
    if (!preferences) {
      throw new AppError({
        status: 404,
        code: ERROR_CODES.NOT_FOUND,
        message: "Plan preferences not found.",
        details: { suggestion: "Generate a plan to store preferences." },
      });
    }

    return generateAndPersistPlan(tx, {
      userId,
      strategy: preferences.strategy as Strategy,
      availableCashCents: preferences.availableCashCents,
    });
  });

  return c.json(response);
});

export default router;
