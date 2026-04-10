---
phase: 19
slug: ux-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + next build |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx next build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx next build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | UX-01 | — | N/A | build | `npx next build` (verifies loading.tsx compiles) | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | UX-01 | — | N/A | build | `npx next build` | ❌ W0 | ⬜ pending |
| 19-02-01 | 02 | 1 | VIS-03 | — | N/A | unit | `npx vitest run src/components/ui/empty-state` | ❌ W0 | ⬜ pending |
| 19-02-02 | 02 | 1 | VIS-03 | — | N/A | build | `npx next build` | ❌ W0 | ⬜ pending |
| 19-03-01 | 03 | 2 | UX-03 | — | N/A | build | `npx next build` | ❌ W0 | ⬜ pending |
| 19-04-01 | 04 | 2 | UX-02 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 19-04-02 | 04 | 2 | UX-02 | — | N/A | build | `npx next build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No additional test framework or config needed.

- vitest is installed and configured
- `next build` validates all loading.tsx, page.tsx compilation
- No new test stubs required at Wave 0 — all verifications are build-time or runtime visual

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skeleton animation renders correctly | UX-01 | Visual — animate-pulse is CSS, not testable via unit test | Load each route, verify pulse animation visible during data fetch |
| Empty state CTA navigates correctly | VIS-03 | Navigation is integration-level | Click each CTA button in empty state, verify correct destination |
| Tab switching instant without URL change | UX-03 | Interaction behavior | Click Pipeline/Outputs/Briefing tabs, verify content changes without URL change |
| Toast appears after CRUD actions | UX-02 | Requires end-to-end browser | Create/edit/archive/restore a client, verify toast appears with correct message |
| Toast message text in PT-BR | UX-02 | Text verification | Check each toast message matches the PT-BR copy from UI-SPEC |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
