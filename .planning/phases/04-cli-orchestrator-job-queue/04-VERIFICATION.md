---
phase: 04-cli-orchestrator-job-queue
verified: 2026-04-09T05:00:00Z
status: gaps_found
score: 10/12 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Worker process starts via `tsx src/worker/index.ts` (package.json worker script present)"
    status: failed
    reason: "tsx was added in commit 50cab8e (Task 1) but accidentally removed in commit 2ed9a35 (Plan 04-02 Task 1 soft-reset). The `worker` script and tsx devDependency are both absent from the current package.json. The restore commit ed65d2b only recovered src/worker/ files, not package.json."
    artifacts:
      - path: "package.json"
        issue: "Missing tsx in devDependencies and missing 'worker': 'tsx src/worker/index.ts' in scripts"
    missing:
      - "Re-add tsx ^4.21.0 to devDependencies"
      - "Re-add worker script: 'tsx src/worker/index.ts' to scripts section"
      - "Run npm install to install tsx binary so ecosystem.config.js interpreter: 'node_modules/.bin/tsx' works"
  - truth: "Process rows show ProcessRow + JobProgressModal directly imported in /clients/[id] page.tsx (plan key_link acceptance criteria)"
    status: partial
    reason: "page.tsx imports ProcessJobsSection (the client boundary component) which in turn imports both ProcessRow and JobProgressModal. The behavior is fully wired and functional, but the plan's acceptance criteria explicitly checks for 'import.*ProcessRow' and 'import.*JobProgressModal' in page.tsx directly, which are not present. This is an intentional architectural deviation (ProcessJobsSection as RSC boundary) documented in the SUMMARY."
    artifacts:
      - path: "src/app/(dashboard)/clients/[id]/page.tsx"
        issue: "Imports ProcessJobsSection instead of ProcessRow and JobProgressModal directly. ProcessJobsSection (process-jobs-section.tsx) correctly wraps both components with client boundary state management."
    missing:
      - "No code fix required — functional behavior is correct. Consider adding override if the indirect import via ProcessJobsSection is the accepted pattern."
human_verification:
  - test: "Start worker and insert test job to verify end-to-end flow"
    expected: "npx tsx src/worker/index.ts starts (once tsx is reinstalled), subscribes to squad_jobs Realtime channel, picks up a queued job within 5 seconds, and transitions it to running. Opening /clients/[id] shows amber [running] badge. Clicking 'View' opens modal with live progress_log."
    why_human: "Cannot run child process in verification context. Requires tsx binary installed (currently missing), live Supabase connection, and a running Next.js dev server."
  - test: "Concurrency guard: insert 3 queued jobs simultaneously"
    expected: "Only 2 jobs transition to running; the third remains queued until a slot opens."
    why_human: "Requires live worker process with real Supabase backend."
---

# Phase 4: CLI Orchestrator & Job Queue — Verification Report

**Phase Goal:** A reliable infrastructure layer that queues, spawns, monitors, and manages Claude Code CLI processes with concurrency control — the engine that powers all squad automation

**Verified:** 2026-04-09T05:00:00Z
**Status:** GAPS FOUND
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Worker process starts via `tsx src/worker/index.ts` and subscribes to squad_jobs Realtime channel | PARTIAL | src/worker/index.ts exists and implements Realtime subscription correctly, but tsx is missing from package.json devDependencies and the `worker` script was deleted by commit 2ed9a35 |
| 2 | When a queued job exists and concurrency slot available, claim_next_job() is called and Claude CLI spawns | VERIFIED | src/worker/index.ts implements tryClaimAndRun() with COUNT check + rpc('claim_next_job') + runJob(). Concurrency tests GREEN |
| 3 | stdout accumulated in-memory and flushed to squad_jobs.progress_log every 5 seconds | VERIFIED | job-runner.ts: setInterval(async () => supabase.from('squad_jobs').update({ progress_log: stdoutBuffer }), 5_000) confirmed |
| 4 | On CLI exit code 0 with is_error=false, job status becomes completed | VERIFIED | job-runner.ts runJob() close handler: success = exitCode === 0 && !isCliError(). Updates status='completed', output, progress_log, completed_at. Tests GREEN |
| 5 | On failure with attempts < max_attempts, job re-queues with exponential backoff | VERIFIED | handleFailure() sets status='queued' + setTimeout(retryCallback, 2^newAttempts * 30_000). Tests confirm 60s/120s delays. Tests GREEN |
| 6 | On failure with attempts >= max_attempts, job status becomes failed | VERIFIED | handleFailure() condition: if (newAttempts >= max_attempts) → status='failed'. Tests GREEN |
| 7 | On worker startup and every 5 minutes, jobs stuck in running > 30 min are killed and marked failed | VERIFIED | heartbeat.ts exports TIMEOUT_MS=1800000, recoverStuckJobs() queries lt('started_at', cutoff), kills via SIGTERM. index.ts calls recoverStuckJobs on startup + setInterval(5*60_000) |
| 8 | No more than 2 CLI sessions run simultaneously (SQAD-08) | VERIFIED | MAX_CONCURRENT=2 enforced in tryClaimAndRun() before every claim. Concurrency tests GREEN |
| 9 | Process rows on /clients/[id] show [running] badge when squad_job status='running' | VERIFIED | ProcessRow component renders amber badge for running status. Wired via ProcessJobsSection in page.tsx |
| 10 | Process rows show [failed] badge when status='failed' (D-07) | VERIFIED | ProcessRow renders red badge for failed status. Confirmed in process-row.tsx line 138-140 |
| 11 | Running process rows show 'View ►' button that opens progress modal (D-04) | VERIFIED | ProcessRow renders Button with onClick={() => onViewProgress(activeJob.id)}. ProcessJobsSection wires onViewProgress to setSelectedJobId |
| 12 | Progress modal displays live progress_log via Supabase Realtime (D-05) | VERIFIED | JobProgressModal subscribes to postgres_changes UPDATE on squad_jobs filtered by id. Renders progress_log in pre block. cleanup via removeChannel() |

**Score: 10/12 truths verified** (1 partial/failed, 1 human-needed)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `ecosystem.config.js` | PM2 process definitions for agency-os and job-worker | VERIFIED | Contains both entries. job-worker uses interpreter: 'node_modules/.bin/tsx' and script: 'src/worker/index.ts' |
| `src/worker/index.ts` | Realtime subscription + polling loop + SIGTERM handler | VERIFIED | 149 lines. Implements all 5 documented behaviors: Realtime, polling, concurrency guard, heartbeat, SIGTERM |
| `src/worker/job-runner.ts` | Claude CLI spawn, stdout buffering, flush interval, exit handling | VERIFIED | Exports isCliError, runJob, handleFailure. spawn() with stdio: ['ignore','pipe','pipe'] confirmed |
| `src/worker/heartbeat.ts` | Stuck job detection and recovery | VERIFIED | Exports TIMEOUT_MS=1800000 and recoverStuckJobs(). SIGTERM on stuck processes confirmed |
| `tests/unit/job-runner.test.ts` | Unit tests for spawn logic, JSON parse, error detection | VERIFIED | 8 tests, all GREEN. Covers isCliError (5 cases) + runJob (3 cases) |
| `tests/unit/concurrency.test.ts` | Unit tests for concurrency guard (MAX_CONCURRENT=2) | VERIFIED | 2 tests, all GREEN. Tests tryClaimAndRun at/below limit |
| `tests/unit/retry.test.ts` | Unit tests for exponential backoff | VERIFIED | 4 tests, all GREEN. Covers re-queue, permanent fail, backoff delays |
| `tests/db/squad-jobs.test.ts` | Integration test for claim_next_job() atomicity | VERIFIED | 3 integration tests. Part of full suite (39 tests total, all passing) |
| `src/components/clients/process-row.tsx` | ProcessRow with status badges and View button | VERIFIED | Exports ProcessRow (Phase 4) and ProcessAccordionRow (Phase 3 renamed). Contains 'use client', bg-amber-100, bg-red-100, onViewProgress |
| `src/components/clients/job-progress-modal.tsx` | Modal with Realtime-subscribed progress_log display | VERIFIED | Exports JobProgressModal. Contains postgres_changes, progress_log, removeChannel, bg-zinc-950 |
| `src/components/clients/process-jobs-section.tsx` | Client boundary managing selectedJobId state | VERIFIED | New component created to satisfy RSC constraint. Renders ProcessRow list + JobProgressModal |
| `package.json` | tsx in devDependencies + worker script | FAILED | tsx and worker script were added in commit 50cab8e but accidentally removed in commit 2ed9a35 (04-02 Task 1 soft-reset issue). Current package.json lacks both |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| src/worker/index.ts | supabase.rpc('claim_next_job') | tryClaimAndRun() on Realtime INSERT or 5-sec interval | WIRED | grep confirms: `(supabase as any).rpc('claim_next_job')` in tryClaimAndRun(). Called from Realtime callback and setInterval |
| src/worker/job-runner.ts | squad_jobs.progress_log | supabase.from('squad_jobs').update every 5 seconds | WIRED | grep confirms: setInterval flushes stdoutBuffer to progress_log |
| src/worker/heartbeat.ts | squad_jobs (running, started_at < cutoff) | recoverStuckJobs() on startup + setInterval(5 min) | WIRED | index.ts wires recoverStuckJobs on startup and in setInterval(5 * 60_000) |
| src/components/clients/process-row.tsx | src/components/clients/job-progress-modal.tsx | onClick on 'View' button → ProcessJobsSection state | WIRED | ProcessRow calls onViewProgress(jobId); ProcessJobsSection sets selectedJobId; JobProgressModal receives jobId |
| src/components/clients/job-progress-modal.tsx | squad_jobs.progress_log | supabase.channel().on('postgres_changes', UPDATE) | WIRED | Confirmed: postgres_changes subscription with filter `id=eq.${jobId}` renders payload.new as SquadJob |
| src/app/(dashboard)/clients/[id]/page.tsx | ProcessRow + JobProgressModal | via ProcessJobsSection (indirect) | PARTIAL | Page imports ProcessJobsSection which uses both. Plan acceptance criteria expects direct imports in page.tsx — architectural deviation accepted in SUMMARY |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| process-row.tsx | activeJob | Passed via ProcessJobsSection from server-fetched jobsByProcessId | Yes — page.tsx queries squad_jobs.select('id, status, process_id').in('process_id', processIds) | FLOWING |
| job-progress-modal.tsx | job (state) | Initial: supabase.from('squad_jobs').select('*').eq('id', jobId).single(); Live: postgres_changes subscription | Yes — initial fetch + Realtime delta | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit tests pass | npx vitest run tests/unit/ | 39 tests pass (3 files) | PASS |
| TypeScript compiles clean | npx tsc --noEmit | Exit 0 (no output) | PASS |
| No @/ aliases in worker | grep -r "@/" src/worker/ | Only in comment lines (not actual imports) | PASS |
| SIGTERM handler registered | grep "SIGTERM" src/worker/index.ts | process.on('SIGTERM', ...) found | PASS |
| setInterval count >= 2 | grep -c "setInterval" src/worker/index.ts | 2 (polling + heartbeat) | PASS |
| claim_next_job present | grep "claim_next_job" src/worker/index.ts | rpc('claim_next_job') found | PASS |
| stdio ignore pattern | grep "stdio.*ignore" src/worker/job-runner.ts | stdio: ['ignore', 'pipe', 'pipe'] confirmed | PASS |
| job-worker in PM2 config | grep "job-worker" ecosystem.config.js | name: 'job-worker' confirmed | PASS |
| interpreter in PM2 config | grep "interpreter" ecosystem.config.js | interpreter: 'node_modules/.bin/tsx' confirmed | PASS |
| tsx in package.json | node -e check | tsx NOT in devDependencies; worker script MISSING | FAIL |
| tsx binary available | ls node_modules/.bin/tsx | Binary not found | FAIL |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| SQAD-03 | 04-01, 04-02 | PostgreSQL-backed job queue with CLI child processes | SATISFIED | claim_next_job() RPC used atomically; spawn() in job-runner.ts; integration tests confirm atomicity |
| SQAD-08 | 04-01, 04-02 | Concurrency enforcement (max 2-3 simultaneous CLI sessions) | SATISFIED | MAX_CONCURRENT=2 check before every claim; concurrency tests confirm guard works |

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| package.json | tsx missing from devDependencies, worker script absent | Blocker | `npm install` will not install tsx; `node_modules/.bin/tsx` binary absent; ecosystem.config.js interpreter will fail at PM2 startup; developer cannot run `npm run worker` |

---

## Human Verification Required

### 1. End-to-End Worker Flow

**Test:** Once tsx is reinstalled (see gaps), start the worker with `npx tsx src/worker/index.ts`. Insert a test squad_job with status='queued' via Supabase dashboard. Verify within 5 seconds the job transitions to status='running' in the squad_jobs table.

**Expected:** Worker logs startup message, claims the job, job status changes to 'running'. Opening `/clients/<client-id>` shows amber [running] badge on the relevant process row. Clicking 'View' opens the progress modal with live progress_log updates every ~5 seconds.

**Why human:** Cannot spawn child processes in verification context. Requires tsx binary (currently missing), live Supabase connection, and a running browser session.

### 2. Concurrency Guard Under Load

**Test:** Insert 3 queued jobs simultaneously for the same or different clients. Observe worker behavior over 10-15 seconds.

**Expected:** Only 2 jobs transition to status='running' at once. The third remains 'queued'. When one running job completes, the third job is claimed.

**Why human:** Requires live worker with real Supabase backend and timing-sensitive observation.

---

## Gaps Summary

**1 blocker gap, 1 architectural deviation:**

**Blocker — tsx removed from package.json:** The `tsx` devDependency and `worker` npm script were added in commit `50cab8e` (Plan 04-01 Task 1) but accidentally deleted in commit `2ed9a35` (Plan 04-02 Task 1) as a side effect of the worktree soft-reset incident described in the 04-02 SUMMARY. The restoration commit `ed65d2b` recovered all source files (`src/worker/`, `ecosystem.config.js`, etc.) but did NOT restore package.json. As a result:

- `tsx` is not in `devDependencies` — `npm install` does not install it
- `node_modules/.bin/tsx` does not exist — PM2's `interpreter: 'node_modules/.bin/tsx'` will fail
- `npm run worker` does not exist as a script

The fix is a one-line addition: run `npm install --save-dev tsx` and add `"worker": "tsx src/worker/index.ts"` to scripts.

**Architectural deviation — ProcessRow/JobProgressModal not directly imported in page.tsx:** The plan's acceptance criteria expected `import.*ProcessRow` and `import.*JobProgressModal` in page.tsx. Instead, the implementation uses `ProcessJobsSection` as a client boundary (an intentional architectural improvement to satisfy the RSC constraint). This is documented in the SUMMARY as a deviation and the behavior is fully correct. No code change is required — an override can be added if desired.

---

_Verified: 2026-04-09T05:00:00Z_
_Verifier: Claude (gsd-verifier)_
