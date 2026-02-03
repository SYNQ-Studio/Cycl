import postgres from "postgres";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@ccpp/shared/schema";
export type Database = PostgresJsDatabase<typeof schema>;
export declare const pool: postgres.Sql<{}>;
export declare const db: Database;
export declare function withRls<T>(userId: string, work: (tx: Database) => Promise<T>): Promise<T>;
//# sourceMappingURL=db.d.ts.map