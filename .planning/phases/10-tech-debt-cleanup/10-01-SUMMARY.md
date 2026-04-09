---
phase: 10-tech-debt-cleanup
plan: 01
subsystem: database, infra
tags: [supabase, typescript, types, type-safety, codegen]

# Dependency graph
requires:
  - phase: 01-foundation-data-model
    provides: initial schema and hand-generated types
  - phase: 06-quality-gates
    provides: gate_reviews table and gate_review squad_type
  - phase: 09-feedback-loop
    provides: reset_pipeline_cycle RPC
provides:
  - Auto-generated TypeScript types matching live Supabase schema
  - Fully typed Supabase client calls (zero as-any casts)
  - gate_reviews table types, gate_review squad_type, all 5 RPC signatures
affects: [11-production-deployment, 10-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use supabase gen types --project-id for cloud type generation"
    - "String-typed status fields from CHECK constraints (not PG ENUMs)"
    - "Zod validation as runtime type guard when bridging generated types to domain types"

key-files:
  created: []
  modified:
    - src/lib/database/types.ts
    - src/lib/actions/gate-review.ts
    - src/lib/actions/gates.ts
    - src/lib/actions/pipeline-reset.ts
    - src/worker/index.ts
    - src/lib/types/pipeline.ts
    - src/lib/actions/clients.ts
    - src/components/squad/RunSquadButton.tsx
    - package.json

key-decisions:
  - "Used supabase gen types --project-id for cloud generation instead of --local (no Docker needed)"
  - "Widened pipeline.ts prop types to string to match Supabase CHECK constraint typing (not PG ENUMs)"
  - "Used SquadJob type assertion in worker for claim_next_job result (Zod validates at runtime in runJob)"

patterns-established:
  - "db:types script uses --project-id lzpcugxyjzunmerenawy for live schema generation"
  - "Pipeline row types use string (not union literals) to match Supabase generated types"

requirements-completed: [DEBT-01, DEBT-02, DEBT-04]

# Metrics
duration: 7min
completed: 2026-04-09
---

# Phase 10 Plan 01: Regenerate TypeScript Types Summary

**Auto-generated types from live Supabase schema with gate_reviews table, 5 RPC signatures, and zero as-any casts across application code**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-09T19:50:26Z
- **Completed:** 2026-04-09T19:57:45Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Replaced hand-generated types.ts with auto-generated output from `supabase gen types typescript --project-id`
- Added gate_reviews table, gate_review squad_type, and all 5 RPC function signatures (claim_next_job, approve_gate, reject_gate, create_client_with_phases, reset_pipeline_cycle)
- Removed all 6 `(as any)` casts from 4 application files (gate-review.ts, gates.ts, pipeline-reset.ts, worker/index.ts)
- Confirmed tsx in devDependencies and worker script in package.json (DEBT-01 verified)
- Both `npx tsc --noEmit` and `npm run build` pass with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Regenerate TypeScript types from live Supabase schema** - `d228226` (chore)
2. **Task 2: Remove all (as any) casts from application code** - `df26c89` (fix)

## Files Created/Modified
- `src/lib/database/types.ts` - Auto-generated from live Supabase schema (replaces hand-generated)
- `src/lib/actions/gate-review.ts` - Removed 2 (admin as any) casts for squad_jobs and gate_reviews inserts
- `src/lib/actions/gates.ts` - Removed 2 (admin.rpc as any) casts for approve_gate and reject_gate RPCs
- `src/lib/actions/pipeline-reset.ts` - Removed 1 (admin.rpc as any) cast for reset_pipeline_cycle RPC
- `src/worker/index.ts` - Removed 1 (supabase as any) cast for claim_next_job RPC
- `src/lib/types/pipeline.ts` - Widened status/squad types to string (matches generated types)
- `src/lib/actions/clients.ts` - Fixed p_briefing type for create_client_with_phases RPC
- `src/components/squad/RunSquadButton.tsx` - Widened processStatus/latestJobStatus props to string
- `package.json` - Updated db:types script to use --project-id for cloud generation

## Decisions Made
- **Cloud type generation over local:** Used `--project-id lzpcugxyjzunmerenawy` to generate types directly from the live Supabase schema. No Docker required. Updated the `db:types` npm script accordingly.
- **String types for status fields:** The database uses CHECK constraints on TEXT columns (not PostgreSQL ENUM types), so `supabase gen types` outputs `string` instead of union literals. Widened pipeline.ts and RunSquadButton prop types to match, since runtime validation is already handled by Zod schemas in schema.ts.
- **SquadJob type assertion in worker:** The `claim_next_job` RPC returns rows with `string` fields, but `runJob()` expects `SquadJob` with literal union types. Used a type assertion since `runJob` already validates via `squadJobSchema.safeParse()` internally.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed PhaseRow type mismatch causing tsc error**
- **Found during:** Task 1 (after type regeneration)
- **Issue:** `src/app/(dashboard)/clients/[id]/page.tsx` line 130 used `PhaseRow` with literal `status` type, but Supabase query now returns `string`
- **Fix:** Widened all types in `src/lib/types/pipeline.ts` to use `string` for status/squad fields
- **Files modified:** src/lib/types/pipeline.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** d228226 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed p_briefing type incompatibility in createClientAction**
- **Found during:** Task 1 (after type regeneration)
- **Issue:** `Record<string, unknown> | null` not assignable to `Json | undefined` for create_client_with_phases RPC
- **Fix:** Changed cast to use `?? undefined` instead of `as Record<string, unknown> | null`
- **Files modified:** src/lib/actions/clients.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** d228226 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed RunSquadButton prop type mismatch**
- **Found during:** Task 1 (after type regeneration)
- **Issue:** `process.status` (now `string`) not assignable to `'pending' | 'active' | 'completed' | 'failed'` prop
- **Fix:** Widened `processStatus` and `latestJobStatus` props to `string` / `string | null`
- **Files modified:** src/components/squad/RunSquadButton.tsx
- **Verification:** tsc --noEmit passes
- **Committed in:** d228226 (Task 1 commit)

**4. [Rule 1 - Bug] Fixed p_notes null vs undefined for reject_gate RPC**
- **Found during:** Task 2 (after removing as-any casts)
- **Issue:** `p_notes` in generated types is `string | undefined` (optional), but code passed `null`
- **Fix:** Changed `?? null` to `?? undefined`
- **Files modified:** src/lib/actions/gates.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** df26c89 (Task 2 commit)

**5. [Rule 1 - Bug] Fixed claim_next_job RPC return type vs SquadJob literal types**
- **Found during:** Task 2 (after removing as-any casts)
- **Issue:** RPC returns `string` squad_type, but `runJob` expects `SquadJob` with literal union
- **Fix:** Added `SquadJob` type import and assertion at call site (Zod validates at runtime)
- **Files modified:** src/worker/index.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** df26c89 (Task 2 commit)

---

**Total deviations:** 5 auto-fixed (5x Rule 1 - Bug)
**Impact on plan:** All auto-fixes were direct consequences of the type regeneration. The Supabase CLI generates `string` for CHECK-constrained TEXT columns rather than union literals. These fixes bridge the gap between generated types and existing code. No scope creep.

## Issues Encountered
None beyond the type mismatches documented as deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TypeScript types fully match live Supabase schema
- All application code is properly typed with zero as-any casts
- Ready for Plan 10-02 (integration tests against live Supabase)
- Ready for Phase 11 (production deployment) -- worker can start via PM2 with tsx

---
*Phase: 10-tech-debt-cleanup*
*Completed: 2026-04-09*
