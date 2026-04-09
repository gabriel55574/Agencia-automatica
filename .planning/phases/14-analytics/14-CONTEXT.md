# Phase 14: Analytics - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Operator can analyze operational performance with metrics and trend charts to identify bottlenecks and improve throughput across the client portfolio.

Requirements: ANLY-01, ANLY-02, ANLY-03, ANLY-04
- ANLY-01: Operator can view average time per phase across all clients
- ANLY-02: Operator can view process success rate (first-pass gate approval rate) per phase
- ANLY-03: Operator can view client lifecycle metrics (average time from intake to Phase 5 completion)
- ANLY-04: Analytics page shows trend charts for key metrics over configurable time periods

</domain>

<decisions>
## Implementation Decisions

### Analytics Page
- New route: /analytics in the (dashboard) layout
- Server Component page with configurable date range filter (7d, 30d, 90d, all time)
- Three main sections: Phase Performance, Gate Success Rates, Client Lifecycle

### Phase Performance (ANLY-01)
- Compute average days in each phase across all completed clients
- Data source: phases table (started_at, completed_at) grouped by phase_number
- Display: horizontal bar chart or simple table with phase name + avg days
- Highlight the slowest phase as a bottleneck indicator

### Gate Success Rate (ANLY-02)
- First-pass approval rate = gates approved on first attempt / total gate evaluations
- Data source: quality_gates table (track approval attempts) and gate_reviews table
- Display: percentage per gate with color coding (green > 80%, amber 50-80%, red < 50%)

### Client Lifecycle (ANLY-03)
- Average time from client.created_at to Phase 5 completed_at for clients who completed the full cycle
- Data source: clients + phases tables
- Display: single metric card + list of completed clients with individual durations

### Trend Charts (ANLY-04)
- Use Recharts library (React-native charting, works with Next.js, lightweight)
- Line chart: monthly averages for phase duration over selected time period
- Bar chart: monthly gate approval rates
- Date range selector: 7d, 30d, 90d, all time buttons

### Claude's Discretion
- Exact chart colors and styling (suggest: match existing shadcn/ui palette)
- Whether to use Recharts or a simpler solution (Recharts recommended for flexibility)
- Layout grid (suggest: 2-column grid on desktop, stack on mobile)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/dashboard/queries.ts` — pattern for parallel Supabase analytics queries
- `src/lib/dashboard/types.ts` — pattern for typed analytics data
- shadcn/ui Card, Table components for metric display
- PHASE_NAMES from enums.ts for phase labels

### Integration Points
- New /analytics route in (dashboard) layout
- Navigation: add "Analytics" link to dashboard header
- phases, quality_gates, gate_reviews, clients tables for data

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond ROADMAP success criteria.

</specifics>

<deferred>
## Deferred Ideas

- Export analytics as PDF/CSV
- Per-client analytics detail page
- Predictive analytics (estimate completion date for active clients)

</deferred>
