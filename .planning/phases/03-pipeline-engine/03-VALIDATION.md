---
phase: 3
slug: pipeline-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.3 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (unit); ~60 seconds (integration, requires live Supabase) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tests/unit/`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PIPE-05 | — | N/A | unit | `npm test -- tests/unit/processes-config.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PIPE-05 | — | N/A | unit | `npm test -- tests/unit/processes-config.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | PIPE-01 | — | N/A | integration | `npm test -- tests/db/pipeline.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | PIPE-02 | T-3-01 | Gate approved only once; transaction prevents double-processing | integration | `npm test -- tests/db/pipeline.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | PIPE-03 | — | Gate rejection marks exact processes failed; phase stays active | integration | `npm test -- tests/db/pipeline.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 2 | PIPE-04 | T-3-02 | Concurrent approve_gate calls do not corrupt state | integration | `npm test -- tests/db/pipeline.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/processes-config.test.ts` — stubs for PIPE-05 (process definition shape, count=16, phase/squad alignment)
- [ ] `tests/db/pipeline.test.ts` — stubs for PIPE-01 through PIPE-04 (gate approval, rejection, race condition, independent state)
- [ ] `tests/db/helpers.ts` — `cleanTestData()` fixture shared across db tests

*Test infrastructure (vitest.config.ts, package.json scripts) already exists from Phase 2.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Accordion auto-expands active phase on page load | PIPE-01 | DOM/visual behavior — not unit-testable | Navigate to `/clients/[id]`, verify active phase section is expanded without clicking |
| Gate dialog shows correct process checkboxes on reject | PIPE-03 | UI interaction — not unit-testable | Click "Reject Gate", verify checkboxes list processes in the current phase only |
| Badge shows "needs rework" (red) for failed processes | PIPE-03 | Visual/CSS — not unit-testable | After rejection, verify failed process row shows red "needs rework" badge |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
