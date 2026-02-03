import { PlanSnapshotRecord } from "@ccpp/shared/mobile";
import { getFirstAsync, runAsync } from "./db";

type DbSnapshotRow = {
  id: string;
  generated_at: string;
  strategy: string;
  available_cash_cents: number;
  total_payment_cents: number;
  snapshot_json: string;
  created_at: string;
};

function mapRow(row: DbSnapshotRow): PlanSnapshotRecord {
  return PlanSnapshotRecord.parse({
    id: row.id,
    generatedAt: row.generated_at,
    strategy: row.strategy,
    availableCashCents: row.available_cash_cents,
    totalPaymentCents: row.total_payment_cents,
    snapshot: JSON.parse(row.snapshot_json),
  });
}

export async function savePlanSnapshot(
  record: PlanSnapshotRecord
): Promise<void> {
  const createdAt = new Date().toISOString();
  await runAsync(
    `INSERT OR REPLACE INTO plan_snapshots
      (id, generated_at, strategy, available_cash_cents, total_payment_cents, snapshot_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.generatedAt,
      record.strategy,
      record.availableCashCents,
      record.totalPaymentCents,
      JSON.stringify(record.snapshot),
      createdAt,
    ]
  );
}

export async function getLatestPlanSnapshot(): Promise<PlanSnapshotRecord | null> {
  const row = await getFirstAsync<DbSnapshotRow>(
    "SELECT * FROM plan_snapshots ORDER BY created_at DESC LIMIT 1"
  );
  return row ? mapRow(row) : null;
}
