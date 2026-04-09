---
phase: 12-cost-tracking
plan: 03
subsystem: ui, dashboard, costs
tags: [cost-tracking, shadcn, server-components, dashboard-widget, badge, next-js]

# Dependency graph
requires:
  - phase: 12-cost-tracking
    provides: "Cost type definitions (MonthlyCostSummary), cost queries (fetchMonthlyCostSummary), format utilities (formatCost, formatTokensCompact, formatMonth, getCurrentMonth), LatestJobData with token_count and estimated_cost_usd"
provides:
  - "CostSummaryWidget Server Component for dashboard with monthly total and top 5 clients"
  - "RunCostBadge Server Component showing inline cost/token badge on completed process rows"
  - "Dashboard page integration with cost data fetching"
affects: [12-04, budget-alerts, dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dashboard widget pattern: Server Component receives data as props from page-level fetch"
    - "Inline badge pattern: presentational component conditionally rendered based on job status"

key-files:
  created:
    - "src/components/dashboard/CostSummaryWidget.tsx"
    - "src/components/squad/RunCostBadge.tsx"
  modified:
    - "src/app/(dashboard)/page.tsx"
    - "src/components/clients/process-row.tsx"

key-decisions:
  - "CostSummaryWidget as Server Component (no 'use client') -- receives data as props from dashboard page fetch"
  - "RunCostBadge only renders when latestJob.status is completed AND token_count is non-null -- no badge clutter for running/failed jobs"

patterns-established:
  - "Dashboard cost widget pattern: Card with header link, total display, numbered client list"
  - "Inline cost badge pattern: Badge variant=outline with font-mono for cost/token display"

requirements-completed: [COST-01, COST-04]

# Metrics
duration: 3min
completed: 2026-04-09
---

# Phase 12 Plan 03: Dashboard Cost Widget + RunCostBadge Summary

**CostSummaryWidget on dashboard showing monthly total spend and top 5 clients, RunCostBadge on completed process rows showing dollar cost and token count**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-09T20:57:08Z
- **Completed:** 2026-04-09T20:59:45Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- CostSummaryWidget Server Component on dashboard between BottleneckAlert and KanbanBoard with monthly total (font-mono), top 5 clients with links, and "View All Costs" navigation to /costs
- RunCostBadge Server Component rendering "$X.XX | X.Xk tokens" inline on completed process rows with aria-label accessibility
- Empty state matching UI-SPEC copywriting contract: "No spend this month" / "Run a squad to start tracking costs."
- TypeScript compiles clean (only pre-existing unrelated error in pipeline-accordion.tsx)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CostSummaryWidget and integrate into dashboard** - `56a6c12` (feat)
2. **Task 2: Create RunCostBadge and wire into process rows** - `629a100` (feat)

## Files Created/Modified

- `src/components/dashboard/CostSummaryWidget.tsx` - Dashboard widget showing monthly total spend + top 5 clients with empty state
- `src/components/squad/RunCostBadge.tsx` - Inline badge showing "$X.XX | X.Xk tokens" for completed runs
- `src/app/(dashboard)/page.tsx` - Added cost imports, fetchMonthlyCostSummary call, CostSummaryWidget between BottleneckAlert and KanbanBoard
- `src/components/clients/process-row.tsx` - Added RunCostBadge import and rendering before AccordionStatusBadge on completed jobs

## Decisions Made

- CostSummaryWidget is a Server Component (no 'use client') receiving data as props from the dashboard page server fetch -- simpler, no client-side data loading
- RunCostBadge conditionally renders only when job is completed AND token_count is non-null -- prevents badge clutter for running/failed/queued jobs
- Client profile page already had token_count and estimated_cost_usd in squad_jobs query from Plan 01 -- no changes needed

## Deviations from Plan

None - plan executed exactly as written. Client profile page already had cost columns from Plan 01 deviation fix.

## Issues Encountered

- Pre-existing TypeScript error in pipeline-accordion.tsx:56 (TS2322 processNumber type mismatch) unrelated to cost tracking changes. Out of scope, not fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dashboard cost visibility complete (COST-04)
- Inline run cost visibility complete (COST-01 UI)
- Plan 04 (budget alerts) can proceed with all cost UI infrastructure in place
- Budget bars and budget setting dialog will use the same shadcn components already installed in Plan 02

## Self-Check: PASSED

- src/components/dashboard/CostSummaryWidget.tsx: FOUND
- src/components/squad/RunCostBadge.tsx: FOUND
- src/app/(dashboard)/page.tsx: FOUND (modified)
- src/components/clients/process-row.tsx: FOUND (modified)
- Commit 56a6c12 (Task 1): FOUND
- Commit 629a100 (Task 2): FOUND
- No TypeScript errors in modified files

---
*Phase: 12-cost-tracking*
*Completed: 2026-04-09*
