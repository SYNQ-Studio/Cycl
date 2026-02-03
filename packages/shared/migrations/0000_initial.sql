-- user_id = Clerk user ID (JWT sub). RLS uses auth.uid()::text for JWT-based access; API uses withRls(userId) to scope by Clerk ID.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "cards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "issuer" text,
  "credit_limit_cents" integer NOT NULL,
  "current_balance_cents" integer NOT NULL,
  "minimum_payment_cents" integer NOT NULL,
  "apr_bps" integer NOT NULL,
  "statement_close_day" integer NOT NULL,
  "due_date_day" integer NOT NULL,
  "exclude_from_optimization" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL,
  "generated_at" timestamptz NOT NULL DEFAULT now(),
  "strategy" text NOT NULL,
  "available_cash_cents" integer NOT NULL,
  "total_payment_cents" integer NOT NULL,
  "snapshot_json" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "cards_user_id_idx" ON "cards" ("user_id");
CREATE INDEX IF NOT EXISTS "plans_user_id_idx" ON "plans" ("user_id");
CREATE INDEX IF NOT EXISTS "plans_generated_at_idx" ON "plans" ("generated_at");

ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own cards"
  ON "cards"
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can only access their own plans"
  ON "plans"
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
