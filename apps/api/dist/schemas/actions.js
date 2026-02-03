import { z } from "zod";
export const actionIdParamsSchema = z.object({
    actionId: z.coerce.number().int().nonnegative(),
});
