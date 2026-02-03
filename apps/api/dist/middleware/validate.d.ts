import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types.js";
import type { ZodTypeAny } from "zod";
export declare function validateJson<TSchema extends ZodTypeAny>(schema: TSchema): MiddlewareHandler<AppEnv>;
export declare function validateParams<TSchema extends ZodTypeAny>(schema: TSchema): MiddlewareHandler<AppEnv>;
//# sourceMappingURL=validate.d.ts.map