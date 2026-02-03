import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types.js";
import type { ZodError, ZodTypeAny } from "zod";
import { AppError, ERROR_CODES } from "../errors.js";

type ValidationDetails = {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
  issues: Array<{ path: string; message: string; code: string }>;
};

function formatZodError(error: ZodError): ValidationDetails {
  const flattened = error.flatten();
  return {
    formErrors: flattened.formErrors,
    fieldErrors: flattened.fieldErrors,
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    })),
  };
}

function throwValidationError(details: ValidationDetails): never {
  throw new AppError({
    status: 400,
    code: ERROR_CODES.VALIDATION_ERROR,
    message: "Request validation failed.",
    details,
  });
}

export function validateJson<TSchema extends ZodTypeAny>(
  schema: TSchema
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (error) {
      throw new AppError({
        status: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid JSON body.",
        details: { reason: "Malformed JSON" },
      });
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      throwValidationError(formatZodError(result.error));
    }

    c.set("validatedBody", result.data);
    await next();
  };
}

export function validateParams<TSchema extends ZodTypeAny>(
  schema: TSchema
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const params = c.req.param();
    const result = schema.safeParse(params);
    if (!result.success) {
      throwValidationError(formatZodError(result.error));
    }

    c.set("validatedParams", result.data);
    await next();
  };
}
