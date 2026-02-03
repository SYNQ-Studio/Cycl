import { Hono, type Context } from "hono";
import { and, desc, eq } from "@ccpp/shared/drizzle";
import { cards as cardsTable } from "@ccpp/shared/schema";
import type { AppEnv, WithRls } from "../types.js";
import { AppError, ERROR_CODES } from "../errors.js";
import { validateJson, validateParams } from "../middleware/validate.js";
import {
  cardIdParamsSchema,
  createCardSchema,
  updateCardSchema,
  type CreateCardInput,
  type UpdateCardInput,
  type CardIdParams,
} from "../schemas/cards.js";

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

router.get("/cards", async (c) => {
  const userId = requireUserId(c);
  const withRls = requireWithRls(c);

  const list = await withRls((tx) =>
    tx
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.userId, userId))
      .orderBy(desc(cardsTable.updatedAt))
  );

  return c.json(list);
});

router.post("/cards", validateJson(createCardSchema), async (c) => {
  const userId = requireUserId(c);
  const withRls = requireWithRls(c);
  const input = c.get("validatedBody") as CreateCardInput;

  const payload = {
    ...input,
    userId,
    issuer: input.issuer ?? null,
    excludeFromOptimization: input.excludeFromOptimization ?? false,
  };

  const [created] = await withRls((tx) =>
    tx.insert(cardsTable).values(payload).returning()
  );

  if (!created) {
    throw new AppError({
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Failed to create card.",
    });
  }

  return c.json(created, 201);
});

router.patch(
  "/cards/:id",
  validateParams(cardIdParamsSchema),
  validateJson(updateCardSchema),
  async (c) => {
    const userId = requireUserId(c);
    const withRls = requireWithRls(c);
    const { id } = c.get("validatedParams") as CardIdParams;
    const updates = c.get("validatedBody") as UpdateCardInput;

    const payload = {
      ...updates,
      issuer:
        updates.issuer === undefined ? undefined : (updates.issuer ?? null),
      updatedAt: new Date(),
    };

    const [updated] = await withRls((tx) =>
      tx
        .update(cardsTable)
        .set(payload)
        .where(and(eq(cardsTable.id, id), eq(cardsTable.userId, userId)))
        .returning()
    );

    if (!updated) {
      throw new AppError({
        status: 404,
        code: ERROR_CODES.NOT_FOUND,
        message: "Card not found.",
      });
    }

    return c.json(updated);
  }
);

router.delete(
  "/cards/:id",
  validateParams(cardIdParamsSchema),
  async (c) => {
    const userId = requireUserId(c);
    const withRls = requireWithRls(c);
    const { id } = c.get("validatedParams") as CardIdParams;

    const [deleted] = await withRls((tx) =>
      tx
        .delete(cardsTable)
        .where(and(eq(cardsTable.id, id), eq(cardsTable.userId, userId)))
        .returning()
    );

    if (!deleted) {
      throw new AppError({
        status: 404,
        code: ERROR_CODES.NOT_FOUND,
        message: "Card not found.",
      });
    }

    return c.json(deleted);
  }
);

export default router;
