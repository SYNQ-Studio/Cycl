import { z } from "zod";

export const actionIdParamsSchema = z.object({
  actionId: z.coerce.number().int().nonnegative(),
});

export type ActionIdParams = z.infer<typeof actionIdParamsSchema>;
