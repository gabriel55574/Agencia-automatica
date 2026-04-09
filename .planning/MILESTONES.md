# Milestones

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
