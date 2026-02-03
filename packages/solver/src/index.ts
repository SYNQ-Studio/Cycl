/**
 * @ccpp/solver – Credit Card Payment Planner solver package.
 * Main entry point; solver logic will be implemented here.
 */

export { type Card } from "@ccpp/shared/schema";
export type { CardMeta, Strategy } from "./types";
export {
  calculateUtilization,
  sortCardsByStrategy,
  getNextStatementCloseDate,
  getNextDueDate,
  daysInMonthUtc,
  nextDateFromDayOfMonth,
} from "./utils";
export { validateConstraints, type ValidationResult } from "./validation";
export {
  ConstraintViolationError,
  CONSTRAINT_VIOLATION_CODE,
  type ConstraintViolationPayload,
  type ConstraintSuggestion,
  type ConstraintSuggestionKind,
} from "./errors";
export { allocatePayments } from "./allocator";
export { generatePlan, type GeneratePlanOptions } from "./plan";
export type { PlanSnapshot, PlanAction } from "@ccpp/shared";
