---
phase: 08-dashboard-operational-views
created: 2026-04-09
status: ready-for-planning
---

# Phase 8: Dashboard & Operational Views — Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Replace the placeholder dashboard with the operational command center: a Kanban pipeline
board showing all clients by phase, bottleneck alerts, pending approvals, running jobs,
and real-time updates via Supabase Realtime.

**In scope:**
- Kanban board: 5 columns (one per phase), client cards in each column
- Client cards: name, company, current process, gate status, running job indicator
- Display-only Kanban (no drag-and-drop between phases)
- Bottleneck alerts: clients stuck beyond configurable threshold per phase
- Action panel: pending gate approvals, failed gates, running squad sessions
- Real-time updates via Supabase Realtime subscriptions (clients, squad_jobs, quality_gates)
- Replace existing placeholder dashboard page

**Out of scope:**
- Drag-and-drop phase transitions (transitions happen through gates only)
- Client-facing dashboard (operator-only)
- Analytics/reporting charts (v2)
- Mobile-specific layout (responsive is sufficient)
- Custom Kanban column ordering (fixed: phases 1-5)

</domain>

<decisions>
## Implementation Decisions

### Kanban Board

- **D-01:** 5 fixed columns representing the 5 phases. Column headers show phase name
  and count of clients in that phase. Columns are not reorderable.

- **D-02:** Client cards show: client name, company, badge for current process number,
  gate status badge (pending/approved/rejected), running job spinner if any job is active.
  Click navigates to `/clients/[id]`.

- **D-03:** Display-only — no `@hello-pangea/dnd`. Cards are static. Phase transitions
  happen through quality gate approval only (DASH-02). This simplifies implementation
  and enforces the methodology.

- **D-04:** Archived clients are hidden from the Kanban board by default. Toggle
  "Show archived" adds a 6th column or dims them in their phase column.

### Bottleneck Alerts

- **D-05:** Bottleneck threshold: configurable per phase via a settings table or
  environment variable. Default: 7 days per phase. Clients in a phase longer than the
  threshold get a yellow "Stuck" badge on their card.

- **D-06:** Alert section at top of dashboard: "X clients need attention" with a list
  of stuck clients, each linking to their profile page.

### Action Panel

- **D-07:** Sidebar or top section showing:
  - Pending gate approvals (gates with status='pending' where all processes are completed)
  - Failed/rejected gates (requiring rework attention)
  - Running squad sessions (squad_jobs with status='running')
  Each item links to the relevant client profile.

- **D-08:** Action counts shown as badges in the dashboard header or as a compact
  summary bar: "3 pending approvals · 1 failed gate · 2 running jobs"

### Real-time Updates

- **D-09:** Supabase Realtime subscription on `clients` table for status changes.
  When a client's `current_phase_number` changes, the card moves to the new column
  without page refresh.

- **D-10:** Supabase Realtime subscription on `squad_jobs` for running/completed status.
  Updates the running indicator on client cards in real-time.

- **D-11:** Supabase Realtime subscription on `quality_gates` for gate status changes.
  Updates the action panel counts and card badges in real-time.

- **D-12:** All Realtime subscriptions use the Supabase JS client's `channel.on()`
  pattern. Single channel with multiple table filters for efficiency.

### Claude's Discretion

- Exact layout proportions (sidebar vs top panel for actions)
- Card visual design (minimal card vs detailed card)
- Whether to use CSS Grid or Flexbox for Kanban columns
- Bottleneck threshold storage mechanism (env var vs DB table vs config)
- Whether alerts auto-dismiss or require operator action

</decisions>

<canonical_refs>
## Canonical References

### Database
- `supabase/migrations/00001_initial_schema.sql` — clients, phases, quality_gates tables
- `src/lib/database/types.ts` — TypeScript types for DB tables

### Existing Components
- `src/app/(dashboard)/page.tsx` — Current placeholder dashboard (replace)
- `src/app/(dashboard)/layout.tsx` — Dashboard layout with nav
- `src/components/clients/client-grid.tsx` — Client list pattern (reuse card concepts)

### Supabase Realtime
- `@supabase/supabase-js` — Already installed, has Realtime support built in

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Client card pattern from `client-grid.tsx` — visual style for client representation
- Supabase client setup in `src/lib/supabase/client.ts` — browser-side client for Realtime
- Badge component from shadcn/ui — status indicators
- Dashboard layout already has nav with "Clientes" and "+ Novo Cliente" links

### New Files Needed
- `src/app/(dashboard)/page.tsx` — Replace placeholder with Kanban dashboard
- `src/components/dashboard/KanbanBoard.tsx` — Main Kanban component
- `src/components/dashboard/KanbanColumn.tsx` — Phase column
- `src/components/dashboard/ClientCard.tsx` — Client card in column
- `src/components/dashboard/ActionPanel.tsx` — Pending approvals, failed gates, running jobs
- `src/components/dashboard/BottleneckAlert.tsx` — Stuck client alerts
- `src/hooks/useRealtimeDashboard.ts` — Supabase Realtime subscriptions

</code_context>

<specifics>
## Specific Ideas

- The Kanban board is the "command center" — it should be information-dense but scannable.
- Bottleneck alerts are the most operationally valuable feature for 15+ client management.
- Realtime updates prevent the operator from making decisions on stale data.
- No DnD library needed (DASH-02) — this is a major simplification.

</specifics>

<deferred>
## Deferred Ideas

- Analytics charts (client throughput, average phase duration) — v2
- Notification system (email/push alerts for stuck clients) — v2
- Custom dashboard widgets — v2
- Phase capacity limits (max clients per phase) — v2
- Export dashboard state as report — v2

</deferred>

---

*Phase: 08-dashboard-operational-views*
*Context gathered: 2026-04-09 via autonomous smart discuss*
