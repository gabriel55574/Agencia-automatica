# Phase 14: Analytics - Research

**Researched:** 2026-04-09
**Status:** Complete

## Phase Scope

Build an analytics page that provides the operator with operational performance metrics:
- ANLY-01: Average time per phase across all clients
- ANLY-02: First-pass gate approval rate per phase
- ANLY-03: Client lifecycle metrics (intake to Phase 5 completion)
- ANLY-04: Trend charts with configurable time period filters

## Technical Research

### 1. Data Sources & Query Patterns

**Phase duration (ANLY-01):**
- Table: `phases` — has `started_at` (nullable timestamp), `completed_at` (nullable timestamp), `phase_number` (1-5), `status` ('pending'|'active'|'completed')
- Query: For completed phases, calculate `completed_at - started_at` grouped by `phase_number`
- Edge case: phases with null `started_at` or `completed_at` must be excluded
- SQL approach: `AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 86400)` gives average days

**Gate approval rate (ANLY-02):**
- Tables: `quality_gates` (has `status`, `gate_number`, `phase_id`), `gate_reviews` (has `gate_id`, `status`, `verdict`)
- First-pass rate = gates approved on first review attempt / total gates evaluated
- Approach: Count gate_reviews per gate_id. Gates with exactly 1 review AND status='approved' = first-pass success
- Alternative simpler approach: gates where `status='approved'` vs total gates not in 'pending' status, since each rejection triggers re-evaluation. The ratio of approved gates to total evaluated gates approximates first-pass rate.
- Best approach: Count `gate_reviews` per `gate_id`. If a gate has exactly 1 review and the gate status is 'approved', it passed first time.

**Client lifecycle (ANLY-03):**
- Tables: `clients` (has `created_at`), `phases` (find Phase 5 with `completed_at`)
- Query: Join clients to their Phase 5 phase row where status='completed'
- Calculate: `phases.completed_at - clients.created_at` for each completed client
- Return: average duration, individual client durations

**Trend data (ANLY-04):**
- Need monthly/weekly aggregation of the above metrics over time
- Phase duration trends: group completed phases by month (using `completed_at`)
- Gate approval trends: group evaluated gates by month (using `reviewed_at` or `updated_at`)
- Approach: Supabase RPC function or client-side aggregation from raw data
- For MVP: fetch all relevant rows and aggregate client-side. Supabase doesn't have built-in date_trunc in the JS client, but we can use raw SQL via `.rpc()` or do aggregation in TypeScript.

### 2. Charting Library

**Decision: Recharts** (per CONTEXT.md recommendation)
- React-native charting library, works with SSR when rendered in client components
- Lightweight: ~45KB gzipped for core
- Supports: LineChart, BarChart, AreaChart, Tooltip, ResponsiveContainer
- Installation: `npm install recharts`
- Must be used in 'use client' components (uses DOM APIs)
- Current project has no charting dependency — this will be the first

### 3. Page Architecture

**Route:** `/analytics` under `(dashboard)` layout group
- Server Component page fetches data via async queries
- Client Component charts receive pre-computed data as props
- Date range filter: client-side state controls which period to show
- Pattern follows existing dashboard page: Server Component -> Client Component

**Navigation:** The dashboard layout header currently only has "Agency OS" text and sign-out button. Need to add navigation links: Dashboard, Analytics (at minimum).

### 4. File Structure

```
src/app/(dashboard)/analytics/
  page.tsx                     — Server Component, fetches analytics data
src/lib/analytics/
  queries.ts                   — Supabase queries for analytics data
  types.ts                     — TypeScript types for analytics data
  aggregations.ts              — Client-side date aggregation utilities
src/components/analytics/
  AnalyticsDashboard.tsx       — Main client component, manages date range state
  PhasePerformanceChart.tsx    — Bar chart for avg days per phase
  GateApprovalChart.tsx        — Bar chart for gate approval rates
  LifecycleMetrics.tsx         — Metric cards for lifecycle data
  TrendChart.tsx               — Line chart for trends over time
  DateRangeFilter.tsx          — Filter buttons (7d, 30d, 90d, all time)
```

### 5. Database Query Approach

Use server-side Supabase queries (same pattern as `src/lib/dashboard/queries.ts`) with parallel execution:

```typescript
const [phasesResult, gatesResult, reviewsResult, clientsResult] = await Promise.all([
  supabase.from('phases').select('...'),
  supabase.from('quality_gates').select('...'),
  supabase.from('gate_reviews').select('...'),
  supabase.from('clients').select('...'),
])
```

Aggregation (averages, rates, trends) happens in TypeScript after fetching, not in SQL. This avoids needing RPC functions and keeps logic testable.

### 6. Date Range Filtering

- Filtering by time period is a client-side concern (filter pre-fetched data)
- Pass all data to the client component, filter by selected period
- For large datasets: consider server-side filtering via searchParams in the future
- MVP approach: fetch all completed data, filter client-side

### 7. Dependencies on Phase 12 (Cost Tracking)

Phase 12 adds `token_count` and `estimated_cost_usd` to `squad_jobs`, and `token_budget` to `processes`. These columns are NOT needed for Phase 14 analytics — Phase 14 focuses on time/throughput metrics, not cost metrics. The analytics page is independent of cost tracking data.

However, Phase 14 depends on Phase 11 (Production Deployment) being complete per ROADMAP.md. Since we're planning ahead, the plans should work on the existing schema without requiring Phase 12 columns.

### 8. Existing Patterns to Follow

- **Query module pattern:** `src/lib/dashboard/queries.ts` — async function returning typed data
- **Type module pattern:** `src/lib/dashboard/types.ts` — exported type definitions
- **Constants pattern:** `src/lib/dashboard/constants.ts` — threshold values
- **Server Component page:** `src/app/(dashboard)/page.tsx` — fetch data, pass to client component
- **UI components:** shadcn/ui Card, Badge from `src/components/ui/`
- **PHASE_NAMES import:** from `src/lib/database/enums.ts`

### 9. Security Considerations

- Analytics page is behind auth (dashboard layout checks `supabase.auth.getUser()`)
- All queries use the authenticated Supabase client (RLS enforced)
- No new data write paths — read-only analytics
- No external API calls or user input beyond date range selection

## Validation Architecture

### Automated Checks
1. TypeScript compilation: `npx tsc --noEmit` — zero errors
2. Build: `npm run build` — analytics page builds without errors
3. Lint: `npm run lint` — no linting errors in new files

### Manual Verification
1. Navigate to /analytics — page renders with data sections
2. Date range filter changes displayed data
3. Charts render (Recharts components mount without errors)
4. Empty state handled gracefully (no data = friendly message, not crash)

## RESEARCH COMPLETE
