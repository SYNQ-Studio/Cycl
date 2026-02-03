# Architectural & Product Decisions

## 2026-02-03 — CI uses Corepack for pnpm provisioning

**Reason:** GitHub Actions jobs were failing with `Unable to locate executable file: pnpm`. Relying on Corepack keeps pnpm aligned with `packageManager` and avoids PATH issues in CI.

**Exact changes:**
- Enabled Corepack shims (`corepack enable`) and ensured `$HOME/.local/bin` is on PATH so `pnpm` is available for nested scripts (e.g., root scripts that call `pnpm -r`).
- Kept `corepack prepare pnpm@9.0.0 --activate` to pin the pnpm version.
- Removed `actions/setup-node` pnpm caching because it requires `pnpm` to be on PATH during setup on Blacksmith; rely on Blacksmith transparent cache and/or pnpm install caching instead.

## 2026-02-03 — CI runners switched to Blacksmith

**Reason:** Repo moved to the SYNQ-Studio org and CI is now running on Blacksmith runners for consistency with the new org setup.

**Exact changes:**
- Updated workflow jobs to use `runs-on: blacksmith-2vcpu-ubuntu-2404`.

## 2026-02-03 — Mobile TypeScript uses bundler module resolution

**Reason:** Expo's base tsconfig uses `customConditions`, which requires `moduleResolution` set to `bundler`, `node16`, or `nodenext`. CI typecheck failed with TS5098 under `node` resolution.

**Exact changes:**
- Set `apps/mobile/tsconfig.json` `compilerOptions.moduleResolution` to `bundler`.

## 2026-02-03 — Web ESLint FlatCompat includes recommended config

**Reason:** CI lint failed with `Missing parameter 'recommendedConfig' in FlatCompat constructor` due to `@eslint/eslintrc@3` requiring `recommendedConfig`.

**Exact changes:**
- Added `recommendedConfig: require("eslint/conf/eslint-recommended")` to `apps/web/eslint.config.js`.

## 2026-02-03 — Shared package coverage ignores config files

**Reason:** CI coverage failed due to config files being counted in coverage, which are not part of runtime source and skew branch thresholds.

**Exact changes:**
- Excluded `**/*.config.ts` from `packages/shared/vitest.config.ts` coverage.

## 2026-02-03 — API imports Drizzle from shared to avoid type duplication

**Reason:** `drizzle-orm` has many peer dependencies, and pnpm installs multiple copies with different peer sets across workspaces (web/mobile/api). Mixing table definitions from one copy with query helpers from another caused TypeScript errors about incompatible `PgTable` and `SQL` types.

**Exact changes:**
- Added `packages/shared/src/drizzle.ts` re-exporting Drizzle modules.
- Updated API imports to use `@ccpp/shared/drizzle` so tables and helpers come from the same Drizzle instance.

## 2026-02-03 — Clerk (auth) + Supabase (DB); single user ID

**Clerk** is the only identity provider. **Supabase** is the database (Postgres). They are separate; there is no Supabase Auth.

- **Canonical user ID:** The Clerk user ID (JWT `sub` claim, e.g. `user_2abc...`) is the single user identifier. All app and DB logic use this.
- **Database:** Every table that is user-scoped has a `user_id` column (type `text`) storing the **Clerk user ID**. No separate “Supabase user” table or mapping table.
- **API:** Verifies the Clerk JWT, reads `payload.sub` (Clerk user ID), and passes it to all DB work via `withRls(userId, work)` so queries are always scoped to that user.
- **RLS:** Row Level Security policies use `user_id = auth.uid()::text` so that if Supabase is ever used with a JWT (e.g. custom JWT or future frontend client), RLS enforces the same user. When the API connects with the database URL (service role or direct connection), RLS may be bypassed; the API is then solely responsible for scoping by Clerk user ID inside `withRls`.

See `docs/context/SUPABASE-CLERK.md` for setup and mapping details.

## 2026-02-03 — Mobile MVP uses local SQLite persistence

- **Local-only MVP**: Cards, plan snapshots, and plan preferences are stored in SQLite on-device to support offline use.
- **Manual overrides**: Editing a card directly updates the stored record (no separate overrides table in MVP).

## 2026-02-03 — Solver hash is pure JS for mobile compatibility

- **Reason**: The deterministic plan ID hash must work in React Native without Node crypto.
- **Behavior**: Same inputs + same reference date still produce a stable 32-character hex plan ID.

## 2026-02-03 — Dependency policy and development standards

- **Policy**: Prefer the latest stable versions of dependencies unless blocked by documented compatibility constraints.
- **Deprecated tooling**: Avoid deprecated APIs, commands, and workflows; follow current Expo/RN best practices.
- **Agent discipline**: Agents must think through root causes and update documentation when adding fixes.

## 2026-02-02 — MVP excludes Plaid

Reason: validate planning logic before external dependencies.

## 2026-02-02 — No payment execution

Reason: safety, trust, and scope control.

## 2026-02-02 — AI propose → solver verify

Reason: auditability and correctness.
