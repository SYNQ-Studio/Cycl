import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types.js";
import { db } from "../db.js";

export const dbMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("db", db);
  await next();
};
