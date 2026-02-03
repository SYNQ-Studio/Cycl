import { z } from "zod";
import { updateCardSchema } from "./cards.js";

export const overridesRequestSchema = z.object({
  cardId: z.string().uuid(),
  updates: updateCardSchema,
});

export type OverridesRequest = z.infer<typeof overridesRequestSchema>;
