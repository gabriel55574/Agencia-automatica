---
phase: 12-cost-tracking
plan: 02
subsystem: ui
tags: [shadcn, supabase, next.js, cost-tracking]

requires:
  - phase: 12-01
    provides: token_count and estimated_cost_usd columns on squad_jobs, cost types

provides:
  - shadcn table, select, tooltip, dropdown-menu, progress components
  - cost formatting utilities (formatCost, formatTokensCompact, etc.)
  - cost query module (fetchMonthlyCostBreakdown, fetchMonthlyCostSummary)
  - /costs page with sortable monthly cost breakdown table
  - MonthSelector component for month navigation via URL params

affects: [12-03, 12-04]

tech-stack:
  added: [shadcn/table, shadcn/select, shadcn/tooltip, shadcn/dropdown-menu, shadcn/progress]
  patterns: [cost aggregation via TypeScript Maps, URL param-based filtering]

key-files:
  created:
    - src/lib/costs/format.ts
    - src/lib/costs/queries.ts
    - src/components/costs/MonthSelector.tsx
    - src/components/costs/CostBreakdownTable.tsx
    - src/app/(dashboard)/costs/page.tsx
    - src/components/ui/table.tsx
    - src/components/ui/select.tsx
    - src/components/ui/tooltip.tsx
    - src/components/ui/dropdown-menu.tsx
    - src/components/ui/progress.tsx
  modified: []

key-decisions:
  - "Aggregation in TypeScript (not SQL GROUP BY) since Supabase JS client lacks GROUP BY support"
  - "Sort state managed client-side via useState rather than URL params for simplicity"
  - "fetchMonthlyCostSummary reuses fetchMonthlyCostBreakdown to avoid query duplication"

patterns-established:
  - "Cost formatting: all dollar amounts use formatCost, all token counts use formatTokensCompact"
  - "Month navigation: URL search param ?month=YYYY-MM with Server Component re-fetch"

requirements-completed: [COST-02]

duration: 8min
completed: 2026-04-09
---

# Plan 12-02: Cost Breakdown Page Summary

**Monthly cost breakdown page at /costs with sortable per-client table, month navigation, and shared formatting infrastructure for all Phase 12 UI**

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 4d8275a | Install shadcn table, select, tooltip, dropdown-menu, progress |
| 2 | eab8ac5 | Add cost formatting utilities |
| 3 | d7bd0b3 | Add cost query module |
| 4 | c7b942f | Add /costs page with sortable cost breakdown table |

## Deviations

None

## Self-Check: PASSED

- [x] All 4 tasks executed
- [x] Each task committed individually
- [x] 5 shadcn components installed
- [x] format.ts exports all 7 formatting functions
- [x] queries.ts exports fetchMonthlyCostBreakdown and fetchMonthlyCostSummary
- [x] /costs page renders as Server Component with month filtering
- [x] CostBreakdownTable has sortable columns with aria-sort
- [x] Empty state text matches UI-SPEC copywriting contract
- [x] TypeScript compiles (pre-existing errors in worker/job-runner.ts only)
