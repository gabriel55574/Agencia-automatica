---
phase: 2
slug: client-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (already installed) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --run tests/unit` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run tests/unit`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | CLNT-01 | — | N/A | build | `npx next build` | ✅ | ⬜ pending |
| 2-01-02 | 01 | 1 | CLNT-01 | T-2-01 | Briefing input validated server-side | unit | `npm test -- --run tests/unit/briefing-schema` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | CLNT-01 | T-2-01 | Name/company required fields enforced | unit | `npm test -- --run tests/unit/client-schema` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | CLNT-02 | — | N/A | e2e-manual | View profile page renders all 5 phases | ⬜ pending |
| 2-02-02 | 02 | 1 | CLNT-03 | T-2-02 | Edit does not touch phase rows | unit | `npm test -- --run tests/unit/edit-action` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 2 | CLNT-04 | T-2-03 | Archive preserves data, only changes status | unit | `npm test -- --run tests/unit/archive-action` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/briefing-schema.test.ts` — validates hybrid briefing Zod schema
- [ ] `tests/unit/client-schema.test.ts` — validates clientInsertSchema required fields
- [ ] `tests/unit/edit-action.test.ts` — stubs for CLNT-03 edit Server Action
- [ ] `tests/unit/archive-action.test.ts` — stubs for CLNT-04 archive action

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Client card grid renders correctly at /clients | CLNT-02 | Requires live browser + Supabase data | Run `npm run dev`, visit /clients, verify cards show |
| Archive toggle shows/hides archived clients | CLNT-04 | URL search param behavior in browser | Visit /clients, archive a client, toggle "Show archived" |
| Phase timeline shows all 5 phases after creation | CLNT-01 | Requires DB insert + page render | Create client, visit /clients/[id], verify all 5 phases listed |
| Restore archived client from profile page | CLNT-04 | Requires archived client in DB | Archive client, visit profile, click "Restore", verify status changes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
