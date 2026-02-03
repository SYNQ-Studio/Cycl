import { z } from "zod";
import { ISODateTime, PlanSnapshot } from "../ai";

export const Strategy = z.enum(["snowball", "avalanche", "utilization"]);
export type Strategy = z.infer<typeof Strategy>;

const CardBase = z.object({
  name: z.string().min(1).max(50),
  issuer: z.string().max(30).optional().nullable(),
  creditLimitCents: z.number().int().positive(),
  currentBalanceCents: z.number().int().nonnegative(),
  minimumPaymentCents: z.number().int().nonnegative(),
  aprBps: z.number().int().nonnegative().max(9999),
  statementCloseDay: z.number().int().min(1).max(31),
  dueDateDay: z.number().int().min(1).max(31),
  excludeFromOptimization: z.boolean().default(false),
});

const refineCard = (
  value: z.infer<typeof CardBase>,
  ctx: z.RefinementCtx
) => {
  if (value.currentBalanceCents > value.creditLimitCents) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Balance cannot exceed credit limit.",
      path: ["currentBalanceCents"],
    });
  }
  if (value.minimumPaymentCents > value.currentBalanceCents) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Minimum payment cannot exceed current balance.",
      path: ["minimumPaymentCents"],
    });
  }
};

export const CardInput = CardBase.superRefine(refineCard);

export type CardInput = z.infer<typeof CardInput>;

export const StoredCard = CardBase.extend({
  id: z.string().min(1),
  createdAt: ISODateTime,
  updatedAt: ISODateTime,
}).superRefine(refineCard);

export type StoredCard = z.infer<typeof StoredCard>;

export const PlanPreferences = z.object({
  availableCashCents: z.number().int().nonnegative().default(0),
  strategy: Strategy.default("utilization"),
  updatedAt: ISODateTime,
});

export type PlanPreferences = z.infer<typeof PlanPreferences>;

export const PlanSnapshotRecord = z.object({
  id: z.string().min(1),
  generatedAt: ISODateTime,
  strategy: Strategy,
  availableCashCents: z.number().int().nonnegative(),
  totalPaymentCents: z.number().int().nonnegative(),
  snapshot: PlanSnapshot,
});

export type PlanSnapshotRecord = z.infer<typeof PlanSnapshotRecord>;
