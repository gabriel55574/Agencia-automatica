---
phase: 14-analytics
plan: 01
subsystem: analytics
tags: [recharts, supabase, date-fns, vitest, analytics, metrics]

# Dependency graph
requires:
  - phase: 01-foundation-data-model
    provides: phases, quality_gates, gate_reviews, clients tables
  - phase: 08-dashboard-operational-views
    provides: parallel query pattern from dashboard/queries.ts
provides:
  - AnalyticsData type with phase durations, gate approval rates, lifecycle metrics, trend data
  - fetchAnalyticsData server-side query function
  - filterByDateRange and aggregateMonthlyTrends client-side utilities
  - GATE_RATE_THRESHOLDS constants for rate color coding
  - recharts dependency installed
affects: [14-02-analytics-ui]

# Tech tracking
tech-stack:
  added: [recharts@3.8.1]
  patterns: [pure-compute-functions-for-testability, parallel-supabase-queries, typed-trend-data-for-client-aggregation]

key-files:
  created:
    - src/lib/analytics/types.ts
    - src/lib/analytics/constants.ts
    - src/lib/analytics/aggregations.ts
    - src/lib/analytics/queries.ts
    - tests/analytics/aggregations.test.ts
    - tests/analytics/queries.test.ts
  modified:
    - package.json

key-decisions:
  - "Pure compute functions extracted from fetchAnalyticsData for unit testing without Supabase mocking"
  - "Trend data returned as raw rows for client-side re-aggregation after date filtering"
  - "Gate first-pass defined as exactly 1 review AND status approved"

patterns-established:
  - "Analytics compute pattern: server fetches raw rows, pure functions aggregate, client filters by date range"
  - "TrendPoint month format: YYYY-MM with abbreviated label (Jan, Feb, etc.) for chart axis"

requirements-completed: [ANLY-01, ANLY-02, ANLY-03, ANLY-04]

# Metrics
duration: 5min
completed: 2026-04-09
---

# Phase 14 Plan 01: Analytics Data Layer Summary

**Recharts-ready analytics module with typed Supabase queries for phase durations (5 phases), gate approval rates (4 gates), client lifecycle metrics, and monthly trend aggregation -- 30 unit tests passing**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-09T21:21:27Z
- **Completed:** 2026-04-09T21:27:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Complete analytics type system: AnalyticsData, PhaseDuration, GateApprovalRate, LifecycleMetric, CompletedClient, TrendPoint, DateRange
- Server-side fetchAnalyticsData with 4 parallel Supabase queries and pure compute functions for all 3 metric categories
- Client-side filterByDateRange (7d/30d/90d/all) and aggregateMonthlyTrends for Recharts consumption
- 30 unit tests covering all edge cases: empty data, null dates, multi-month trends, first-pass gate logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Define types, constants, and write unit tests for aggregation logic** - `791d212` (test + feat)
2. **Task 2: Implement Supabase analytics queries with unit tests** - `d70583c` (feat)

**Plan metadata:** pending (docs: complete plan)

_Note: TDD tasks have RED-GREEN commits combined into single atomic commits_

## Files Created/Modified
- `src/lib/analytics/types.ts` - All analytics type definitions (AnalyticsData, PhaseDuration, GateApprovalRate, LifecycleMetric, CompletedClient, TrendPoint, DateRange)
- `src/lib/analytics/constants.ts` - GATE_RATE_THRESHOLDS (healthy=80, moderate=50) and getGateRateStatus classifier
- `src/lib/analytics/aggregations.ts` - filterByDateRange for date filtering, aggregateMonthlyTrends for chart data
- `src/lib/analytics/queries.ts` - fetchAnalyticsData, computePhaseDurations, computeGateApprovalRates, computeLifecycleMetrics, buildTrendRawData
- `tests/analytics/aggregations.test.ts` - 15 tests for date filtering and trend aggregation
- `tests/analytics/queries.test.ts` - 15 tests for pure compute functions
- `package.json` - Added recharts@3.8.1

## Decisions Made
- **Pure compute extraction:** Extracted computePhaseDurations, computeGateApprovalRates, computeLifecycleMetrics as standalone functions for testing without Supabase mocking -- follows existing pattern from cost tracking
- **Raw trend data pattern:** fetchAnalyticsData returns raw `trend_data` rows alongside pre-computed aggregates, allowing the client to re-aggregate after applying date range filters without re-querying the server
- **First-pass gate definition:** A gate "passed first try" when it has exactly 1 review AND status='approved' -- rejected gates with 1 review are evaluated but not first-pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test factory null handling with `??` operator**
- **Found during:** Task 2 (query tests)
- **Issue:** Test factory used `overrides.started_at ?? default` which treated explicit `null` override as nullish and returned the default value, causing null-exclusion tests to fail
- **Fix:** Changed nullable fields to use `'field' in overrides ? overrides.field! : default` pattern
- **Files modified:** tests/analytics/queries.test.ts
- **Verification:** All 15 query tests pass including null exclusion cases
- **Committed in:** d70583c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test-only fix, no scope creep. Implementation logic unchanged.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Analytics data layer fully operational and tested
- Plan 02 can build UI components consuming fetchAnalyticsData, filterByDateRange, and aggregateMonthlyTrends directly
- Recharts installed and ready for chart rendering
- All types exported for component prop typing

---
*Phase: 14-analytics*
*Completed: 2026-04-09*
