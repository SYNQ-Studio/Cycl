import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const planPreferences = pgTable("plan_preferences", {
  userId: text("user_id").primaryKey(),
  strategy: text("strategy").notNull(),
  availableCashCents: integer("available_cash_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPlanPreferencesSchema = createInsertSchema(planPreferences);
export const selectPlanPreferencesSchema = createSelectSchema(planPreferences);

export type PlanPreferences = typeof planPreferences.$inferSelect;
export type NewPlanPreferences = typeof planPreferences.$inferInsert;
