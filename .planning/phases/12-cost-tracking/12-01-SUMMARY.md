---
phase: 12-cost-tracking
plan: 01
subsystem: database, worker, costs
tags: [token-tracking, cost-estimation, claude-cli, supabase, vitest]

# Dependency graph
requires:
  - phase: 04-cli-orchestrator-job-queue
    provides: "Worker job-runner.ts with CLI spawn and close handler"
  - phase: 05-squad-execution-context
    provides: "output-parser.ts JSON envelope parsing pattern"
provides:
  - "squad_jobs.token_count and squad_jobs.estimated_cost_usd columns"
  - "processes.token_budget column for per-process budget alerts"
  - "extractTokenUsage() function for parsing CLI JSON usage metadata"
  - "calculateCost() utility with configurable COST_PER_1K_TOKENS rate"
  - "Cost type definitions: TokenUsage, CostBreakdownRow, MonthlyCostSummary, BudgetStatus"
  - "Worker auto-records token usage on every successful job completion"
affects: [12-02, 12-03, 12-04, cost-breakdown-page, dashboard-widget, budget-alerts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nullable cost columns with graceful null fallback on missing CLI metadata"
    - "Partial index on squad_jobs for cost aggregation (completed jobs with token data only)"
    - "Configurable cost rate constant pattern for pricing changes"

key-files:
  created:
    - "supabase/migrations/00010_cost_tracking.sql"
    - "src/lib/costs/types.ts"
    - "src/lib/costs/constants.ts"
    - "src/lib/costs/token-parser.ts"
    - "tests/costs/token-parser.test.ts"
  modified:
    - "src/lib/database/types.ts"
    - "src/lib/database/schema.ts"
    - "src/lib/types/pipeline.ts"
    - "src/worker/job-runner.ts"
    - "src/app/(dashboard)/clients/[id]/page.tsx"

key-decisions:
  - "NUMERIC(10,4) for estimated_cost_usd to support precise dollar amounts"
  - "Partial index on (client_id, completed_at) WHERE status=completed AND token_count IS NOT NULL for efficient aggregation"
  - "Null fallback when CLI output has no usage metadata (not error)"

patterns-established:
  - "Cost module at src/lib/costs/ with types, constants, and token-parser"
  - "Worker extracts metadata from CLI output and persists to squad_jobs in close handler"

requirements-completed: [COST-01, COST-03]

# Metrics
duration: 6min
completed: 2026-04-09
---

# Phase 12 Plan 01: Cost Tracking Data Infrastructure Summary

**Token extraction from Claude CLI output with cost estimation, DB migration for squad_jobs/processes cost columns, and worker integration recording usage per completed run**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-09T20:33:37Z
- **Completed:** 2026-04-09T20:39:37Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Migration 00010 adds token_count (INTEGER), estimated_cost_usd (NUMERIC(10,4)) to squad_jobs and token_budget (INTEGER) to processes, with partial index for cost aggregation
- Token parser extracts usage metadata from Claude CLI JSON envelope with graceful null fallback on missing/unparseable data
- Cost calculation utility with configurable rate (COST_PER_1K_TOKENS = $0.025/1K) and budget threshold constants
- Worker close handler automatically records token count and estimated cost on every successful job completion
- 14 unit tests covering extractTokenUsage and calculateCost, all passing
- TypeScript compiles with zero errors after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration + schema updates + cost utility module** - `5b74094` (feat)
2. **Task 2: Integrate token extraction into worker close handler** - `5520e57` (feat)

## Files Created/Modified

- `supabase/migrations/00010_cost_tracking.sql` - ALTER TABLE for token_count, estimated_cost_usd, token_budget + partial index
- `src/lib/costs/types.ts` - TokenUsage, CostBreakdownRow, MonthlyCostSummary, BudgetStatus types
- `src/lib/costs/constants.ts` - COST_PER_1K_TOKENS, calculateCost(), BUDGET_THRESHOLDS
- `src/lib/costs/token-parser.ts` - extractTokenUsage() parsing CLI JSON envelope for usage field
- `tests/costs/token-parser.test.ts` - 14 unit tests for token extraction and cost calculation
- `src/lib/database/types.ts` - Regenerated from live Supabase schema with new columns
- `src/lib/database/schema.ts` - Added token_count, estimated_cost_usd to squadJobSchema; token_budget to processSchema
- `src/lib/types/pipeline.ts` - Added token_count, estimated_cost_usd to LatestJobData type
- `src/worker/job-runner.ts` - Import token parser/calculator, extract and persist usage on success
- `src/app/(dashboard)/clients/[id]/page.tsx` - Updated squad_jobs query to include new columns, fixed LatestJobData type usage

## Decisions Made

- Used NUMERIC(10,4) for estimated_cost_usd for precise dollar amounts (avoids floating point issues)
- Partial index on (client_id, completed_at) WHERE status='completed' AND token_count IS NOT NULL to keep index small (T-12-02 mitigation)
- Null fallback when CLI output has no usage metadata (graceful, not error) per CONTEXT.md decision

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed LatestJobData type mismatch in client page**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** Adding token_count and estimated_cost_usd to LatestJobData type caused TS2322 in clients/[id]/page.tsx because the query and local type literals did not include the new fields
- **Fix:** Updated the squad_jobs select query to include new columns, switched jobsByProcessId Map and serialized object to use LatestJobData type directly, added LatestJobData import
- **Files modified:** src/app/(dashboard)/clients/[id]/page.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 5b74094 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for TypeScript correctness after type change. No scope creep.

## Issues Encountered

- Remote Supabase migration history was out of sync (MCP-applied migrations from prior phases). Resolved by repairing migration history: marked remote-only migrations as reverted, then marked local migrations 00001-00009 as applied, allowing 00010 to push cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Cost data infrastructure is complete and recording on every successful job
- Wave 2 plans (12-02 cost breakdown page, 12-03 budget alerts, 12-04 dashboard widget) can now query squad_jobs for token_count and estimated_cost_usd
- processes.token_budget column ready for budget alert UI

## Self-Check: PASSED

- All 11 files verified present on disk
- Commit 5b74094 (Task 1) verified in git log
- Commit 5520e57 (Task 2) verified in git log
- 14/14 unit tests passing
- TypeScript compiles with zero errors

---
*Phase: 12-cost-tracking*
*Completed: 2026-04-09*
