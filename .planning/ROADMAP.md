# Roadmap: Agency OS

## Overview

Agency OS transforms a solo operator into a 15+ client marketing agency by building, phase by phase, from a solid data foundation through CLI-powered squad automation, quality gates, and an operational dashboard. The build order follows architectural dependencies: schema and state machine first (everything depends on the data model), then the high-risk CLI orchestrator (validates the core value proposition early), then squad execution and quality gates (close the pipeline loop), then document management and the dashboard (need real data flowing), and finally the feedback loop (requires a complete pipeline cycle to function).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Data Model** - App scaffold, auth, complete DB schema with pipeline state machine enforced at database level
- [x] **Phase 2: Client Management** - Full client CRUD with profile pages, intake onboarding, and archive capability
- [ ] **Phase 3: Pipeline Engine** - Independent client pipeline states with gate-controlled transitions, race condition protection, and process definitions
- [ ] **Phase 4: CLI Orchestrator & Job Queue** - PostgreSQL-backed job queue, CLI process spawning, concurrency-limited worker infrastructure
- [ ] **Phase 5: Squad Execution & Context** - Squad trigger UI, prompt assembly with context injection, structured output parsing with Zod schemas
- [ ] **Phase 6: Quality Gates** - AI pre-review with adversarial prompting, structured verdicts, operator approve/reject workflow
- [ ] **Phase 7: Document Management** - Output storage by client/phase/process, inline viewer, PDF export, raw output preservation
- [ ] **Phase 8: Dashboard & Operational Views** - Kanban pipeline board, bottleneck alerts, pending approvals, real-time updates
- [ ] **Phase 9: Feedback Loop** - Phase 5 insights feed into Phase 1 re-execution, NPS/CLV/churn data surfacing, cycle tracking

## Phase Details

### Phase 1: Foundation & Data Model
**Goal**: A running Next.js application on a self-hosted VPS with Supabase integration, operator authentication, and a complete database schema that enforces the 5-phase sequential pipeline at the PostgreSQL level
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04
**Success Criteria** (what must be TRUE):
  1. Operator can log in with email/password and access the application; unauthenticated users are redirected to login
  2. Database schema exists for clients, phases, processes, quality_gates, squad_jobs, and deliverables with proper relationships
  3. Attempting to advance a client to a non-sequential phase is rejected by a PostgreSQL constraint or trigger (not just application code)
  4. Next.js application runs on a VPS (not serverless) and connects to Supabase for auth, database, and storage
  5. TypeScript types are generated from the database schema and used throughout the application
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Next.js 16 scaffold with Supabase client configuration and operator authentication (auth middleware, login page, protected dashboard)
- [x] 01-02-PLAN.md — Complete PostgreSQL schema (6 tables), phase enforcement trigger, RLS policies, TypeScript domain enums and Zod schemas
- [x] 01-03-PLAN.md — Test infrastructure (Vitest), integration tests for schema and triggers, TypeScript type generation, production build verification

### Phase 2: Client Management
**Goal**: Operator can onboard new clients, view their full context, edit their information, and archive inactive clients
**Depends on**: Phase 1
**Requirements**: CLNT-01, CLNT-02, CLNT-03, CLNT-04
**Success Criteria** (what must be TRUE):
  1. Operator can register a new client with name, company, and initial briefing, and the client automatically starts in Phase 1 (Diagnostico)
  2. Operator can view a client profile page showing current phase, phase history, and all associated outputs
  3. Operator can edit client name, company, and briefing at any time without disrupting the pipeline state
  4. Operator can archive a client, removing it from active views while preserving all data
**Plans:** 2 plans
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md — Foundation + Client Creation: install deps (shadcn/ui, react-hook-form, date-fns, lucide-react), DB migration for atomic create_client_with_phases RPC, briefingSchema, /clients card grid page with archive toggle, /clients/new intake form with Server Action
- [x] 02-02-PLAN.md — Profile, Edit, Archive: /clients/[id] single-page profile (header, briefing, pipeline timeline, outputs placeholder), /clients/[id]/edit pre-populated edit form, archive/restore Server Actions with confirmation dialog

### Phase 3: Pipeline Engine
**Goal**: Each client has an independent pipeline with gate-controlled phase transitions, process-level rework routing, race condition protection, and fully defined process inputs/outputs
**Depends on**: Phase 2
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05
**Success Criteria** (what must be TRUE):
  1. Each client has an independent pipeline state that can be in a different phase from every other client
  2. A client cannot advance to the next phase unless the quality gate for the current phase is approved
  3. When a quality gate fails, the client is routed back to the specific failed process within the phase (not the entire phase)
  4. Concurrent operations on the same client's pipeline (e.g., two rapid transition attempts) do not corrupt state -- row-level locking prevents race conditions
  5. Each of the 16 processes has defined input requirements, execution steps, and output checklists viewable in the app
**Plans:** 2 plans
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md — Static config + test foundation: PROCESS_DEFINITIONS for all 16 processes, shadcn/ui wrappers (accordion, dialog, checkbox), Wave 0 test stubs (processes-config.test.ts, pipeline.test.ts, helpers.ts)
- [ ] 03-02-PLAN.md — DB migrations + Server Actions + UI: create_client_with_phases extended with 16 process rows + 4 gate rows, approve_gate/reject_gate RPCs with SELECT FOR UPDATE, gate Server Actions, PipelineAccordion replacing PipelineTimeline on client profile

### Phase 4: CLI Orchestrator & Job Queue
**Goal**: A reliable infrastructure layer that queues, spawns, monitors, and manages Claude Code CLI processes with concurrency control -- the engine that powers all squad automation
**Depends on**: Phase 3
**Requirements**: SQAD-03, SQAD-08
**Success Criteria** (what must be TRUE):
  1. Squad jobs are queued in a PostgreSQL-backed job queue with atomic claim semantics (FOR UPDATE SKIP LOCKED) -- no job runs twice
  2. Claude Code CLI processes spawn as managed child processes with stdout streaming to the database in real-time
  3. Concurrency is enforced: no more than the configured limit (2-3) of simultaneous CLI sessions run at once; excess jobs wait in the queue
  4. Failed or timed-out CLI sessions are detected, marked with error status, and eligible for retry
**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md — Worker core: PM2 setup, Realtime+polling job loop, CLI spawn with concurrency guard, progress batching, retry with backoff, heartbeat timeout recovery
- [x] 04-02-PLAN.md — Progress UI: process row status badges (running/failed), progress modal with Supabase Realtime subscription, end-to-end verification checkpoint

### Phase 5: Squad Execution & Context
**Goal**: Operator can trigger any of the 4 squads for any process, with the system automatically assembling context and parsing structured outputs -- the core workflow that makes one person manage 15+ clients
**Depends on**: Phase 4
**Requirements**: SQAD-01, SQAD-02, SQAD-04, SQAD-05, SQAD-06, SQAD-07
**Success Criteria** (what must be TRUE):
  1. Operator can click a button in the UI to trigger a squad session for any process, and the correct squad (Estrategia, Planejamento, Growth, or CRM) is automatically selected based on the phase
  2. The system assembles context for the squad run including client briefing, prior phase outputs, and any feedback loop data -- without manual operator input
  3. Operator can preview the fully assembled prompt (context + squad instructions) before confirming the trigger
  4. Squad outputs are parsed into structured data using Zod schemas per process type, with fallback to raw storage when parsing fails
  5. Both parsed structured output and raw CLI output are stored and accessible for every squad run
**Plans:** 3 plans
**UI hint**: yes

Plans:
- [x] 05-01-PLAN.md — Data foundation: DB migration (structured_output JSONB), 16 per-process Zod schemas, schema dispatcher, context assembler with 32K truncation, CLI output parser with two-level JSON deserialization, unit tests
- [x] 05-02-PLAN.md — Prompt templates + backend: 4 squad buildPrompt() functions with verbatim squad identity, worker close handler parse extension, assembleSquadContext + confirmSquadRun Server Actions
- [x] 05-03-PLAN.md — UI layer: RunSquadButton with visibility logic, PromptPreviewModal with truncation warning, StructuredOutputView with View Raw toggle, ProcessAccordionRow extension, client profile page wiring, DB push + end-to-end verification

### Phase 6: Quality Gates
**Goal**: AI pre-reviews squad outputs against methodology checklists using adversarial prompting, produces structured verdicts with evidence, and the operator makes the final judgment call
**Depends on**: Phase 5
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06
**Success Criteria** (what must be TRUE):
  1. Each of the 4 quality gates has a defined checklist derived from the Agency OS methodology that is visible to the operator
  2. When all processes in a phase complete, AI automatically pre-reviews the outputs against the gate checklist
  3. The AI review uses a different evaluation perspective (adversarial prompting) than the generation prompt, preventing rubber-stamp approvals
  4. The gate review produces a structured verdict with pass/fail per checklist item and evidence citations from the actual outputs
  5. Operator sees the full AI review with evidence and makes the final approve or reject decision, with the ability to annotate specific items that need rework on rejection
**Plans:** 3 plans
**UI hint**: yes

Plans:
- [ ] 06-01-PLAN.md — Gate checklists + review foundation: 4 static TypeScript checklist files (verbatim from methodology), getGateChecklist dispatcher, GateReviewVerdictSchema Zod schema, adversarial review prompt builder with distinct auditor persona
- [ ] 06-02-PLAN.md — Backend infrastructure: gate_reviews DB migration, squad_type extension for 'gate_review', runGateReview Server Action, worker verdict parsing extension, supabase db push
- [ ] 06-03-PLAN.md — UI layer: GateReviewDisplay component (verdict badges, evidence, View Raw), GateSection enhancement (checklist display, Run Gate Review button, verdict integration), enhanced reject dialog with AI-suggested rework items

### Phase 7: Document Management
**Goal**: All squad outputs are organized, browsable, and exportable -- the operator can find any deliverable and share it with clients
**Depends on**: Phase 5
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04
**Success Criteria** (what must be TRUE):
  1. All squad outputs are stored and organized by client, phase, and process -- navigable in a clear hierarchy
  2. Operator can view any output document inline in the app without downloading
  3. Operator can export deliverables as PDF for sharing with clients
  4. Raw CLI output is always preserved alongside the parsed/structured version and accessible for debugging
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Dashboard & Operational Views
**Goal**: Operator has a single-screen operational view showing all clients across the pipeline, what needs attention, and what is running -- the command center for managing 15+ clients
**Depends on**: Phase 6, Phase 7
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. A Kanban-style board shows all active clients organized by their current pipeline phase, giving at-a-glance status across all 15+ clients
  2. The Kanban board is display-only -- clients cannot be dragged between phases (transitions only happen through quality gates)
  3. Dashboard displays bottleneck alerts for clients stuck in a phase beyond a configurable time threshold
  4. Dashboard shows a consolidated view of pending approvals, failed gates, and currently running squad sessions
  5. Pipeline status updates appear in real-time via Supabase Realtime without requiring manual page refresh
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Feedback Loop
**Goal**: The system closes the learning loop -- Phase 5 retention insights automatically inform Phase 1 re-execution for returning clients, making each iteration smarter than the last
**Depends on**: Phase 6
**Requirements**: FEED-01, FEED-02, FEED-03
**Success Criteria** (what must be TRUE):
  1. When re-running Phase 1 for a returning client, Phase 5 outputs (Retencao) are automatically available as context in the squad prompt
  2. Specific Phase 5 insights -- NPS data, churn patterns, and CLV metrics -- are surfaced and highlighted during Phase 1 re-execution
  3. The system tracks which feedback loop cycle a client is on (first pass vs. second, third, etc.) and this is visible on the client profile
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Model | 3/3 | Complete | 2026-04-08 |
| 2. Client Management | 2/2 | Complete | 2026-04-08 |
| 3. Pipeline Engine | 0/2 | In progress | - |
| 4. CLI Orchestrator & Job Queue | 0/0 | Not started | - |
| 5. Squad Execution & Context | 0/3 | Not started | - |
| 6. Quality Gates | 0/3 | Not started | - |
| 7. Document Management | 0/0 | Not started | - |
| 8. Dashboard & Operational Views | 0/0 | Not started | - |
| 9. Feedback Loop | 0/0 | Not started | - |
