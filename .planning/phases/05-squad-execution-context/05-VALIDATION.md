---
phase: 5
slug: squad-execution-context
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | SQAD-02 | — | N/A | unit | `npm run test -- --run src/lib/squads/assembler.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | SQAD-04 | — | N/A | unit | `npm run test -- --run src/lib/squads/estrategia.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 0 | SQAD-06 | — | N/A | unit | `npm run test -- --run src/lib/squads/schemas/output-parser.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | SQAD-01 | — | N/A | integration | `npm run test -- --run src/app/actions/squad.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | SQAD-05 | — | N/A | unit | `npm run test -- --run src/lib/squads/schemas/` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 2 | SQAD-07 | — | N/A | integration | `npm run test -- --run src/components/squad/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/squads/assembler.test.ts` — stubs for SQAD-02 (context assembly)
- [ ] `src/lib/squads/schemas/output-parser.test.ts` — stubs for SQAD-06 (output parsing + two-level JSON)
- [ ] `src/lib/squads/estrategia.test.ts` — stubs for SQAD-04 (prompt template builds valid string)
- [ ] `src/app/actions/squad.test.ts` — stubs for SQAD-01 (confirmSquadRun inserts job)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Run Squad button visible on active process, hidden on completed | SQAD-01 | Visual rendering + conditional display in accordion | Open client in Phase 1; verify button on active process, absent on completed |
| Prompt preview modal opens with correct squad name and context | SQAD-07 | Modal interaction + content rendering | Click Run Squad; verify modal shows squad name, briefing excerpt, full prompt |
| Confirm & Run queues job and worker picks it up | SQAD-03 | Requires live worker + DB | Click Confirm; verify squad_jobs row created with status=queued; worker transitions to running |
| Structured output renders in process row after completion | SQAD-05 | Visual rendering of parsed JSON | After job completes; verify structured view in process row expansion |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
