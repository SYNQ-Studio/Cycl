# Supabase (DB) + Clerk (Auth) Setup

This doc describes how the database (Supabase) and authentication (Clerk) work together and how users are identified.

## Roles

| Service      | Role                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| **Clerk**    | Authentication only: sign-up, sign-in, JWT issuance, user identity.         |
| **Supabase** | Database only: Postgres (cards, plans, plan_preferences). No Supabase Auth. |

## User identity: one ID everywhere

- **Clerk user ID** (e.g. `user_2abc...`) is the only user identifier.
- It comes from the Clerk JWT `sub` claim after the API verifies the token.
- All user-scoped tables use a **`user_id`** column (type `text`) that stores this Clerk user ID.
- There is **no** separate “Supabase user” or mapping table: Clerk user ID = `user_id` in the DB.

## API flow

1. Client sends a request with `Authorization: Bearer <Clerk JWT>`.
2. API auth middleware verifies the JWT with Clerk and reads `payload.sub` (Clerk user ID).
3. The API sets `userId` on the request context and runs all DB work inside `withRls(userId, work)`.
4. Every query is scoped to that `userId` (e.g. `WHERE user_id = $userId`), so users only see their own rows.

## Database (Supabase)

- **Connection:** API uses `SUPABASE_DATABASE_URL` (direct Postgres connection or service role).
- **Tables:** `cards`, `plans`, `plan_preferences`; each has `user_id` (text) = Clerk user ID.
- **RLS:** Policies use `user_id = auth.uid()::text` so that any connection that does provide a JWT (e.g. custom token or future Supabase client) still enforces per-user access. When the API connects with the service/direct URL, RLS may be bypassed; in that case the API’s use of `withRls(userId, work)` is what enforces “users only see their own data.”

## Environment

- **Clerk:** `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` (and optional `CLERK_JWT_ISSUER` / `CLERK_AUTHORIZED_PARTIES`) for JWT verification.
- **Supabase:** `SUPABASE_DATABASE_URL` for the Postgres connection. No Supabase Auth keys required for this setup.

## Summary

Clerk = identity; Supabase = storage. The mapping is: **Clerk user ID = `user_id` in the database.** No extra mapping layer.
