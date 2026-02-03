import { AppError, ERROR_CODES } from "./errors.js";
function required(key) {
    const value = process.env[key];
    if (!value) {
        throw new AppError({
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: `Missing required environment variable: ${key}`,
            details: { key },
        });
    }
    return value;
}
function parseNumber(value, fallback) {
    if (value == null || value.trim() === "")
        return fallback;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        throw new AppError({
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: `Invalid numeric environment variable: ${value}`,
        });
    }
    return parsed;
}
function parseNodeEnv(value) {
    if (value === "production" || value === "test" || value === "development") {
        return value;
    }
    return "development";
}
function parseDbSsl(value) {
    if (value === "disable" || value === "prefer" || value === "require") {
        return value;
    }
    return "require";
}
export const env = {
    NODE_ENV: parseNodeEnv(process.env.NODE_ENV),
    PORT: parseNumber(process.env.PORT, 8787),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
    CLERK_PUBLISHABLE_KEY: required("CLERK_PUBLISHABLE_KEY"),
    CLERK_SECRET_KEY: required("CLERK_SECRET_KEY"),
    CLERK_JWT_ISSUER: process.env.CLERK_JWT_ISSUER,
    CLERK_AUTHORIZED_PARTIES: process.env.CLERK_AUTHORIZED_PARTIES?.split(",").map((value) => value.trim()).filter(Boolean),
    SUPABASE_DATABASE_URL: required("SUPABASE_DATABASE_URL"),
    DB_POOL_MAX: parseNumber(process.env.DB_POOL_MAX, 10),
    DB_SSL: parseDbSsl(process.env.DB_SSL),
    DB_AUTH_ROLE: process.env.DB_AUTH_ROLE ?? "authenticated",
};
