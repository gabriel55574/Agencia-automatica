# Phase 12: Cost Tracking - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Operator has full visibility into AI spend per run, per client, and per month so they can manage operational costs across 15+ clients.

Requirements: COST-01, COST-02, COST-03, COST-04
- COST-01: Operator can see estimated token usage and cost per squad run after it completes
- COST-02: Operator can view monthly cost breakdown by client showing total spend per client
- COST-03: Operator can set per-process token budgets with visual alerts when a run approaches or exceeds the limit
- COST-04: Dashboard shows monthly cost summary widget with total spend and top-spending clients

</domain>

<decisions>
## Implementation Decisions

### Token Tracking & Cost Estimation
- Track token usage from Claude CLI stdout parsing (look for token count in CLI output metadata)
- Store token_count (input + output), estimated_cost_usd on squad_jobs table (new columns)
- Cost estimation uses configurable rate per 1K tokens (stored in app config, not hardcoded)
- If CLI output doesn't include token metadata, store null (graceful fallback, not error)

### Cost Breakdown Page
- New route: /costs with monthly view (default: current month)
- Table: client name, total runs, total tokens, estimated cost, sorted by cost descending
- Month selector (prev/next arrows or dropdown)
- Server Component page — no client-side state needed for initial load

### Budget Alerts
- New column on processes table: token_budget (integer, nullable — null means no budget)
- Budget is per-process, not per-run (accumulates across all runs for that process)
- Visual warning: amber badge when total usage > 80% of budget, red badge when > 100%
- Budget setting: inline edit on the process definition view (not a separate settings page)

### Dashboard Widget
- Small card on the main dashboard (alongside existing KanbanBoard)
- Shows: total spend this month, top 3 clients by spend, trend vs last month
- Clicking the card navigates to /costs page

### Claude's Discretion
- Exact layout and spacing of cost components
- Chart library choice (if any — simple numbers may suffice for v1.1)
- Decimal precision for cost display (suggest 2 decimal places USD)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/dashboard/queries.ts` — fetchDashboardData pattern for parallel Supabase queries
- `src/components/dashboard/KanbanBoard.tsx` — existing dashboard layout to add widget to
- `src/worker/job-runner.ts` — close handler where token counting can be added
- shadcn/ui Card, Table, Badge components already available

### Established Patterns
- Server Component pages fetch data via Supabase client
- Dashboard uses `useRealtimeDashboard` for live updates
- Server Actions for mutations (budget setting)

### Integration Points
- Worker close handler (job-runner.ts) — extract token count from CLI output
- squad_jobs table — add token_count, estimated_cost columns
- Dashboard page (page.tsx) — add cost widget alongside KanbanBoard
- New /costs route in (dashboard) layout

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the ROADMAP success criteria.

</specifics>

<deferred>
## Deferred Ideas

- Historical cost charts/trends (analytics phase covers trend charts)
- Cost alerts via email (notifications phase handles email)

</deferred>
