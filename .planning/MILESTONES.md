# Milestones

## v1.1 Production Hardening & Feature Expansion (Shipped: 2026-04-09)

**Phases completed:** 6 phases, 12 plans, 31 tasks

**Key accomplishments:**

- Auto-generated types from live Supabase schema with gate_reviews table, 5 RPC signatures, and zero as-any casts across application code
- All 33 integration tests pass against live Supabase -- added gate_reviews to table check and cleanup for full schema coverage
- Token extraction from Claude CLI output with cost estimation, DB migration for squad_jobs/processes cost columns, and worker integration recording usage per completed run
- Monthly /costs page with sortable per-client cost breakdown table, MonthSelector dropdown, cost formatting utilities, and Supabase query module
- CostSummaryWidget on dashboard showing monthly total spend and top 5 clients, RunCostBadge on completed process rows showing dollar cost and token count
- Per-process token budget lifecycle: Server Actions for set/remove, BudgetSettingDialog with inline confirmation, color-coded BudgetBar progress, and BudgetAlertBanner for exceeded warnings
- Status:
- Worker notification hooks for squad completion/failure, gate review fail/partial alerts, and daily digest cron at 08:00 UTC via node-cron
- Recharts-ready analytics module with typed Supabase queries for phase durations (5 phases), gate approval rates (4 gates), client lifecycle metrics, and monthly trend aggregation -- 30 unit tests passing
- Interactive analytics dashboard with Recharts bar/line charts for phase performance, gate approval rates with color-coded badges, client lifecycle metrics, and monthly trends -- all filtered by date range toggle
- Templates table confirmed live with 7 integration tests covering schema constraints, Zod validation, and clone client pattern
- /templates management page with delete, Save-as-Template wired into outputs browser via OutputViewer prop chain, Templates nav link in dashboard header

---

## v1.0 MVP (Shipped: 2026-04-09)

**Phases completed:** 9 phases, 21 plans, 46 tasks

**Key accomplishments:**

- Next.js 16 scaffold with three Supabase client configurations, auth proxy protecting dashboard routes, and email/password login via Server Action
- PostgreSQL 6-table Agency OS schema with phase sequence enforcement triggers, RLS policies, and TypeScript Zod schemas mirroring the 5-phase/16-process/4-squad/4-gate domain model
- shadcn/ui scaffold + PL/pgSQL atomic RPC + createClientAction Server Action + /clients card grid + /clients/new intake form with 11 unit tests all passing
- Client profile page, edit page, archive/restore dialog, PipelineTimeline component — all wired with Server Actions, 21 unit tests passing, build succeeds with /clients/[id] and /clients/[id]/edit routes
- One-liner:
- PostgreSQL-backed job worker: Claude CLI spawn with concurrency guard (MAX_CONCURRENT=2), Realtime subscription, 5-second polling fallback, exponential backoff retry, and 30-minute stuck job recovery via PM2-managed process
- Process status badges (running/failed) and Realtime progress modal wired into /clients/[id]: operators see live squad job progress without leaving the client profile page
- Migration 00007:
- 4 squad prompt templates with verbatim identity from agency-os-prompt.md, schema-derived output formats, two-step Server Actions (assemble preview + confirm queue), and worker structured output parsing
- RunSquadButton + PromptPreviewModal + StructuredOutputView wired into pipeline accordion with D-01/D-03 visibility rules and Confirm & Run flow
- 4 gate checklists (23 items verbatim from methodology), adversarial auditor prompt builder, and Zod verdict schema for structured AI gate reviews
- gate_reviews migration, runGateReview Server Action, and worker verdict parser for AI-powered quality gate reviews
- Operator-facing gate review UI with methodology checklists, Run Gate Review button, AI verdict display with PASS/FAIL badges and evidence citations, and enhanced reject dialog with AI-suggested rework items
- Outputs browsing page with phase/process accordion, inline OutputViewer with Structured/Raw tabs, and raw .txt download via Blob API
- Client-side PDF export using @react-pdf/renderer with branded template, dynamic import, and two-step lazy loading from OutputViewer
- 5-column Kanban dashboard with client cards showing process/gate status, bottleneck detection at 7-day threshold, and stuck-client alerts
- Action panel with pending approvals/failed gates/running jobs, summary bar with badge counts, and Supabase Realtime subscriptions for live dashboard updates across 3 tables
- extractFeedbackContext extracts NPS/CLV/retention metrics from Phase 5 outputs for cycle 2+ clients, with reset_pipeline_cycle RPC for safe in-place pipeline reset
- Pipeline reset button, cycle badge, and feedback context display wired into client profile and prompt preview modal

---
