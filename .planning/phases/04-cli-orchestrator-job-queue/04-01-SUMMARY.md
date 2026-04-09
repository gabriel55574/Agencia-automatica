---
phase: 04-cli-orchestrator-job-queue
plan: 01
subsystem: infra
tags: [worker, job-queue, bullmq-alternative, claude-cli, pm2, tsx, supabase-realtime, postgresql, child-process]

# Dependency graph
requires:
  - phase: 03-pipeline-engine
    provides: squad_jobs table + claim_next_job() RPC, createAdminClient factory, SquadJob schema
  - phase: 01-foundation
    provides: Supabase schema, migrations, typed DB client

provides:
  - "PM2 ecosystem.config.js with agency-os (Next.js) and job-worker processes"
  - "src/worker/index.ts: Supabase Realtime subscription + 5s polling + SIGTERM handler"
  - "src/worker/job-runner.ts: Claude CLI spawn with progress buffering, retry backoff"
  - "src/worker/heartbeat.ts: 30-minute stuck job detection and recovery"
  - "Concurrency guard enforcing MAX_CONCURRENT=2 before every job claim"
  - "Exponential backoff retry: 60s/120s/240s for newAttempts 1/2/3"

affects:
  - 04-02-api-trigger
  - dashboard
  - squad-automation

# Tech tracking
tech-stack:
  added:
    - "tsx ^4.21.0 — TypeScript execution for worker outside Next.js bundler"
  patterns:
    - "Atomic job claiming via PostgreSQL FOR UPDATE SKIP LOCKED (claim_next_job RPC)"
    - "Supabase Realtime postgres_changes subscription + polling fallback (D-02)"
    - "Circular dependency resolution via callback injection (handleFailure receives tryClaimAndRun)"
    - "Relative imports in worker/ to avoid @/ alias dependency on Next.js bundler"
    - "RFC 4122 v4 UUIDs required in tests (Zod v4 strict UUID validation)"

key-files:
  created:
    - ecosystem.config.js
    - src/worker/index.ts
    - src/worker/job-runner.ts
    - src/worker/heartbeat.ts
    - tests/unit/job-runner.test.ts
    - tests/unit/concurrency.test.ts
    - tests/unit/retry.test.ts
    - tests/db/squad-jobs.test.ts
  modified:
    - package.json

key-decisions:
  - "MAX_CONCURRENT=2 enforced via running job count check before claim (not semaphore)"
  - "handleFailure accepts optional retryCallback to break circular import cycle with index.ts"
  - "Worker validates claimed jobs against squadJobSchema — schema validation requires RFC 4122 v4 UUIDs in tests"
  - "heartbeat.ts stub created in Task 2 to satisfy index.ts import; fully implemented in Task 3"
  - "spawn() used exclusively (not exec) — shell injection impossible for cli_command from DB"

patterns-established:
  - "Worker pattern: Realtime subscription + polling fallback for job discovery"
  - "TDD Wave 0: all test stubs fail RED before implementation, then go GREEN"
  - "Zod v4 strict UUID validation — use RFC 4122 compliant UUIDs in test fixtures"

requirements-completed:
  - SQAD-03
  - SQAD-08

# Metrics
duration: 70min
completed: 2026-04-09
---

# Phase 04 Plan 01: Background Worker Engine Summary

**PostgreSQL-backed job worker: Claude CLI spawn with concurrency guard (MAX_CONCURRENT=2), Realtime subscription, 5-second polling fallback, exponential backoff retry, and 30-minute stuck job recovery via PM2-managed process**

## Performance

- **Duration:** ~70 min
- **Started:** 2026-04-09T03:24:00Z
- **Completed:** 2026-04-09T04:34:33Z
- **Tasks:** 3 (TDD)
- **Files modified:** 9

## Accomplishments
- PM2 ecosystem.config.js with agency-os and job-worker entries using tsx interpreter
- src/worker/job-runner.ts: `isCliError()`, `runJob()`, `handleFailure()` — Claude CLI spawn with stdio: ['ignore','pipe','pipe'], 5-second progress flush, exponential backoff
- src/worker/index.ts: Supabase Realtime subscription on squad_jobs INSERT + 5-second polling fallback, concurrency guard, SIGTERM handler, startup recovery
- src/worker/heartbeat.ts: `recoverStuckJobs()` with 30-minute TIMEOUT_MS, SIGTERM on stuck processes
- Full TDD suite: 17 tests pass (8 unit job-runner, 2 concurrency, 4 retry, 3 integration)
- claim_next_job() atomicity verified: concurrent calls claim exactly 1 job

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — Test stubs + PM2 config + tsx dependency** - `50cab8e` (test)
2. **Task 2: Worker core — main loop, job-runner, concurrency guard (GREEN)** - `85984ca` (feat)
3. **Task 3: Heartbeat + retry + integration tests (GREEN)** - `9cf4310` (feat)

## Files Created/Modified
- `ecosystem.config.js` - PM2 process definitions for agency-os and job-worker
- `src/worker/index.ts` - Main worker loop: Realtime + polling + SIGTERM + startup
- `src/worker/job-runner.ts` - isCliError, runJob (Claude CLI spawn), handleFailure
- `src/worker/heartbeat.ts` - recoverStuckJobs: 30-minute timeout enforcement
- `tests/unit/job-runner.test.ts` - 8 unit tests for spawn behavior and error detection
- `tests/unit/concurrency.test.ts` - 2 unit tests for MAX_CONCURRENT=2 guard
- `tests/unit/retry.test.ts` - 4 unit tests for exponential backoff formula
- `tests/db/squad-jobs.test.ts` - 3 integration tests for claim_next_job() atomicity
- `package.json` - Added tsx devDependency + worker script

## Decisions Made
- Used callback injection pattern (`retryCallback?: () => void`) to break the circular dependency between `job-runner.ts` (handleFailure) and `index.ts` (tryClaimAndRun), avoiding a circular import
- Created heartbeat.ts stub in Task 2 (no-op implementation) to satisfy index.ts import before Task 3 added the real implementation
- Discovered Zod v4 enforces strict RFC 4122 UUID validation (version nibble must be 1-8, variant nibble must be 8/9/a/b) — test fixtures updated to use compliant UUIDs like `550e8400-e29b-41d4-a716-446655440001`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created heartbeat.ts stub in Task 2 to unblock index.ts import**
- **Found during:** Task 2 (concurrency.test.ts failing because index.ts imports heartbeat.ts which didn't exist)
- **Issue:** plan/Task 2 creates index.ts which imports heartbeat.ts, but Task 3 creates heartbeat.ts — circular dependency on file creation order
- **Fix:** Created no-op heartbeat.ts with correct interface in Task 2; replaced with full implementation in Task 3
- **Files modified:** src/worker/heartbeat.ts
- **Verification:** concurrency tests passed with stub; Task 3 replaced stub with real implementation
- **Committed in:** 85984ca (Task 2 commit)

**2. [Rule 1 - Bug] Fixed import paths: worker/ → lib/ requires ../lib/ not ../../lib/**
- **Found during:** Task 2 (first test run showed Cannot find module '../../lib/database/schema')
- **Issue:** Plan examples showed `../../lib/supabase/admin` but src/worker/ is one level deep (src/worker/ → src/lib/ = ../lib/)
- **Fix:** Changed all worker imports from `../../lib/` to `../lib/`
- **Files modified:** src/worker/job-runner.ts, src/worker/index.ts, src/worker/heartbeat.ts
- **Verification:** Tests imported and ran successfully after path correction
- **Committed in:** 85984ca (Task 2 commit)

**3. [Rule 1 - Bug] Fixed UUID format for Zod v4 validation: test fixtures use RFC 4122 v4 UUIDs**
- **Found during:** Task 2 (runJob tests failing — spawn called 0 times because squadJobSchema.safeParse() returned false for UUIDs like 00000000-0000-0000-0000-000000000001)
- **Issue:** Zod v4 has stricter UUID validation than v3 — the version nibble (position 13) must be 1-8, ruling out all-zero test UUIDs
- **Fix:** Updated all test UUIDs to RFC 4122 v4 format (e.g., 550e8400-e29b-41d4-a716-446655440001)
- **Files modified:** tests/unit/job-runner.test.ts, tests/unit/retry.test.ts
- **Verification:** All 12 job-runner + retry tests passed after UUID update
- **Committed in:** 85984ca (Task 2 commit, file updates included)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All auto-fixes required for correct execution. No scope creep. The plan's relative import examples had a path depth error which was corrected. Zod v4's stricter UUID validation was not documented in the plan but is a correctness requirement.

## Issues Encountered
- Zod v4 changed UUID validation from v3 (all-zeros test UUIDs accepted in v3, rejected in v4). The plan was written assuming Zod v3 behavior. Test fixtures updated to use RFC 4122 compliant UUIDs.
- The circular import between index.ts and job-runner.ts (tryClaimAndRun callback) was resolved by passing tryClaimAndRun as an optional callback parameter rather than as a direct import.

## User Setup Required

**External service required for VPS deployment.**

The worker requires `ANTHROPIC_API_KEY` for Claude CLI to authenticate on the VPS (OAuth/keychain not available in headless environments). Set this in the VPS environment or PM2 env block (NOT in ecosystem.config.js committed to git).

Required env vars for production:
- `ANTHROPIC_API_KEY` — Anthropic API key (console.anthropic.com)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

Install PM2 globally on the VPS: `npm install -g pm2`
Start processes: `pm2 start ecosystem.config.js`

## Known Stubs

None — all worker functionality fully implemented. The heartbeat.ts stub created in Task 2 was replaced with the full implementation in Task 3.

## Threat Flags

All threats mitigated per the plan's threat model. No new attack surface introduced beyond what was planned.

| Flag | File | Description |
|------|------|-------------|
| T-04-01 mitigated | src/worker/job-runner.ts | spawn() with array args — no shell, cli_command cannot inject |
| T-04-02 mitigated | src/worker/job-runner.ts | --permission-mode auto (not dangerously-skip-permissions) |
| T-04-03 mitigated | src/worker/index.ts | MAX_CONCURRENT=2 guard + SIGTERM handler + activeJobs Map |
| T-04-04 mitigated | src/worker/heartbeat.ts | 30-minute TIMEOUT_MS, SIGTERM on stuck processes, 5-min heartbeat |
| T-04-05 mitigated | ecosystem.config.js | No secrets in committed config; env vars set on VPS |

## Next Phase Readiness
- Worker engine is ready for Phase 04 Plan 02 (API trigger endpoints that enqueue squad jobs)
- claim_next_job() atomicity verified via integration tests — safe for concurrent workers
- The worker is fully testable: unit tests mock child_process; integration tests use real Supabase
- PM2 config is production-ready; requires ANTHROPIC_API_KEY on VPS before first deployment

---
*Phase: 04-cli-orchestrator-job-queue*
*Completed: 2026-04-09*
