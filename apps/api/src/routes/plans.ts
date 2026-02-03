import { Hono, type Context } from "hono";
import { desc, eq } from "drizzle-orm";
import { cards as cardsTable, plans as plansTable } from "@ccpp/shared/schema";
import {
  dbCardToCardMeta,
  dbPlanToPlanSnapshot,
  planSnapshotToDbPlan,
  type PlanSnapshot,
} from "@ccpp/shared";
import {
  ConstraintViolationError,
  generatePlan,
  type CardMeta,
  type Strategy,
} from "@ccpp/solver";
import type { AppEnv, WithRls } from "../types.js";
import { AppError, ERROR_CODES } from "../errors.js";
import { validateJson } from "../middleware/validate.js";
import {
  generatePlanRequestSchema,
  type GeneratePlanRequest,
} from "../schemas/plans.js";

const SOLVER_TIMEOUT_MS = 500;

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

async function generatePlanWithTimeout(
  cards: CardMeta[],
  availableCashCents: number,
  strategy: Strategy
): Promise<PlanSnapshot> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<PlanSnapshot>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new AppError({
          status: 504,
          code: ERROR_CODES.SOLVER_TIMEOUT,
          message: "Plan generation timed out.",
          details: {
            suggestion:
              "Try reducing the number of cards or simplifying constraints.",
          },
        })
      );
    }, SOLVER_TIMEOUT_MS);
  });

  const resultPromise = Promise.resolve().then(() =>
    generatePlan(cards, availableCashCents, strategy)
  );

  try {
    return await Promise.race([resultPromise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

router.post(
  "/plan/generate",
  validateJson(generatePlanRequestSchema),
  async (c) => {
    const userId = requireUserId(c);
    const withRls = requireWithRls(c);
    const { availableCashCents, strategy } =
      c.get("validatedBody") as GeneratePlanRequest;

    const dbCards = await withRls((tx) =>
      tx
        .select()
        .from(cardsTable)
        .where(eq(cardsTable.userId, userId))
        .orderBy(desc(cardsTable.updatedAt))
    );

    const activeCards = dbCards.filter((card) => !card.excludeFromOptimization);
    const solverCards = activeCards.map((card) => ({
      ...dbCardToCardMeta(card),
      currentBalanceCents: card.currentBalanceCents,
    }));

    const start = Date.now();
    let snapshot: PlanSnapshot;

    try {
      snapshot = await generatePlanWithTimeout(
        solverCards,
        availableCashCents,
        strategy
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof ConstraintViolationError) {
        throw new AppError({
          status: 400,
          code: ERROR_CODES.SOLVER_CONSTRAINT_VIOLATION,
          message: error.message,
          details: error.getPayload(),
        });
      }
      throw new AppError({
        status: 500,
        code: ERROR_CODES.SOLVER_ERROR,
        message: "Failed to generate plan.",
        details: error instanceof Error ? { message: error.message } : null,
      });
    } finally {
      const durationMs = Date.now() - start;
      console.info(
        `[solver] generatePlan user=${userId} cards=${solverCards.length} strategy=${strategy} durationMs=${durationMs}`
      );
    }

    const totalPaymentCents = snapshot.actions.reduce(
      (sum, action) => sum + action.amountCents,
      0
    );

    const newPlan = planSnapshotToDbPlan(snapshot, {
      userId,
      strategy,
      availableCashCents,
      totalPaymentCents,
    });

    const [saved] = await withRls((tx) =>
      tx.insert(plansTable).values(newPlan).returning()
    );

    if (!saved) {
      throw new AppError({
        status: 500,
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "Failed to persist plan.",
      });
    }

    return c.json(dbPlanToPlanSnapshot(saved));
  }
);

export default router;
