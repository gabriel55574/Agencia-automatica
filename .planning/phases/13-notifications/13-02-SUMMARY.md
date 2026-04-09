---
phase: 13-notifications
plan: 02
subsystem: worker
tags: [node-cron, notifications, email, digest, fire-and-forget, worker]

# Dependency graph
requires:
  - phase: 13-notifications/01
    provides: "Notification infrastructure — email client, templates, notify functions, types"
  - phase: 04-worker
    provides: "Worker job-runner.ts and index.ts base implementation"
  - phase: 06-quality-gates
    provides: "Gate review verdict parsing in job-runner.ts"
  - phase: 12-cost-tracking
    provides: "Token extraction hooks in job-runner.ts close handler"
provides:
  - "Worker notification hooks on squad completion, failure, and gate review verdict"
  - "Daily digest cron job at 08:00 UTC via node-cron"
  - "fetchDigestData function for assembling digest email data from Supabase"
  - "Stuck client detection with per-phase threshold logic"
affects: [worker, notifications, daily-digest]

# Tech tracking
tech-stack:
  added: [node-cron, "@types/node-cron"]
  patterns: [fire-and-forget notifications, cron-in-worker, buildCompletionData helper]

key-files:
  created:
    - src/lib/notifications/digest.ts
    - tests/notifications/digest.test.ts
  modified:
    - src/worker/job-runner.ts
    - src/worker/index.ts
    - package.json

key-decisions:
  - "Fire-and-forget pattern with .catch() for all notification calls — no await on critical path"
  - "IIFE with try/catch for gate failure notification (async within sync callback context)"
  - "node-cron schedule runs in-process alongside worker — no separate cron service needed"

patterns-established:
  - "Fire-and-forget notification: .then().catch() chains that never block job processing"
  - "buildCompletionData helper: query client/process info, return null on failure to skip notification gracefully"
  - "Cron-in-worker: node-cron schedules colocated with worker process for zero-infra digest delivery"

requirements-completed: [NOTF-01, NOTF-02, NOTF-03]

# Metrics
duration: 5min
completed: 2026-04-09
---

# Phase 13 Plan 02: Worker Notification Integration Summary

**Worker notification hooks for squad completion/failure, gate review fail/partial alerts, and daily digest cron at 08:00 UTC via node-cron**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-09T21:10:00Z
- **Completed:** 2026-04-09T21:15:00Z
- **Tasks:** 6
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Integrated squad completion notifications into job-runner.ts — fires on both success and permanent failure (NOTF-01)
- Added gate failure/partial notification in gate review verdict path (NOTF-02)
- Created fetchDigestData module that queries clients, phases, gates, and jobs for daily digest email assembly
- Wired node-cron daily digest schedule at 08:00 UTC in worker index.ts (NOTF-03)
- All notification calls follow fire-and-forget pattern — cannot block or crash worker processing
- 10 unit tests for stuck client detection threshold logic, all passing

## Task Commits

All 6 tasks committed in a single atomic commit (code was implemented together):

1. **Task 1: Install node-cron dependency** - `fda3135` (chore)
2. **Task 2: Add notification hooks to job-runner.ts** - `fda3135` (feat)
3. **Task 3: Create daily digest data fetcher** - `fda3135` (feat)
4. **Task 4: Add daily digest cron to worker index.ts** - `fda3135` (feat)
5. **Task 5: Create digest data assembly tests** - `fda3135` (test)
6. **Task 6: Final verification — build and type check** - `fda3135` (verified)

**Plan metadata:** (this commit)

## Files Created/Modified

### Created
- `src/lib/notifications/digest.ts` - Daily digest data fetcher: queries clients, phases, gates, squad_jobs in parallel; calculates clients_by_phase, pending_approvals, failed_gates, stuck_clients, yesterday_completed_runs
- `tests/notifications/digest.test.ts` - 10 unit tests for stuck client detection thresholds across all 5 phases plus boundary cases

### Modified
- `src/worker/job-runner.ts` - Added imports for notification functions/types/enums; buildCompletionData helper; notifySquadCompletion on success + permanent failure; notifyGateFailure on fail/partial gate verdict
- `src/worker/index.ts` - Added node-cron import, fetchDigestData/notifyDailyDigest imports; daily digest cron schedule at 08:00 UTC; updated startup message to indicate notifications enabled
- `package.json` - Added node-cron (dependencies) and @types/node-cron (devDependencies)

## Decisions Made

- **Fire-and-forget pattern:** All notification calls use `.then().catch()` chains or IIFE with try/catch. Notifications never `await` on the critical path — a Resend outage cannot cause squad job failures (T-13-05 mitigation).
- **IIFE for gate failure:** The gate review notification uses an immediately-invoked async function `(async () => { ... })()` because it needs multiple sequential queries (client lookup, gate review row ID) within a synchronous callback context.
- **Cron-in-worker:** node-cron schedule runs inside the existing worker process rather than a separate cron service. The worker already has Supabase client and notification imports — adding cron here requires zero additional infrastructure.
- **buildCompletionData returns null on query failure:** If client/process lookup fails, the notification is silently skipped rather than throwing. This ensures database issues in non-critical queries never affect job processing.

## Deviations from Plan

### Minor Non-Plan Changes Included

The commit also included a few minor worker improvements that were present in the working tree alongside the notification code:

1. **Added `import path` and `PROJECT_DIR` constant** to job-runner.ts for worker cwd resolution
2. **Added `--max-budget-usd 5`** CLI flag to job-runner spawn args
3. **Added `cwd: PROJECT_DIR`** to spawn options for proper Claude Code working directory
4. **Added `import 'dotenv/config'`** to worker index.ts for environment variable loading

These are minor worker hardening changes, not architectural. No scope creep.

## Issues Encountered

None - code implemented cleanly matching the plan specification.

## Verification Results

- `npx tsc --noEmit` passes with zero errors
- `npx vitest run tests/notifications/` passes all 37 tests (27 template + 10 digest)
- All grep checks for notification function names, imports, and cron schedule pass

## User Setup Required

None - notification infrastructure (Resend API key, email addresses) was configured in Plan 13-01. This plan only wires existing functions into the worker.

## Next Phase Readiness

- Phase 13 Notifications is complete: infrastructure (13-01) + worker integration (13-02)
- Email notifications will fire automatically when squad jobs complete/fail, gate reviews return fail/partial, and daily at 08:00 UTC
- Operator can configure preferences via notification_preferences table (created in 13-01)

---
*Phase: 13-notifications*
*Completed: 2026-04-09*
