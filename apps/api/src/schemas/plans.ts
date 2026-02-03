import { z } from "zod";
import { ISODateTime, PlanAction, PlanSnapshot } from "@ccpp/shared/ai";

const strategySchema = z.enum(["snowball", "avalanche", "utilization"]);

export const generatePlanRequestSchema = z.object({
  availableCashCents: z.number().int().nonnegative(),
  strategy: strategySchema,
});

const planActionWithPaidSchema = PlanAction.extend({
  markedPaidAt: ISODateTime.optional(),
});

export const planSnapshotResponseSchema = PlanSnapshot.extend({
  actions: z.array(planActionWithPaidSchema),
  nextAction: planActionWithPaidSchema.optional(),
});

export const planResponseSchema = z.object({
  plan: planSnapshotResponseSchema,
  strategy: strategySchema,
  availableCashCents: z.number().int().nonnegative(),
  totalPaymentCents: z.number().int().nonnegative(),
});

export type GeneratePlanRequest = z.infer<typeof generatePlanRequestSchema>;
