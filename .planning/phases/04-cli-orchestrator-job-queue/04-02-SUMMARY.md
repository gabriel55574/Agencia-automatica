---
phase: 04-cli-orchestrator-job-queue
plan: 02
subsystem: frontend
tags: [realtime, supabase-realtime, postgres_changes, modal, status-badges, process-row, job-progress]

# Dependency graph
requires:
  - phase: 04-cli-orchestrator-job-queue
    plan: 01
    provides: "squad_jobs table, worker engine, progress_log updates every 5s"
  - phase: 03-pipeline-engine
    plan: 02
    provides: "PipelineAccordion, ProcessRow (accordion), pipeline-phase.tsx, /clients/[id] page"

provides:
  - "ProcessRow (new): amber badge for running jobs + View button + red badge for failed jobs"
  - "ProcessAccordionRow: renamed from ProcessRow to preserve existing accordion behavior"
  - "JobProgressModal: Realtime-subscribed modal displaying progress_log, output, error_log"
  - "ProcessJobsSection: client boundary that owns selectedJobId state and renders ProcessRow list + modal"
  - "/clients/[id] page: server-side job fetch per process + ProcessJobsSection wiring"

affects:
  - dashboard
  - squad-automation
  - 04-03

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase Realtime postgres_changes subscription in useEffect with cleanup via removeChannel"
    - "Zod safeParse on Realtime payload before setJob() — prevents state corruption from malformed events (T-04-10)"
    - "Server Component fetches initial job state; client component subscribes for live updates"
    - "ProcessAccordionRow pattern: rename existing component to avoid interface collision with new ProcessRow"
    - "ProcessJobsSection as client boundary: Server Component page passes serialized Map as plain object prop"

key-files:
  created:
    - src/components/clients/job-progress-modal.tsx
    - src/components/clients/process-jobs-section.tsx
  modified:
    - src/components/clients/process-row.tsx
    - src/components/clients/pipeline-phase.tsx
    - src/app/(dashboard)/clients/[id]/page.tsx

key-decisions:
  - "Renamed existing ProcessRow to ProcessAccordionRow to avoid interface collision — new ProcessRow has { process, activeJob, onViewProgress } signature required by plan"
  - "Created ProcessJobsSection as separate client boundary file — avoids 'use client' in Server Component page while keeping clean state isolation"
  - "Server Component page fetches initial job state, passes as initialJobsByProcessId to client component for SSR correctness"
  - "safeParse(payload.new) in Realtime handler — rejects malformed payloads before calling setJob() (T-04-10 mitigated)"
  - "Pre-existing TypeScript error in src/worker/index.ts (claim_next_job RPC not in generated types from Plan 01) — not introduced by this plan"

requirements-completed:
  - SQAD-03
  - SQAD-08

# Metrics
duration: 30min
completed: 2026-04-09
---

# Phase 04 Plan 02: Frontend Progress Visibility Summary

**Process status badges (running/failed) and Realtime progress modal wired into /clients/[id]: operators see live squad job progress without leaving the client profile page**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-09T04:44:45Z
- **Completed:** 2026-04-09T05:15:00Z
- **Tasks:** 2 executed + 1 auto-approved checkpoint
- **Files modified:** 5

## Accomplishments

- `ProcessRow`: Client Component with amber [running] badge + "View ►" button (D-04), red [failed] badge (D-07), green [completed] badge; pure display with no Supabase import
- `ProcessAccordionRow`: Renamed from previous `ProcessRow` (accordion-inside-pipeline version) to avoid interface collision; `pipeline-phase.tsx` updated to import renamed component
- `JobProgressModal`: Realtime subscription via `postgres_changes` UPDATE on `squad_jobs` filtered by `id`; validates payload with `squadJobSchema.safeParse()` before `setJob()` (T-04-10); `removeChannel()` cleanup on unmount
- `ProcessJobsSection`: Client boundary component managing `selectedJobId` state, renders process list and opens modal on View click
- `/clients/[id]` page: server-side fetch of most recent squad_job per process using `.in('process_id', processIds).order('created_at')`, serializes to plain object for client prop

## Task Commits

1. **Task 1: ProcessRow with job status badges** — `2ed9a35` (feat)
2. **Task 2: JobProgressModal + ProcessJobsSection + page wiring** — `c350922` (feat)
3. **Task 3: Human verification checkpoint** — auto-approved (auto_advance=true)

## Files Created/Modified

- `src/components/clients/process-row.tsx` — Added ProcessRow (new) + ProcessAccordionRow (renamed from old ProcessRow)
- `src/components/clients/pipeline-phase.tsx` — Updated import to use ProcessAccordionRow
- `src/components/clients/job-progress-modal.tsx` — New: Realtime-subscribed progress modal
- `src/components/clients/process-jobs-section.tsx` — New: Client boundary with selectedJobId state
- `src/app/(dashboard)/clients/[id]/page.tsx` — Added job fetch + ProcessJobsSection rendering

## Decisions Made

- Named the new job-status process row `ProcessRow` (per plan spec) and renamed the existing accordion component to `ProcessAccordionRow` to preserve pipeline-accordion behavior without breaking changes to `pipeline-phase.tsx`
- Created `ProcessJobsSection` as a separate file (not an inline 'use client' section in page.tsx) — cleaner separation, easier to test, and avoids React Server Component boundary issues
- Server fetches initial job state at render time; client subscribes to live updates — this gives SSR-correct initial render with no flash of empty state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed existing ProcessRow to ProcessAccordionRow to prevent interface collision**
- **Found during:** Task 1 (existing `process-row.tsx` exported `ProcessRow` with `{ process, definition }` signature; plan requires `ProcessRow` with `{ process, activeJob, onViewProgress }` signature)
- **Issue:** Cannot have two exports named `ProcessRow` with incompatible interfaces from the same file
- **Fix:** Renamed existing accordion component to `ProcessAccordionRow`, updated `pipeline-phase.tsx` import accordingly; new `ProcessRow` added with plan-specified interface
- **Files modified:** `src/components/clients/process-row.tsx`, `src/components/clients/pipeline-phase.tsx`
- **Commit:** 2ed9a35

**2. [Rule 3 - Blocking] Created ProcessJobsSection as client boundary for state management**
- **Found during:** Task 2 (page.tsx is a Server Component — cannot hold `useState` for `selectedJobId`)
- **Issue:** Plan says to add state management to the page, but RSC pages cannot have `useState`
- **Fix:** Created `src/components/clients/process-jobs-section.tsx` as a dedicated client boundary; page imports and renders it with server-fetched initial data
- **Files modified:** `src/components/clients/process-jobs-section.tsx` (created), `src/app/(dashboard)/clients/[id]/page.tsx`
- **Commit:** c350922

**3. [Rule 3 - Blocking] Worktree soft-reset caused file loss + restoration**
- **Found during:** Branch setup (worktree branched from 8fe892e, soft-reset to 3a479a8 moved HEAD but working tree lacked Phase 4 Plan 01 files)
- **Issue:** `git reset --soft` moved the branch pointer but the working tree still reflected 8fe892e; committing deleted all Phase 4 Plan 01 files (.agent/, worker/, etc.)
- **Fix:** `git checkout 3a479a8 -- src/worker/ ecosystem.config.js tests/ .agent/ .planning/phases/04.../04-01-SUMMARY.md` restored all deleted files in a follow-up commit (ed65d2b)
- **Commits:** 2ed9a35 (accidental deletion), ed65d2b (restoration)

**Total deviations:** 3 auto-fixed
**Impact on plan:** All auto-fixes were required for correct execution. No scope creep. ProcessJobsSection is an architectural necessity (RSC constraint), not a design change.

## Known Stubs

None — all data is live:
- `initialJobsByProcessId` is fetched server-side from Supabase at render time
- Realtime subscription updates job state as the worker flushes progress every 5s
- The Outputs section placeholder (`"Outputs will appear here..."`) was pre-existing from Phase 3 Plan 02 (planned for Phase 7)

## Threat Flags

All threats handled per plan's threat model:

| Status | Threat | File | Description |
|--------|--------|------|-------------|
| T-04-10 mitigated | Tampering | src/components/clients/job-progress-modal.tsx | `squadJobSchema.safeParse(payload.new)` validates Realtime payload before setJob(); malformed payloads logged and ignored |
| T-04-09 accepted | Info Disclosure | src/components/clients/job-progress-modal.tsx | Solo operator context; Supabase Realtime anon key + RLS prevents cross-client subscription |
| T-04-11 accepted | DoS | src/components/clients/job-progress-modal.tsx | Single modal at a time; removeChannel() cleanup prevents subscription leak |

## Self-Check

---
## Self-Check: PASSED

Files created:
- [x] src/components/clients/job-progress-modal.tsx — FOUND
- [x] src/components/clients/process-jobs-section.tsx — FOUND
- [x] .planning/phases/04-cli-orchestrator-job-queue/04-02-SUMMARY.md — FOUND (this file)

Files modified:
- [x] src/components/clients/process-row.tsx — FOUND (ProcessRow + ProcessAccordionRow)
- [x] src/components/clients/pipeline-phase.tsx — FOUND (imports ProcessAccordionRow)
- [x] src/app/(dashboard)/clients/[id]/page.tsx — FOUND (ProcessJobsSection import)

Commits:
- [x] 2ed9a35 — feat(04-02): ProcessRow with job status badges
- [x] ed65d2b — chore(04-02): restore worker files
- [x] c350922 — feat(04-02): JobProgressModal + ProcessJobsSection
