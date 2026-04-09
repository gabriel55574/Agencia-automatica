---
phase: 14
slug: analytics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/analytics/` |
| **Full suite command** | `npx vitest run && npx tsc --noEmit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx vitest run && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | ANLY-01 | — | N/A | unit | `npx vitest run tests/analytics/queries.test.ts` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | ANLY-02 | — | N/A | unit | `npx vitest run tests/analytics/queries.test.ts` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | ANLY-03 | — | N/A | unit | `npx vitest run tests/analytics/queries.test.ts` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 2 | ANLY-04 | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| 14-02-02 | 02 | 2 | ANLY-01,02,03,04 | — | N/A | build | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/analytics/queries.test.ts` — stubs for ANLY-01, ANLY-02, ANLY-03 aggregation functions
- [ ] Recharts package installed (`npm install recharts`)

*Existing Vitest infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Charts render correctly | ANLY-04 | Visual rendering requires browser | Navigate to /analytics, verify bar/line charts display with correct axes and tooltips |
| Date range filter updates charts | ANLY-04 | Interactive UI behavior | Click each filter button (7d, 30d, 90d, all), verify chart data changes |
| Navigation link works | ANLY-01 | Route navigation | Click "Analytics" link in header, verify /analytics loads |
| Empty state display | ANLY-01,02,03 | Visual check | With no completed phases/gates, verify friendly empty message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
