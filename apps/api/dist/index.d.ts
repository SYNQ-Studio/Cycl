import { Hono } from "hono";
import type { AppEnv } from "./types.js";
declare const app: Hono<AppEnv, import("hono/types").BlankSchema, "/">;
export { app };
export default app;
//# sourceMappingURL=index.d.ts.map