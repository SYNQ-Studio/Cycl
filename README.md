# Credit Card Payment Planner

This repo is in Phase 0 scaffolding. The initial UI generated from Figma Make is preserved as a web app under `apps/web`.

## Requirements

- **Node.js >= 20** (required by CI, web/api tooling, and the Expo mobile app). Use `nvm use` or `fnm use` in the repo root (`.nvmrc` is set to 20). On Node 18, the mobile app will fail with `TypeError: configs.toReversed is not a function` and npm will show EBADENGINE warnings.

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
