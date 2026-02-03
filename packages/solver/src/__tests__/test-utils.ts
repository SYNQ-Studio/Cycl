import type { PlanAction } from "@ccpp/shared";

export function sumActionAmounts(actions: PlanAction[]): number {
  return actions.reduce((sum, action) => sum + action.amountCents, 0);
}
