# Credit Card Payment Planner

This repo is in Phase 0 scaffolding. The initial UI generated from Figma Make is preserved as a web app under `apps/web`.

## Requirements

- **Node.js >= 18** (engines.node allows 18+ so pnpm works in new terminals). **Node 20 is recommended** for the Expo mobile app: on Node 18, `expo run:ios` can fail with `TypeError: configs.toReversed is not a function`. Use `nvm use` or `fnm use` in the repo root when running the mobile app (`.nvmrc` is set to 20).

## Repo Layout

- `apps/web`: Current web UI prototype (Vite + React).
- `apps/mobile`: Placeholder for the React Native app.
- `apps/api`: Placeholder for the API service.
- `packages/shared`: Shared schemas and types.
- `packages/solver`: Placeholder for deterministic solver.
- `packages/ui`: Placeholder for design system components.
- `docs/context`: Product and execution context (source of truth).

## Running the web app

1. Install dependencies: `pnpm install`
2. Start dev server: `pnpm dev:web`

## Running the mobile app

1. Install dependencies: `pnpm install`
2. Start Expo dev server: `pnpm --filter @ccpp/mobile start`
3. Prebuild (native scaffolding): `pnpm --filter @ccpp/mobile build`

## Mobile development notes

See `docs/context/DEV_NOTES.md` for known setup fixes (monorepo entrypoint, Metro resolution, iOS scripts with spaces, SQLite API changes).
