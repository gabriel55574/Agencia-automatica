---
phase: 4
slug: cli-orchestrator-job-queue
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.3 |
| **Config file** | `vitest.config.ts` (exists) |
| **Quick run command** | `npx vitest run tests/unit/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/unit/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | SQAD-03 | — | Wave 0 stub stubs only — no implementation | unit | `npx vitest run tests/unit/job-runner.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 0 | SQAD-08 | — | Wave 0 stub | unit | `npx vitest run tests/unit/concurrency.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 0 | SQAD-08 | — | Wave 0 stub | unit | `npx vitest run tests/unit/retry.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 0 | SQAD-03 | — | Wave 0 integration stub | integration | `npx vitest run tests/db/squad-jobs.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | SQAD-03 | T-04-01 | `claim_next_job()` atomically transitions one job to running | integration | `npx vitest run tests/db/squad-jobs.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-06 | 01 | 1 | SQAD-03 | T-04-02 | CLI spawn: is_error=false, exit 0 for valid prompt | unit | `npx vitest run tests/unit/job-runner.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-07 | 01 | 1 | SQAD-03 | T-04-02 | CLI error: is_error=true in JSON → job marked failed | unit | `npx vitest run tests/unit/job-runner.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | SQAD-08 | T-04-03 | Concurrency guard: 2 running jobs → tryClaimAndRun() returns without claiming | unit | `npx vitest run tests/unit/concurrency.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | SQAD-08 | T-04-04 | Retry: failed job increments attempts, re-queues with backoff delay | unit | `npx vitest run tests/unit/retry.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/job-runner.test.ts` — stubs for SQAD-03 (spawn logic, JSON parse, error detection)
- [ ] `tests/unit/concurrency.test.ts` — stubs for SQAD-08 (concurrency guard)
- [ ] `tests/unit/retry.test.ts` — stubs for SQAD-08 (exponential backoff)
- [ ] `tests/db/squad-jobs.test.ts` — integration stubs for claim_next_job() atomicity

*(Reuse existing `tests/setup.ts`, `tests/db/` infrastructure, `cleanTestData()` and `testClient`)*
