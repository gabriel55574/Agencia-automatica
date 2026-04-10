---
phase: 17
slug: phase-colors-breadcrumbs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | VIS-01 | — | N/A | grep | `grep -c 'PHASE_COLORS' src/lib/database/enums.ts` | ✅ | ⬜ pending |
| 17-01-02 | 01 | 1 | VIS-01 | — | N/A | grep | `grep -c 'PHASE_COLORS' src/components/dashboard/KanbanColumn.tsx` | ✅ | ⬜ pending |
| 17-01-03 | 01 | 1 | VIS-01 | — | N/A | grep | `grep -c 'PHASE_COLORS' src/components/clients/pipeline-phase.tsx` | ✅ | ⬜ pending |
| 17-02-01 | 02 | 1 | NAV-02 | — | N/A | file | `test -f src/components/ui/breadcrumb.tsx` | ❌ W0 | ⬜ pending |
| 17-02-02 | 02 | 1 | NAV-02 | — | N/A | grep | `grep -c 'Breadcrumb' src/app/\\(dashboard\\)/clients/\\[id\\]/page.tsx` | ✅ | ⬜ pending |
| 17-02-03 | 02 | 1 | NAV-02 | — | N/A | grep | `grep -c 'Breadcrumb' src/app/\\(dashboard\\)/clients/\\[id\\]/edit/page.tsx` | ✅ | ⬜ pending |
| 17-02-04 | 02 | 1 | NAV-02 | — | N/A | grep | `grep -c 'Breadcrumb' src/app/\\(dashboard\\)/clients/\\[id\\]/outputs/page.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/ui/breadcrumb.tsx` — new file created for breadcrumb component

*Existing infrastructure covers all other phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Phase colors visible on Kanban columns | VIS-01 | Visual — requires browser rendering | Load dashboard, verify each column has distinct color bar at top |
| Phase colors on pipeline accordion | VIS-01 | Visual — requires browser rendering | Open a client profile, verify colored left borders on accordion items |
| Breadcrumb links navigate correctly | NAV-02 | Navigation — requires browser interaction | Click each breadcrumb link, verify correct destination |
| Breadcrumb hover style uses Lime Dark | NAV-02 | Visual — requires browser rendering | Hover over breadcrumb link, verify text color changes to #6D8A03 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
