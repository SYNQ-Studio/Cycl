import * as SQLite from "expo-sqlite";

type SqlParam = SQLite.SQLiteBindValue;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("ccpp.db");
  }
  return dbPromise;
}

export async function execAsync(sql: string): Promise<void> {
  const db = await getDb();
  await db.execAsync(sql);
}

export async function runAsync(
  sql: string,
  params: SqlParam[] = []
): Promise<void> {
  const db = await getDb();
  await db.runAsync(sql, ...params);
}

export async function getAllAsync<T>(
  sql: string,
  params: SqlParam[] = []
): Promise<T[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(sql, ...params);
  return rows as T[];
}

export async function getFirstAsync<T>(
  sql: string,
  params: SqlParam[] = []
): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync(sql, ...params);
  return (row ?? null) as T | null;
}

export async function initDb(): Promise<void> {
  await execAsync(
    `CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      issuer TEXT,
      credit_limit_cents INTEGER NOT NULL,
      current_balance_cents INTEGER NOT NULL,
      minimum_payment_cents INTEGER NOT NULL,
      apr_bps INTEGER NOT NULL,
      statement_close_day INTEGER NOT NULL,
      due_date_day INTEGER NOT NULL,
      exclude_from_optimization INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`
  );

  await execAsync(
    `CREATE TABLE IF NOT EXISTS plan_preferences (
      id INTEGER PRIMARY KEY NOT NULL,
      available_cash_cents INTEGER NOT NULL,
      strategy TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`
  );

  await execAsync(
    `CREATE TABLE IF NOT EXISTS plan_snapshots (
      id TEXT PRIMARY KEY NOT NULL,
      generated_at TEXT NOT NULL,
      strategy TEXT NOT NULL,
      available_cash_cents INTEGER NOT NULL,
      total_payment_cents INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`
  );
}
