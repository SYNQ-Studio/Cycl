import { CardInput, StoredCard } from "@ccpp/shared/mobile";
import { getAllAsync, getFirstAsync, runAsync } from "./db";
import { makeId } from "../utils/id";

type DbCardRow = {
  id: string;
  name: string;
  issuer: string | null;
  credit_limit_cents: number;
  current_balance_cents: number;
  minimum_payment_cents: number;
  apr_bps: number;
  statement_close_day: number;
  due_date_day: number;
  exclude_from_optimization: number;
  created_at: string;
  updated_at: string;
};

function mapRow(row: DbCardRow): StoredCard {
  return StoredCard.parse({
    id: row.id,
    name: row.name,
    issuer: row.issuer ?? undefined,
    creditLimitCents: row.credit_limit_cents,
    currentBalanceCents: row.current_balance_cents,
    minimumPaymentCents: row.minimum_payment_cents,
    aprBps: row.apr_bps,
    statementCloseDay: row.statement_close_day,
    dueDateDay: row.due_date_day,
    excludeFromOptimization: row.exclude_from_optimization === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function listCards(): Promise<StoredCard[]> {
  const rows = await getAllAsync<DbCardRow>(
    "SELECT * FROM cards ORDER BY name ASC"
  );
  return rows.map((row) => mapRow(row));
}

export async function getCard(cardId: string): Promise<StoredCard | null> {
  const row = await getFirstAsync<DbCardRow>(
    "SELECT * FROM cards WHERE id = ? LIMIT 1",
    [cardId]
  );
  return row ? mapRow(row) : null;
}

export async function createCard(input: CardInput): Promise<StoredCard> {
  const parsed = CardInput.parse(input);
  const now = new Date().toISOString();
  const id = makeId("card");
  await runAsync(
    `INSERT INTO cards (
      id,
      name,
      issuer,
      credit_limit_cents,
      current_balance_cents,
      minimum_payment_cents,
      apr_bps,
      statement_close_day,
      due_date_day,
      exclude_from_optimization,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      parsed.name,
      parsed.issuer ?? null,
      parsed.creditLimitCents,
      parsed.currentBalanceCents,
      parsed.minimumPaymentCents,
      parsed.aprBps,
      parsed.statementCloseDay,
      parsed.dueDateDay,
      parsed.excludeFromOptimization ? 1 : 0,
      now,
      now,
    ]
  );
  return mapRow({
    id,
    name: parsed.name,
    issuer: parsed.issuer ?? null,
    credit_limit_cents: parsed.creditLimitCents,
    current_balance_cents: parsed.currentBalanceCents,
    minimum_payment_cents: parsed.minimumPaymentCents,
    apr_bps: parsed.aprBps,
    statement_close_day: parsed.statementCloseDay,
    due_date_day: parsed.dueDateDay,
    exclude_from_optimization: parsed.excludeFromOptimization ? 1 : 0,
    created_at: now,
    updated_at: now,
  });
}

export async function updateCard(
  cardId: string,
  input: CardInput
): Promise<StoredCard> {
  const parsed = CardInput.parse(input);
  const now = new Date().toISOString();
  const existing = await getCard(cardId);
  const createdAt = existing?.createdAt ?? now;
  await runAsync(
    `UPDATE cards SET
      name = ?,
      issuer = ?,
      credit_limit_cents = ?,
      current_balance_cents = ?,
      minimum_payment_cents = ?,
      apr_bps = ?,
      statement_close_day = ?,
      due_date_day = ?,
      exclude_from_optimization = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      parsed.name,
      parsed.issuer ?? null,
      parsed.creditLimitCents,
      parsed.currentBalanceCents,
      parsed.minimumPaymentCents,
      parsed.aprBps,
      parsed.statementCloseDay,
      parsed.dueDateDay,
      parsed.excludeFromOptimization ? 1 : 0,
      now,
      cardId,
    ]
  );
  return mapRow({
    id: cardId,
    name: parsed.name,
    issuer: parsed.issuer ?? null,
    credit_limit_cents: parsed.creditLimitCents,
    current_balance_cents: parsed.currentBalanceCents,
    minimum_payment_cents: parsed.minimumPaymentCents,
    apr_bps: parsed.aprBps,
    statement_close_day: parsed.statementCloseDay,
    due_date_day: parsed.dueDateDay,
    exclude_from_optimization: parsed.excludeFromOptimization ? 1 : 0,
    created_at: createdAt,
    updated_at: now,
  });
}

export async function deleteCard(cardId: string): Promise<void> {
  await runAsync("DELETE FROM cards WHERE id = ?", [cardId]);
}
