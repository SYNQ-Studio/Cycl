export declare const ERROR_CODES: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly SOLVER_TIMEOUT: "SOLVER_TIMEOUT";
    readonly SOLVER_CONSTRAINT_VIOLATION: "SOLVER_CONSTRAINT_VIOLATION";
    readonly SOLVER_ERROR: "SOLVER_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export interface ErrorDetails {
    [key: string]: unknown;
}
export interface ErrorShape {
    error: {
        code: ErrorCode;
        message: string;
        details: ErrorDetails | null;
        timestamp: string;
    };
}
export declare class AppError extends Error {
    readonly status: number;
    readonly code: ErrorCode;
    readonly details?: ErrorDetails;
    constructor(options: {
        status: number;
        code: ErrorCode;
        message: string;
        details?: ErrorDetails;
    });
}
export declare function isAppError(error: unknown): error is AppError;
//# sourceMappingURL=errors.d.ts.map