# PLANS.md

## Document Metadata

- Title: Execution Plan
- Status: Active
- Owner: TBD
- Last updated: 2026-02-03
- Current phase: Phase 2

# Credit Card Payment Planner

## Project Principles

1. Deterministic core: Solver is pure, testable TypeScript.
2. Manual first: No hard dependency on Plaid.
3. Explainability > automation.
4. Type safety everywhere (Zod schemas).

---

## Architecture Overview

apps/
web/ # Vite + React web prototype (Figma Make output)
mobile/ # Expo prebuild React Native app
api/ # Node.js API (TypeScript)
packages/
shared/ # Zod schemas + shared types
solver/ # Deterministic payment planner
ui/ # Design system components
docs/context/
PRD.md
PLANS.md
UI_SPEC.md
AI-SAFETY.md
AI-EVALUATION.md
README.md

---

## Data Contracts

### PlanSnapshot (v1)

- generatedAt
- cycleLabel
- focusSummary
- nextAction
- actions[]
- portfolio.utilization
- portfolio.confidence

### PlanAction

- cardId
- cardName
- actionType (BEFORE_STATEMENT_CLOSE | BY_DUE_DATE)
- amountCents
- targetDate
- priority
- reason

---

## Caching Rules

### Mobile

- TanStack Query
- Invalidate on override save, refresh, foreground

### Local

- SQLite: history
- App Group: latest snapshot

### Server

- Recompute on override change or scheduled job

---

## Security Rules

- No secrets in mobile app
- Clerk JWT verified server-side
- Supabase accessed only via API

---

## Implementation Phases

### Phase 0: Repo & Discipline

- Scaffold monorepo
- Lint, typecheck, test gates
- Add PRD.md and PLANS.md

### Phase 1: Solver

- Implement deterministic solver
- Unit tests for edge cases

### Phase 2: API

- GET /plan/current (returns selected strategy; auto-generates when no plan exists using stored preferences)
- GET /cards
- POST /overrides (updates card fields; triggers immediate plan recomputation)
- POST /plan/actions/:actionId/mark-paid (updates card balances + regenerates plan)
- Zod validation

---

## Phase 2 Execution Plan (API Functionality)

### Assumptions / Decisions (2026-02-03)

1. **POST /overrides updates card fields** (balances, APR, limits, dates, minimums, exclusion flag).
2. **GET /plan/current** returns the selected strategy and **auto-generates** if no plan exists using stored user preferences.
3. **Overrides trigger immediate plan recomputation** and persist the new plan snapshot.
4. **Mark paid** updates card balances and regenerates the plan in the same request.

### Agent Roles

- **Spec-1**: API contract decisions + docs updates.
- **Data-1**: Database + schema + migration changes.
- **API-1**: Plan endpoints (`/plan/current`, mark-paid changes).
- **API-2**: Overrides endpoint and recompute wiring.
- **Contracts-1**: Zod schemas + shared conversion updates.
- **QA-1**: Tests + typecheck/build fixes for api package.

### Parallel Ticket Breakdown

**T2-01 — Contracts & Preferences**

- Define stored preferences source for strategy and available cash (location + schema).
- Specify GET `/plan/current` response shape (include `strategy`, `availableCashCents`, `totalPaymentCents`, `snapshot`).
- Decide 404 vs. auto-generate behavior (auto-generate per decision).
- Update API error codes and docs.

**T2-02 — Overrides Data Model**

- Implement override persistence as **card field updates** (no separate overrides table).
- Ensure edited/overridden fields remain authoritative.
- Add DB migration if new preference storage is required.
- Update RLS policies if new tables are introduced.

**T2-03 — GET /plan/current**

- Fetch latest plan for user; if missing, pull stored preferences and generate plan.
- Persist generated plan and return response with selected strategy.
- Return `PlanSnapshot` with `markedPaidAt` fields where present.
- Add timeout/error mapping similar to `/plan/generate`.

**T2-04 — POST /overrides**

- Validate request body (card fields only).
- Apply updates to `cards` table.
- Recompute plan immediately using stored preferences.
- Persist and return updated plan snapshot.

**T2-05 — Mark Paid + Recompute**

- Update mark-paid handler to:
  - Apply `markedPaidAt` in snapshot.
  - Reduce `currentBalanceCents` for the action’s card.
  - Re-run solver using stored preferences.
  - Persist and return the new plan snapshot.

**T2-06 — Schemas + Conversions**

- Add Zod schemas for overrides payload/response and plan/current response.
- Ensure API output aligns with `PlanSnapshot` + `markedPaidAt`.
- Update shared conversions if needed for preference-backed plan generation.

**T2-07 — Tests + Tooling**

- Add tests for plan/current auto-generate, overrides recompute, mark-paid balance update.
- Fix `apps/api` typecheck/build issues (zod resolution, drizzle duplicate types).
- Ensure `pnpm -r test`, `pnpm -r typecheck`, `pnpm -r build` pass.

### Phase 3: Mobile MVP

- Implement Plan screen
- Manual card entry/edit
- Local snapshot persistence

### Phase 4: Explanation View

- Cycle-specific explanation
- Confidence and override acknowledgement

### Phase 5: Widget Plumbing

- Write snapshot to App Group
- Trigger widget refresh

---

## Acceptance Criteria

- App usable without Plaid
- Plan makes sense on real data
- No contradictory explanations
- All recommendations traceable
- TypeScript strict mode passes

---

## Agent Usage Rules

Agents may:

- Scaffold and refactor with tests
- Update schemas

Agents may NOT:

- Add automation beyond scope
- Modify solver to be non-deterministic
- Bypass schema validation

---

## AI Safety Spec (Future Versions)

### Scope (What AI is allowed to do)

AI features are explicitly scoped to **explanations, coaching, and scenario exploration**. AI must not directly determine payment amounts or dates without deterministic verification.

AI may:

- Generate natural-language explanations of deterministic solver outputs.
- Answer user questions using **user-provided/app-derived** structured data (UserFinancialProfile, card metadata, plan history).
- Propose **candidate** alternative actions or plan adjustments, provided they are validated by the deterministic solver before being shown as actionable.
- Summarize trends and progress (e.g., utilization trajectory, payment punctuality) using computed metrics.

### Hard Prohibitions (What AI must never do)

AI must never:

- Move money, initiate payments, or provide instructions that imply the app executes transfers.
- Claim guaranteed outcomes (e.g., “this will raise your credit score” or “the bank will increase your limit”).
- Invent issuer-specific policies or pretend to know confidential bank rules.
- Override user-configured constraints silently (cash buffer, minimum payments, due dates).
- Use raw transaction-level details in prompts unless explicitly enabled by the user and privacy-reviewed.
- Store or reveal sensitive secrets (Plaid tokens, passwords, MFA codes).

### Deterministic Verification Gate

Any AI-proposed action MUST pass a verification step:

1. AI proposes a candidate adjustment (e.g., additional pre-close payment).
2. Deterministic solver recomputes plan under constraints.
3. UI shows only solver-verified actions; AI output is displayed as explanation/context.

If verification fails, UI must present:

- why it failed (cash constraint, minimum payment risk, missing dates)
- what user input is needed to proceed

### Disclosure & Provenance

All AI outputs must include:

- Data used: “Based on your card details and last N plan snapshots”
- Confidence label: High / Medium / Low (rule-based, not model-generated)
- Disclaimer: No guarantees; issuer policies vary; informational guidance only

### Memory & Learning Policy

AI “learning” is implemented via a **UserFinancialProfile** derived from user actions and snapshots.

- Store **derived metrics** (cadence, slopes, preferences), not raw chat.
- Profile updates are deterministic and auditable.
- Users can reset/disable personalization.

### Evaluation Checklist (Required for AI-related PRs)

- No contradictions between AI text and solver output.
- No guarantee language.
- No issuer-policy hallucinations.
- Missing data triggers deterministic prompts (ask user), not guesses.
- Privacy: prompt contents minimized; no raw secrets.
- Tests added: schema validation + golden examples for common questions.
