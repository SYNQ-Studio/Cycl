import { desc, eq } from "drizzle-orm";
import {
  cards as cardsTable,
  plans as plansTable,
  planPreferences as planPreferencesTable,
} from "@ccpp/shared/schema";
import type { Plan } from "@ccpp/shared/schema";
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
import type { Database } from "../types.js";
import { AppError, ERROR_CODES, type ErrorDetails } from "../errors.js";

const SOLVER_TIMEOUT_MS = 500;

export type PlanResponse = {
  plan: PlanSnapshot;
  strategy: Strategy;
  availableCashCents: number;
  totalPaymentCents: number;
};

export async function loadPlanPreferences(
  tx: Database,
  userId: string
) {
  const [preferences] = await tx
    .select()
    .from(planPreferencesTable)
    .where(eq(planPreferencesTable.userId, userId))
    .limit(1);
  return preferences ?? null;
}

export async function upsertPlanPreferences(
  tx: Database,
  input: { userId: string; strategy: Strategy; availableCashCents: number }
) {
  const [preferences] = await tx
    .insert(planPreferencesTable)
    .values({
      userId: input.userId,
      strategy: input.strategy,
      availableCashCents: input.availableCashCents,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: planPreferencesTable.userId,
      set: {
        strategy: input.strategy,
        availableCashCents: input.availableCashCents,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!preferences) {
    throw new AppError({
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Failed to persist plan preferences.",
    });
  }

  return preferences;
}

export async function fetchLatestPlan(tx: Database, userId: string) {
  const [latest] = await tx
    .select()
    .from(plansTable)
    .where(eq(plansTable.userId, userId))
    .orderBy(desc(plansTable.generatedAt))
    .limit(1);
  return latest ?? null;
}

export async function fetchCards(tx: Database, userId: string) {
  return tx
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.userId, userId))
    .orderBy(desc(cardsTable.updatedAt));
}

function buildSolverCards(cards: Awaited<ReturnType<typeof fetchCards>>): CardMeta[] {
  const activeCards = cards.filter((card) => !card.excludeFromOptimization);
  return activeCards.map((card) => ({
    ...dbCardToCardMeta(card),
    currentBalanceCents: card.currentBalanceCents,
  }));
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

export async function generateAndPersistPlan(
  tx: Database,
  input: { userId: string; strategy: Strategy; availableCashCents: number }
): Promise<PlanResponse> {
  const cards = await fetchCards(tx, input.userId);
  const solverCards = buildSolverCards(cards);

  const start = Date.now();
  let snapshot: PlanSnapshot;

  try {
    snapshot = await generatePlanWithTimeout(
      solverCards,
      input.availableCashCents,
      input.strategy
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
        details: error.getPayload() as unknown as ErrorDetails,
      });
    }
    throw new AppError({
      status: 500,
      code: ERROR_CODES.SOLVER_ERROR,
      message: "Failed to generate plan.",
      details: error instanceof Error ? { message: error.message } : undefined,
    });
  } finally {
    const durationMs = Date.now() - start;
    console.info(
      `[solver] generatePlan user=${input.userId} cards=${solverCards.length} strategy=${input.strategy} durationMs=${durationMs}`
    );
  }

  const totalPaymentCents = snapshot.actions.reduce(
    (sum, action) => sum + action.amountCents,
    0
  );

  const newPlan = planSnapshotToDbPlan(snapshot, {
    userId: input.userId,
    strategy: input.strategy,
    availableCashCents: input.availableCashCents,
    totalPaymentCents,
  });

  const [saved] = await tx.insert(plansTable).values(newPlan).returning();

  if (!saved) {
    throw new AppError({
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Failed to persist plan.",
    });
  }

  return formatPlanResponse(saved, {
    strategy: input.strategy,
    availableCashCents: input.availableCashCents,
    totalPaymentCents,
  });
}

export function formatPlanResponse(
  plan: Plan,
  overrides?: { strategy?: Strategy; availableCashCents?: number; totalPaymentCents?: number }
): PlanResponse {
  const snapshot = dbPlanToPlanSnapshot(plan);
  return {
    plan: snapshot,
    strategy: (overrides?.strategy ?? plan.strategy) as Strategy,
    availableCashCents:
      overrides?.availableCashCents ?? plan.availableCashCents,
    totalPaymentCents:
      overrides?.totalPaymentCents ?? plan.totalPaymentCents,
  };
}
