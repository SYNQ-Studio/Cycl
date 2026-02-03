import type { MiddlewareHandler } from "hono";
import { verifyToken } from "@clerk/backend";
import type { AppEnv } from "../types.js";
import { AppError, ERROR_CODES } from "../errors.js";
import { env } from "../env.js";
import { withRls } from "../db.js";

function parseBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim() || null;
  }
  return authHeader.trim() || null;
}

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = parseBearerToken(c.req.header("Authorization"));

  if (!token) {
    throw new AppError({
      status: 401,
      code: ERROR_CODES.UNAUTHORIZED,
      message: "Missing or invalid Authorization header.",
    });
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties: env.CLERK_AUTHORIZED_PARTIES,
    });

    const userId = payload.sub;
    if (!userId) {
      throw new AppError({
        status: 401,
        code: ERROR_CODES.UNAUTHORIZED,
        message: "Token missing subject claim.",
      });
    }

    c.set("userId", userId);
    c.set("withRls", (work) => withRls(userId, work));
    await next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError({
      status: 401,
      code: ERROR_CODES.UNAUTHORIZED,
      message: "Invalid or expired authentication token.",
    });
  }
};
