export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  SOLVER_TIMEOUT: "SOLVER_TIMEOUT",
  SOLVER_CONSTRAINT_VIOLATION: "SOLVER_CONSTRAINT_VIOLATION",
  SOLVER_ERROR: "SOLVER_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

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

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: ErrorDetails;

  constructor(options: {
    status: number;
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
  }) {
    super(options.message);
    this.name = "AppError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
