import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@ccpp/shared/schema";

export type Database = PostgresJsDatabase<typeof schema>;

export type WithRls = <T>(work: (tx: Database) => Promise<T>) => Promise<T>;

export interface AppVariables {
  db: Database;
  userId?: string;
  withRls?: WithRls;
  validatedBody?: unknown;
  validatedParams?: unknown;
}

export interface AppEnv {
  Variables: AppVariables;
}
