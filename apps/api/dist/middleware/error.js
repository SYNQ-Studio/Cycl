import { HTTPException } from "hono/http-exception";
import { AppError, ERROR_CODES } from "../errors.js";
import { env } from "../env.js";
function buildErrorShape(code, message, details) {
    return {
        error: {
            code,
            message,
            details,
            timestamp: new Date().toISOString(),
        },
    };
}
export const errorMiddleware = async (c, next) => {
    try {
        await next();
    }
    catch (error) {
        const isDev = env.NODE_ENV === "development";
        if (error instanceof AppError) {
            const details = error.details ?? (isDev ? { stack: error.stack } : null);
            return c.json(buildErrorShape(error.code, error.message, details ?? null), error.status);
        }
        if (error instanceof HTTPException) {
            const details = isDev ? { stack: error.stack } : null;
            const code = error.status === 401
                ? ERROR_CODES.UNAUTHORIZED
                : error.status === 403
                    ? ERROR_CODES.FORBIDDEN
                    : error.status === 404
                        ? ERROR_CODES.NOT_FOUND
                        : ERROR_CODES.INTERNAL_ERROR;
            return c.json(buildErrorShape(code, error.message, details), error.status);
        }
        const details = isDev && error instanceof Error ? { stack: error.stack } : null;
        return c.json(buildErrorShape(ERROR_CODES.INTERNAL_ERROR, "Unexpected server error.", details), 500);
    }
};
export function notFoundHandler(c) {
    return c.json(buildErrorShape(ERROR_CODES.NOT_FOUND, "Resource not found.", null), 404);
}
