---
phase: 06-quality-gates
plan: 02
subsystem: database, api, worker
tags: [supabase, zod, gate-review, adversarial-review, squad-jobs, worker]

# Dependency graph
requires:
  - phase: 03-pipeline-engine
    provides: quality_gates table, approve_gate/reject_gate RPCs
  - phase: 05-squad-execution-context
    provides: worker job-runner.ts, output-parser.ts, squad.ts Server Action pattern
provides:
  - gate_reviews table with verdict JSONB, raw_output, status
  - squad_jobs extended with 'gate_review' squad_type
  - runGateReview Server Action for triggering AI gate reviews
  - Worker gate_review handler with GateReviewVerdictSchema parsing
affects: [06-quality-gates, 08-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gate review as squad_job with special squad_type='gate_review'"
    - "Two-table pattern: squad_jobs (execution) + gate_reviews (verdict storage)"
    - "Dynamic import in worker for gate-specific schema (avoids bundler issues)"

key-files:
  created:
    - supabase/migrations/00008_gate_reviews.sql
    - src/lib/actions/gate-review.ts
    - src/lib/gates/review-schema.ts
    - src/lib/gates/review-prompt.ts
  modified:
    - src/lib/database/enums.ts
    - src/worker/job-runner.ts

key-decisions:
  - "Gate reviews reuse squad_jobs infrastructure with squad_type='gate_review' rather than separate job table"
  - "gate_reviews links to squad_jobs via squad_job_id FK with ON DELETE SET NULL for traceability"
  - "Worker uses dynamic import for GateReviewVerdictSchema to avoid bundler dependency"
  - "Admin client cast to any for gate_reviews/squad_jobs inserts (table not yet in generated types)"

patterns-established:
  - "Gate review pipeline: Server Action -> squad_jobs (gate_review) -> worker -> gate_reviews"
  - "Parallel plan stubs: create minimal type-correct stubs when depending on parallel plan outputs"

requirements-completed: [GATE-02, GATE-04]

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 6 Plan 02: Gate Review Backend Infrastructure Summary

**gate_reviews migration, runGateReview Server Action, and worker verdict parser for AI-powered quality gate reviews**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T14:56:41Z
- **Completed:** 2026-04-09T15:00:48Z
- **Tasks:** 2 of 3 (Task 3 is a human-action checkpoint)
- **Files modified:** 6

## Accomplishments
- Created gate_reviews table migration with full schema (verdict JSONB, raw_output, status, FKs to quality_gates, clients, squad_jobs)
- Extended squad_jobs CHECK constraint to accept 'gate_review' as valid squad_type
- Built runGateReview Server Action that assembles phase outputs, builds adversarial prompt, queues job, and creates gate_reviews record
- Extended worker job-runner.ts to parse gate review verdicts with GateReviewVerdictSchema and handle success/failure paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for gate_reviews table and squad_type extension** - `e985dc4` (feat)
2. **Task 2: runGateReview Server Action and worker gate_review handler** - `7e82ca0` (feat)
3. **Task 3: [BLOCKING] Run supabase db push** - CHECKPOINT (human-action, see below)

## Checkpoint: supabase db push Required

**Task 3** is a `checkpoint:human-action` that requires the operator to run:

```bash
supabase db push
```

If prompted about destructive changes (ALTER TABLE DROP CONSTRAINT on squad_jobs), confirm with 'y'.

Verify with: `supabase db diff` (should show no pending changes).

**Expected outcome:**
- squad_jobs table accepts 'gate_review' as squad_type
- gate_reviews table exists with all columns
- RLS policies active on gate_reviews

## Files Created/Modified
- `supabase/migrations/00008_gate_reviews.sql` - gate_reviews table, squad_type extension, RLS policies, indexes
- `src/lib/actions/gate-review.ts` - runGateReview Server Action (auth, validation, job queuing)
- `src/lib/gates/review-schema.ts` - GateReviewVerdictSchema Zod schema (stub for parallel execution)
- `src/lib/gates/review-prompt.ts` - buildReviewPrompt function (stub for parallel execution)
- `src/lib/database/enums.ts` - Added 'gate_review' to SQUAD_TYPES array
- `src/worker/job-runner.ts` - Gate review verdict parsing and gate_reviews table updates

## Decisions Made
- Gate reviews reuse the squad_jobs infrastructure with a special squad_type='gate_review' rather than a separate job table -- keeps the worker unified
- gate_reviews.squad_job_id uses ON DELETE SET NULL to preserve review history even if the job row is deleted
- Worker uses dynamic import for GateReviewVerdictSchema since it runs outside Next.js bundler
- Used `(admin as any)` casts for gate_reviews and squad_jobs inserts because the Supabase generated types don't include the new gate_reviews table yet (will resolve after db push + type regeneration)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created stub files for Plan 01 parallel dependencies**
- **Found during:** Task 2 (Server Action and worker handler)
- **Issue:** Plan 02 imports from `src/lib/gates/review-schema.ts` and `src/lib/gates/review-prompt.ts` which are created by Plan 01 (running in parallel). Without these files, TypeScript compilation fails.
- **Fix:** Created minimal type-correct stub files matching the interfaces specified in the plan. These stubs will be replaced/merged when Plan 01's output is integrated.
- **Files created:** `src/lib/gates/review-schema.ts`, `src/lib/gates/review-prompt.ts`
- **Verification:** `npx tsc --noEmit` passes with stubs
- **Committed in:** `7e82ca0` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Stub files are necessary for parallel execution. Plan 01 creates the authoritative versions with full checklist integration. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Gate review backend infrastructure complete pending `supabase db push`
- After db push: Plan 03 (gate review UI) can integrate with runGateReview Server Action
- Plan 01 stubs should be replaced with full implementations when Plan 01 merges

## Self-Check: PASSED

All 7 files verified on disk. Both task commits (e985dc4, 7e82ca0) found in git history.

---
*Phase: 06-quality-gates*
*Completed: 2026-04-09*
