import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import type { AppEnv } from "./types.js";
import { env } from "./env.js";
import { handleError, notFoundHandler } from "./middleware/error.js";
import { dbMiddleware } from "./middleware/db.js";
import { authMiddleware } from "./middleware/auth.js";
import cardsRoutes from "./routes/cards.js";
import plansRoutes from "./routes/plans.js";
import actionsRoutes from "./routes/actions.js";
import overridesRoutes from "./routes/overrides.js";

const app = new Hono<AppEnv>();

app.onError(handleError);
app.use("*", logger());
app.use(
  "*",
  cors({
    origin:
      env.CORS_ORIGIN === "*"
        ? "*"
        : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("*", dbMiddleware);

app.get("/health", (c) => c.json({ status: "ok" }));

app.use("/api/*", authMiddleware);
app.route("/api", cardsRoutes);
app.route("/api", plansRoutes);
app.route("/api", actionsRoutes);
app.route("/api", overridesRoutes);

app.notFound(notFoundHandler);

const isVercel =
  process.env.VERCEL === "1" || process.env.VERCEL === "true";

if (env.NODE_ENV !== "test" && !isVercel) {
  serve({
    fetch: app.fetch,
    port: env.PORT,
  });
  console.log(`API listening on http://localhost:${env.PORT}`);
}

export { app };
export default app;
