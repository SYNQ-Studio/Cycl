import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "@ccpp/shared/schema";
import { env } from "./env.js";
const sslSetting = env.DB_SSL === "disable" ? false : env.DB_SSL;
export const pool = postgres(env.SUPABASE_DATABASE_URL, {
    max: env.DB_POOL_MAX,
    ssl: sslSetting,
});
export const db = drizzle(pool, { schema });
export async function withRls(userId, work) {
    return db.transaction(async (tx) => {
        await tx.execute(sql `select set_config('request.jwt.claim.sub', ${userId}, true)`);
        await tx.execute(sql `select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`);
        await tx.execute(sql `select set_config('role', ${env.DB_AUTH_ROLE}, true)`);
        return work(tx);
    });
}
