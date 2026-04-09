---
phase: 12-cost-tracking
plan: 02
subsystem: ui, costs
tags: [cost-tracking, shadcn, supabase, server-components, sortable-table, next-js]

# Dependency graph
requires:
  - phase: 12-cost-tracking
    provides: "squad_jobs.token_count and estimated_cost_usd columns, cost type definitions"
provides:
  - "Cost formatting utilities (formatCost, formatTokensCompact, formatTokensFull, formatTrend, formatMonth)"
  - "Cost query module (fetchMonthlyCostBreakdown, fetchMonthlyCostSummary)"
  - "MonthSelector component for month navigation via URL params"
  - "CostBreakdownTable with sortable columns, aria-sort, responsive trend column"
  - "/costs page route with monthly cost breakdown view"
  - "5 shadcn components installed (table, select, tooltip, dropdown-menu, progress)"
affects: [12-03, 12-04, dashboard-widget, budget-alerts, run-cost-badge]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-side sort state via useState (not URL params) for table sorting"
    - "MonthSelector navigates via URL search params (?month=YYYY-MM) for RSC refresh"
    - "Server Component page fetches data, passes to client components for interactivity"
    - "Cost formatting module with locale-aware number formatting (en-US)"

key-files:
  created:
    - "src/lib/costs/format.ts"
    - "src/lib/costs/queries.ts"
    - "src/components/costs/MonthSelector.tsx"
    - "src/components/costs/CostBreakdownTable.tsx"
    - "src/app/(dashboard)/costs/page.tsx"
  modified: []

key-decisions:
  - "Client-side sort state via useState rather than URL params -- simpler for v1, avoids unnecessary RSC re-renders on sort change"
  - "Aggregation in TypeScript rather than SQL -- Supabase JS client does not support GROUP BY, volume bounded by monthly job count"
  - "fetchMonthlyCostSummary reuses fetchMonthlyCostBreakdown to avoid query duplication"

patterns-established:
  - "Cost page pattern: Server Component page with URL param month filtering, client components for interactivity"
  - "Cost formatting module at src/lib/costs/format.ts shared by all Phase 12 UI components"

requirements-completed: [COST-02]

# Metrics
duration: 6min
completed: 2026-04-09
---

# Phase 12 Plan 02: Cost Breakdown Page with Sortable Table and Month Navigation Summary

**Monthly /costs page with sortable per-client cost breakdown table, MonthSelector dropdown, cost formatting utilities, and Supabase query module**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-09T20:44:11Z
- **Completed:** 2026-04-09T20:50:24Z
- **Tasks:** 4
- **Files modified:** 10

## Accomplishments

- Installed 5 shadcn components (table, select, tooltip, dropdown-menu, progress) for Phase 12 UI infrastructure
- Created cost formatting module with 7 exported utilities matching UI-SPEC number formatting rules
- Built cost query module with fetchMonthlyCostBreakdown (per-client aggregation with trend) and fetchMonthlyCostSummary
- Built /costs page with sortable CostBreakdownTable (4 sortable columns with aria-sort), MonthSelector (12-month dropdown via URL params), responsive trend column, and empty state

## Task Commits

Each task was committed atomically:

1. **Task 1: Install all shadcn components needed for Phase 12** - `4d8275a` (chore)
2. **Task 2: Create number formatting utilities** - `eab8ac5` (feat)
3. **Task 3: Create cost query module** - `d7bd0b3` (feat)
4. **Task 4: Create MonthSelector, CostBreakdownTable, and /costs page** - `c7b942f` (feat)

## Files Created/Modified

- `src/components/ui/table.tsx` - shadcn Table component for cost breakdown
- `src/components/ui/select.tsx` - shadcn Select component for month navigation
- `src/components/ui/tooltip.tsx` - shadcn Tooltip for future budget UI
- `src/components/ui/dropdown-menu.tsx` - shadcn DropdownMenu for sort options
- `src/components/ui/progress.tsx` - shadcn Progress for future budget bars
- `src/lib/costs/format.ts` - 7 formatting utilities (formatCost, formatTokensCompact, formatTokensFull, formatTrend, formatMonth, getCurrentMonth, getLastMonths)
- `src/lib/costs/queries.ts` - fetchMonthlyCostBreakdown and fetchMonthlyCostSummary with Supabase queries
- `src/components/costs/MonthSelector.tsx` - Client component with shadcn Select, URL param navigation
- `src/components/costs/CostBreakdownTable.tsx` - Client component with sortable columns, aria-sort, responsive trend, empty state
- `src/app/(dashboard)/costs/page.tsx` - Server Component /costs route with month filtering via searchParams

## Decisions Made

- Client-side sort state via useState rather than URL params for table sorting (simpler for v1, avoids RSC re-renders on sort change)
- TypeScript aggregation for cost queries since Supabase JS client lacks GROUP BY support
- Monthly cost volume bounded by ~50-100 jobs per month (15 clients), making in-memory aggregation safe
- fetchMonthlyCostSummary reuses fetchMonthlyCostBreakdown to avoid query duplication

## Deviations from Plan

None - plan executed exactly as written. All 4 tasks matched the plan specifications precisely.

## Issues Encountered

- Pre-existing TypeScript error in src/worker/job-runner.ts:305 (TS2339: Property 'catch' on PromiseLike) from Phase 9 feedback loop integration. Out of scope for this plan, logged to deferred-items.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /costs page is live and functional for viewing monthly cost breakdown
- Cost query module ready for reuse by Plan 04 (dashboard widget uses fetchMonthlyCostSummary)
- 5 shadcn components installed for Plans 03 and 04 (progress, tooltip for budget UI)
- Format utilities shared across all Phase 12 UI components

## Self-Check: PASSED

- All 4 tasks executed and committed
- 5 shadcn components installed (table, select, tooltip, dropdown-menu, progress)
- format.ts exports all 7 formatting functions
- queries.ts exports fetchMonthlyCostBreakdown and fetchMonthlyCostSummary
- /costs page renders as Server Component with month filtering
- CostBreakdownTable has sortable columns with aria-sort
- Empty state text matches UI-SPEC copywriting contract
- Commit 4d8275a (Task 1) verified in git log
- Commit eab8ac5 (Task 2) verified in git log
- Commit d7bd0b3 (Task 3) verified in git log
- Commit c7b942f (Task 4) verified in git log

---
*Phase: 12-cost-tracking*
*Completed: 2026-04-09*
