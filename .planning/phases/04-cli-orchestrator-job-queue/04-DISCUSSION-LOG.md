# Phase 4: CLI Orchestrator & Job Queue — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 04-cli-orchestrator-job-queue
**Areas discussed:** Worker architecture, Progress streaming, Failure handling & retry, Timeout threshold

---

## Worker Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Separate PM2 process | Standalone `src/worker/index.ts` managed by PM2 alongside Next.js. Clean separation, independent restarts. | ✓ |
| Next.js instrumentation.ts | Start worker loop inside Next.js server startup. Single process, but tightly coupled. | |

**User's choice:** Separate PM2 process

---

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Realtime + 5s interval fallback | Subscribe to squad_jobs INSERTs for immediate pickup; poll every 5s as safety net | ✓ |
| Interval polling only | Poll `claim_next_job()` every 2-3 seconds. Simpler, tiny delay. | |

**User's choice:** Supabase Realtime + interval fallback

---

## Progress Streaming

| Option | Description | Selected |
|--------|-------------|----------|
| Batch every 5 seconds | Flush accumulated stdout buffer to progress_log every 5s. Good visibility, fewer writes. | ✓ |
| Every line (real-time) | Each stdout line written to DB immediately. Max visibility, more frequent writes. | |
| Completion only | Full stdout stored only when CLI exits. Simpler, no live progress. | |

**User's choice:** Batch every 5 seconds

---

| Option | Description | Selected |
|--------|-------------|----------|
| Modal/drawer on process row | "View ►" button on running process row opens progress modal. Profile page stays clean. | ✓ |
| Defer to Phase 5 | Phase 4 is infrastructure only; Phase 5 decides where to show progress. | |

**User's choice:** Modal/drawer on process row

---

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Realtime subscription | Modal subscribes to squad_jobs row changes for live updates. No polling needed. | ✓ |
| React Query polling every 3s | Frontend polls squad_jobs row every 3 seconds. Simpler with minor lag. | |

**User's choice:** Supabase Realtime subscription

---

## Failure Handling & Retry

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-retry up to 3x | Retry on failure up to max_attempts (default 3) with exponential backoff. Mark failed after exhaustion. | ✓ |
| No auto-retry (manual only) | Mark failed immediately on error. Operator re-triggers via Phase 5 UI. | |

**User's choice:** Auto-retry up to 3x with exponential backoff

---

| Option | Description | Selected |
|--------|-------------|----------|
| Badge on process row | Failed badge on process row in client profile. No push notification in Phase 4. | ✓ |
| Status badge + dashboard alert | Badge on profile AND Phase 8 dashboard surfaces it. No extra Phase 4 work. | |

**User's choice:** Badge on process row (notifications deferred to v2)

---

## Timeout Threshold

| Option | Description | Selected |
|--------|-------------|----------|
| 30 minutes per job | Kill and mark failed if running >30 min. Realistic for Claude Code sessions (2-15 min typical). | ✓ |
| 60 minutes per job | More generous for very large squad sessions. Slower stuck-job recovery. | |
| Configurable via env var | JOB_TIMEOUT_MS with 30m default. Flexible but adds config overhead. | |

**User's choice:** 30 minutes hardcoded

---

| Option | Description | Selected |
|--------|-------------|----------|
| Worker heartbeat check on startup | Query for stuck jobs every 5 min. Survives worker restarts — recovers orphaned jobs. | ✓ |
| Per-job setTimeout in worker | setTimeout per job at claim time. Lost if worker crashes mid-job. | |

**User's choice:** Worker heartbeat check on startup (every 5 min)

---

## Claude's Discretion

- Exact concurrency limit (2 or 3 simultaneous sessions — both within SQAD-08)
- Backoff formula adjustments within order of magnitude
- Internal worker loop implementation (async loop vs. event-driven)
- How concurrency cap is enforced in the worker (counter check vs. semaphore)

## Deferred Ideas

- Configurable timeout via env var — hardcode 30m is sufficient for v1
- Email notifications for failed jobs (NOTF-02) — v2
- Per-process timeout estimates
- Dashboard view for failed jobs — Phase 8
