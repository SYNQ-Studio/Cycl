CREATE TABLE IF NOT EXISTS "plan_preferences" (
  "user_id" text PRIMARY KEY,
  "strategy" text NOT NULL,
  "available_cash_cents" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "plan_preferences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own plan preferences"
  ON "plan_preferences"
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
