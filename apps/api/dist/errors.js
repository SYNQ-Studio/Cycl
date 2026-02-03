export const ERROR_CODES = {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    SOLVER_TIMEOUT: "SOLVER_TIMEOUT",
    SOLVER_CONSTRAINT_VIOLATION: "SOLVER_CONSTRAINT_VIOLATION",
    SOLVER_ERROR: "SOLVER_ERROR",
    INTERNAL_ERROR: "INTERNAL_ERROR",
};
export class AppError extends Error {
    status;
    code;
    details;
    constructor(options) {
        super(options.message);
        this.name = "AppError";
        this.status = options.status;
        this.code = options.code;
        this.details = options.details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
export function isAppError(error) {
    return error instanceof AppError;
}
