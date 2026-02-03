import { z } from "zod";
import { ISODateTime, PlanSnapshot } from "@ccpp/shared/ai";
export const generatePlanRequestSchema = z.object({
    availableCashCents: z.number().int().nonnegative(),
    strategy: z.enum(["snowball", "avalanche", "utilization"]),
});
const planActionWithPaidSchema = PlanSnapshot.shape.actions.element.extend({
    markedPaidAt: ISODateTime.optional(),
});
export const planSnapshotResponseSchema = PlanSnapshot.extend({
    actions: z.array(planActionWithPaidSchema),
    nextAction: planActionWithPaidSchema.optional(),
});
