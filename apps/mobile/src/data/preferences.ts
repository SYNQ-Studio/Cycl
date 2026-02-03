import { PlanPreferences } from "@ccpp/shared/mobile";
import { getFirstAsync, runAsync } from "./db";

const DEFAULT_STRATEGY = "utilization";

export async function getPlanPreferences(): Promise<PlanPreferences> {
  const row = await getFirstAsync<{
    available_cash_cents: number;
    strategy: string;
    updated_at: string;
  }>("SELECT * FROM plan_preferences WHERE id = 1 LIMIT 1");

  if (!row) {
    return PlanPreferences.parse({
      availableCashCents: 0,
      strategy: DEFAULT_STRATEGY,
      updatedAt: new Date().toISOString(),
    });
  }

  return PlanPreferences.parse({
    availableCashCents: row.available_cash_cents,
    strategy: row.strategy,
    updatedAt: row.updated_at,
  });
}

export async function setPlanPreferences(
  availableCashCents: number,
  strategy: string
): Promise<PlanPreferences> {
  const updatedAt = new Date().toISOString();
  await runAsync(
    `INSERT OR REPLACE INTO plan_preferences
      (id, available_cash_cents, strategy, updated_at)
     VALUES (1, ?, ?, ?)`,
    [availableCashCents, strategy, updatedAt]
  );

  return PlanPreferences.parse({
    availableCashCents,
    strategy,
    updatedAt,
  });
}
