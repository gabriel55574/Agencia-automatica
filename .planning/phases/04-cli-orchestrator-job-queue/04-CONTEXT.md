---
phase: 04-cli-orchestrator-job-queue
created: 2026-04-09
status: ready-for-planning
---

# Phase 4: CLI Orchestrator & Job Queue — Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the background worker infrastructure that queues, spawns, monitors, and manages
Claude Code CLI child processes with concurrency control. This is pure backend infrastructure —
no squad trigger UI (Phase 5), no dashboard views (Phase 8), no output parsing (Phase 5).

The deliverable is a reliable engine: jobs go in the queue, CLI sessions run one at a time
(up to the concurrency limit), progress is captured, failures are retried, stuck jobs are
recovered automatically.

</domain>

<decisions>
## Implementation Decisions

### Worker Architecture

- **D-01:** Worker runs as a **separate PM2-managed Node.js process** alongside the Next.js app
  on the VPS. Not integrated into the Next.js process. Script: `src/worker/index.ts`.
  PM2 `ecosystem.config.js` defines two processes: `agency-os` (Next.js) and `job-worker`.
  Worker has `autorestart: true` — PM2 handles crash recovery.

- **D-02:** Job discovery uses **Supabase Realtime + 5-second interval fallback**.
  Worker subscribes to `squad_jobs` INSERT events (`status=eq.queued`) for immediate pickup.
  A `setInterval` polling `claim_next_job()` every 5 seconds acts as a safety net for
  dropped Realtime connections or jobs enqueued while subscription was down.

### Progress Streaming

- **D-03:** CLI stdout is **batched and flushed to `squad_jobs.progress_log` every 5 seconds**.
  Worker accumulates stdout chunks in a buffer; flushes on 5-second interval (or on process exit).
  Provides good visibility without per-line DB writes.

- **D-04:** Progress is displayed in a **modal/drawer triggered from the process row** on the
  client profile page (`/clients/[id]`). Process row shows `[running]` status badge with a
  "View ►" button. Modal shows the live progress log.

- **D-05:** The progress modal uses a **Supabase Realtime subscription** on the `squad_jobs` row
  to receive live log updates. No frontend polling needed.

### Failure Handling & Retry

- **D-06:** On CLI process failure (non-zero exit code or exception), the worker **auto-retries
  up to `max_attempts` times** (default: 3). Each retry increments `job.attempts` and re-queues
  with exponential backoff: `delay = 2^attempts × 30_000ms` (30s, 60s, 120s).
  After exhausting `max_attempts`, job is marked `status='failed'`.

- **D-07:** Permanently failed jobs (max retries exhausted) are surfaced via a **`failed` status
  badge on the process row** of the client profile. No push notifications in Phase 4.
  Email notifications deferred to v2 (NOTF-02 in requirements).

### Timeout Handling

- **D-08:** Job timeout threshold is **30 minutes**. If a job is in `status='running'` for more
  than 30 minutes, the worker kills the process and marks it failed (eligible for retry via D-06).

- **D-09:** Timeout detection uses **worker startup + periodic heartbeat check** (every 5 minutes).
  On each check, the worker queries for jobs stuck in `running` with `started_at < NOW() - 30min`,
  kills them, and marks them failed. This handles the case where the worker itself crashed
  mid-job — stuck jobs are recovered on the next worker restart.

### Claude's Discretion

- Exact concurrency limit (2-3 simultaneous sessions per SQAD-08) — planner may choose 2 or 3;
  both are within the stated requirement.
- Exponential backoff base formula adjustments within order of magnitude.
- How `claim_next_job()` is called with the concurrency cap (e.g., check running job count
  before claiming, or use a semaphore in the worker).
- Internal worker loop implementation details (async loop vs. event-driven).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema & Infrastructure
- `supabase/migrations/00001_initial_schema.sql` — Full schema including `squad_jobs` table:
  `status IN ('queued','running','completed','failed','cancelled')`, `cli_command`, `progress_log`,
  `output`, `error_log`, `attempts`, `max_attempts`, `started_at`, `completed_at`
- `supabase/migrations/00002_phase_enforcement.sql` — `claim_next_job()` function already exists:
  uses `FOR UPDATE SKIP LOCKED`. Worker calls this to atomically claim a job. Do not rewrite it.

### Domain Types & Enums
- `src/lib/database/enums.ts` — `JOB_STATUSES`, `SQUAD_TYPES` — use these constants
- `src/lib/database/schema.ts` — `squadJobSchema`, `SquadJob` type — validate job rows against this

### Project Context
- `.planning/phases/03-pipeline-engine/03-CONTEXT.md` — Phase 3 decisions (process rows,
  gate flow, race condition protection already in DB)
- `.planning/REQUIREMENTS.md` — SQAD-03, SQAD-08 (requirements this phase covers)
- `CLAUDE.md` — Stack decisions (VPS deployment, PostgreSQL queue over BullMQ, CLI over API)

### Claude Code CLI
- No verified documentation URL available — researcher must verify CLI flags (`--print`,
  `--output-format json`, `--system-prompt`) against live CLI before planning.
  STATE.md flags this as MEDIUM confidence: "Claude Code CLI flags need live verification before Phase 4."

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `claim_next_job()` PostgreSQL RPC (migration 00002): already exists, handles atomic job claiming.
  Worker calls `supabase.rpc('claim_next_job')` — no new DB function needed for claiming.
- `squadJobSchema` / `SquadJob` type (src/lib/database/schema.ts): validates and types job rows.
- `JOB_STATUSES` enum (src/lib/database/enums.ts): `queued | running | completed | failed | cancelled`.

### Established Patterns
- Server Actions for DB mutations (Phase 2 pattern) — worker does NOT use Server Actions;
  it uses the Supabase admin client directly (bypasses RLS, runs server-side).
- Supabase admin client setup already implied by Phase 1 scaffold.
- TypeScript + Zod for all data validation — worker should follow same pattern.

### Integration Points
- Worker reads from `squad_jobs` (polls + Realtime) and writes status updates back to same table.
- Worker spawns `child_process.spawn('claude', [args])` — stdout piped to progress buffer.
- Frontend (Phase 5) will write `squad_jobs` INSERT rows to trigger work; Phase 4 consumes them.
- Progress modal (Phase 4 UI work) attaches to `squad_jobs` row via Supabase Realtime —
  connects to the existing Supabase Realtime infrastructure from Phase 1.

</code_context>

<specifics>
## Specific Ideas

- PM2 `ecosystem.config.js` should live at project root — both `agency-os` and `job-worker`
  processes defined there for easy `pm2 start ecosystem.config.js`.
- Progress modal triggered from process row on `/clients/[id]` — extends Phase 3's accordion
  process row to include a "View ►" button when `process.status === 'running'`.
- Heartbeat check interval: every 5 minutes on a `setInterval` inside the worker.
  Timeout threshold: 30 minutes hardcoded for Phase 4 (not configurable via env var — simplicity wins).

</specifics>

<deferred>
## Deferred Ideas

- Configurable timeout via `JOB_TIMEOUT_MS` env var — deferred; 30-minute hardcode is sufficient for v1.
- Email notifications for failed jobs (NOTF-02) — v2 requirement, explicitly deferred.
- Per-process timeout estimates (some processes run longer than others) — deferred to later iteration.
- Dashboard view for failed jobs — Phase 8 will surface `status='failed'` jobs from the DB.

</deferred>

---

*Phase: 04-cli-orchestrator-job-queue*
*Context gathered: 2026-04-09*
