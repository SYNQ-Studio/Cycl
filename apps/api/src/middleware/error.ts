import type { MiddlewareHandler } from "hono";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../types.js";
import { AppError, ERROR_CODES, type ErrorShape } from "../errors.js";
import { env } from "../env.js";

function buildErrorShape(
  code: ErrorShape["error"]["code"],
  message: string,
  details: Record<string, unknown> | null
): ErrorShape {
  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

export function handleError(
  error: unknown,
  c: Context<AppEnv>
): Response {
  const isDev = env.NODE_ENV === "development";

  if (error instanceof AppError) {
    const details = error.details ?? (isDev ? { stack: error.stack } : null);
    return c.json(
      buildErrorShape(error.code, error.message, details ?? null),
      error.status as ContentfulStatusCode
    );
  }

  if (error instanceof HTTPException) {
    const details = isDev ? { stack: error.stack } : null;
    const code =
      error.status === 401
        ? ERROR_CODES.UNAUTHORIZED
        : error.status === 403
        ? ERROR_CODES.FORBIDDEN
        : error.status === 404
        ? ERROR_CODES.NOT_FOUND
        : ERROR_CODES.INTERNAL_ERROR;
    return c.json(
      buildErrorShape(code, error.message, details),
      error.status as ContentfulStatusCode
    );
  }

  const details =
    isDev && error instanceof Error ? { stack: error.stack } : null;
  return c.json(
    buildErrorShape(
      ERROR_CODES.INTERNAL_ERROR,
      "Unexpected server error.",
      details
    ),
    500 as ContentfulStatusCode
  );
}

export const errorMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  try {
    await next();
  } catch (error) {
    return handleError(error, c);
  }
};

export function notFoundHandler(c: Context): Response {
  return c.json(
    buildErrorShape(ERROR_CODES.NOT_FOUND, "Resource not found.", null),
    404 as ContentfulStatusCode
  );
}
