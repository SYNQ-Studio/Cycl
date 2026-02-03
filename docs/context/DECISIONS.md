# Architectural & Product Decisions

## 2026-02-03 — Clerk (auth) + Supabase (DB); single user ID

**Clerk** is the only identity provider. **Supabase** is the database (Postgres). They are separate; there is no Supabase Auth.

- **Canonical user ID:** The Clerk user ID (JWT `sub` claim, e.g. `user_2abc...`) is the single user identifier. All app and DB logic use this.
- **Database:** Every table that is user-scoped has a `user_id` column (type `text`) storing the **Clerk user ID**. No separate “Supabase user” table or mapping table.
- **API:** Verifies the Clerk JWT, reads `payload.sub` (Clerk user ID), and passes it to all DB work via `withRls(userId, work)` so queries are always scoped to that user.
- **RLS:** Row Level Security policies use `user_id = auth.uid()::text` so that if Supabase is ever used with a JWT (e.g. custom JWT or future frontend client), RLS enforces the same user. When the API connects with the database URL (service role or direct connection), RLS may be bypassed; the API is then solely responsible for scoping by Clerk user ID inside `withRls`.

See `docs/context/SUPABASE-CLERK.md` for setup and mapping details.

## 2026-02-02 — MVP excludes Plaid

Reason: validate planning logic before external dependencies.

## 2026-02-02 — No payment execution

Reason: safety, trust, and scope control.

## 2026-02-02 — AI propose → solver verify

Reason: auditability and correctness.
