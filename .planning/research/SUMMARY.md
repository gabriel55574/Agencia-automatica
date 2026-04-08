# Project Research Summary

**Project:** Agency OS - AI-Powered Marketing Agency Management Platform
**Domain:** Solo-operator marketing agency management with AI squad execution
**Researched:** 2026-04-08
**Confidence:** MEDIUM

## Executive Summary

Agency OS is a purpose-built operating system for a solo operator managing 15+ marketing clients through a fixed 5-phase, 16-process, 4-quality-gate pipeline. The system is not a generic project management tool. It is an orchestration layer that connects a Next.js web dashboard with Claude Code CLI as the AI execution engine, using Supabase as the data backbone. Experts building similar systems (agency management + AI automation) converge on a three-tier architecture: a web application for visualization and control, a database layer for state enforcement, and a background worker for long-running AI processes. The critical architectural constraint is that Claude Code CLI must run as a child process on the server, which rules out serverless deployment entirely.

The recommended approach is a self-hosted Next.js application on a single VPS, with Supabase Cloud for database/auth/storage/realtime, and a database-backed job queue for orchestrating Claude CLI sessions. XState models the client pipeline as a formal state machine with guarded transitions, and PostgreSQL triggers enforce phase sequencing at the database level. This dual enforcement (application + database) prevents the most dangerous pitfall: pipeline state corruption under concurrent operations. The stack is deliberately kept simple -- no Redis, no microservices, no message brokers for v1. A PostgreSQL-backed job queue with polling handles the modest throughput (roughly 20 jobs per day for 15 clients).

The top risks are: (1) serverless deployment attempting to spawn CLI processes that timeout, (2) pipeline state corruption from concurrent operations without database-level enforcement, (3) Claude CLI output parsing breaking silently due to LLM output variability, and (4) uncontrolled AI costs escalating with client count. All four are preventable with upfront architectural decisions in the foundation phase. The biggest product risk is quality gates becoming a rubber stamp because the same AI model generates and reviews outputs -- this requires using adversarial prompting or a different model for review.

## Key Findings

### Recommended Stack

The stack centers on Next.js 16 (App Router, React Server Components, Server Actions) with Supabase as the backend-as-a-service and XState v5 for pipeline state management. This combination gives a solo developer the most leverage: Server Components reduce client-side JavaScript for the dashboard-heavy UI, Server Actions eliminate the need for manual API endpoint creation, and Supabase provides database, auth, realtime subscriptions, and file storage in a single managed service. BullMQ + Redis is listed as the original recommendation for job queuing, but the architecture research makes a strong case for a simpler PostgreSQL-backed queue in the `squad_jobs` table, eliminating an infrastructure dependency.

**Core technologies:**
- **Next.js 16.2 (App Router):** Full-stack framework -- Turbopack, RSC for dashboards, Server Actions for mutations, PPR for fast loads
- **Supabase (Cloud):** Database (PostgreSQL), Auth, Storage, Realtime subscriptions -- single managed service replaces 4+ tools
- **XState v5:** Pipeline state machine -- enforces sequential phases, guarded quality gate transitions, persistence via snapshot serialization
- **TypeScript 5.x:** Non-negotiable for a system with 16 processes, 5 phases, 4 squads, and complex state transitions
- **shadcn/ui + Tailwind CSS v4:** UI layer -- copy-paste components with full control, zero-config styling
- **Zod:** Schema validation at every boundary -- intake forms, CLI output parsing, gate checklists, database writes
- **@hello-pangea/dnd:** Kanban drag-and-drop for the multi-client dashboard (display only, not for phase transitions)

**Architecture-critical decision: BullMQ vs. PostgreSQL queue.** The STACK research recommends BullMQ + Redis for job queuing. The ARCHITECTURE research argues convincingly that a PostgreSQL-backed queue (using `FOR UPDATE SKIP LOCKED`) eliminates the Redis dependency while providing persistence, queryability, and free Realtime integration. At 15 clients with sequential processing (~20 jobs/day), throughput is not an issue. **Recommendation: Start with the PostgreSQL queue. Add BullMQ + Redis only if job volume exceeds what polling can handle.**

### Expected Features

**Must have (table stakes) -- system is unusable without these:**
- T1: Multi-client Kanban pipeline board -- all 15+ clients visible at a glance
- T2: Client intake/onboarding form -- entry point for every client
- T3: Phase state machine with sequential enforcement -- the methodology backbone
- T4: Squad trigger buttons (Claude Code CLI execution) -- the killer feature
- T5: Process output storage per client/phase/process -- where all deliverables live
- T6: Quality gate checklists with AI pre-review -- enables managing 15+ clients
- T7: Operator approval workflow (approve/reject gates) -- closes the quality loop
- T8: Document viewer/deliverable browser -- operator must review AI outputs
- T9: Bottleneck alerts -- surface stuck clients, failed gates, pending approvals
- T10: Basic client profile/context page -- quick client status overview

**Should have (differentiators that justify the system over manual Claude sessions):**
- D1: Intelligent context injection for squads -- auto-assembles prior outputs + briefing
- D2: AI pre-review with reasoning chains -- evidence-based gate evaluation
- D4: Process-level progress tracking -- granular 16-step visibility
- D6: Smart dashboard with health scoring -- prioritizes which clients need attention
- D10: Prompt preview/customization -- transparency before squad execution

**Defer to v2+:**
- D3: Feedback loop automation (Phase 5 to Phase 1) -- design schema now, build later
- D5: Execution history + output diffing -- useful after months of operation
- D7: One-click export packages -- nice-to-have, not blocking core workflow
- D8: Batch operations across clients -- optimization for later
- D9: Gate analytics/methodology insights -- needs 10+ clients through full pipeline

### Architecture Approach

The system follows a three-tier architecture: (1) Next.js web application for UI, API, and server actions; (2) Supabase for all persistent state, auth, storage, and realtime push; (3) a CLI Orchestrator that manages Claude Code CLI process lifecycles. The Orchestrator is the most architecturally critical component -- it queues jobs, spawns CLI processes, streams output to the database, and parses structured results. All communication between the browser and CLI processes goes through the database (never direct), so closing the browser does not interrupt running jobs.

**Major components:**
1. **Web Application (Next.js App Router)** -- UI rendering, API endpoints, server actions. No business logic about marketing processes lives here.
2. **Database Layer (Supabase PostgreSQL)** -- Single source of truth for pipeline state. Phase transitions enforced at DB level via constraints and triggers. Schema: `clients -> phases -> processes -> quality_gates -> squad_jobs -> deliverables`.
3. **CLI Orchestrator** -- Job queue polling, CLI spawn/monitor/parse, progress streaming. Runs in the same Node.js process as Next.js on a VPS.
4. **File Storage (Supabase Storage)** -- Deliverables organized by `{client_id}/phase-{n}/processo-{n}-output.md`. Metadata in PostgreSQL, binaries in Storage.
5. **Realtime Layer (Supabase Realtime)** -- WebSocket push for job progress, phase transitions, new alerts. Single subscription per table, not per client.

**Deployment: Self-hosted on a single VPS (4GB+ RAM, 2+ vCPU).** Managed by PM2. Supabase Cloud handles the managed services. For MVP, running on the operator's local machine is viable (zero hosting cost, CLI already installed).

### Critical Pitfalls

The 5 most dangerous pitfalls, ranked by potential for damage:

1. **Serverless CLI timeout (Pitfall 1)** -- Deploying to Vercel or any serverless platform will silently kill Claude CLI sessions that exceed the function timeout. **Prevention:** Self-host on a VPS. Use a persistent worker process with a job queue. Never spawn CLI from an API route directly.

2. **Pipeline state corruption (Pitfall 2)** -- Concurrent operations (15+ clients, rapid-fire triggers) can create race conditions where clients skip quality gates. **Prevention:** Enforce state transitions in PostgreSQL with `SELECT ... FOR UPDATE`, valid transition table, processing locks, and an audit log of every transition.

3. **CLI output parsing breaks silently (Pitfall 3)** -- LLM outputs are probabilistic. Claude adds preambles, changes JSON key names, wraps output differently. Parser fails and stores null. **Prevention:** Multi-layer extraction (JSON fences, then regex, then raw fallback). Always store raw output. Validate against Zod schemas. Flag outputs with low parse scores.

4. **Uncontrolled AI costs (Pitfall 4)** -- 15 clients x 16 processes x retries = hundreds of sessions/month at 50K-200K tokens each. **Prevention:** Track token usage per session, set per-client budgets, use `--max-turns` limits, optimize prompts (per-process slices, not full 460-line prompt), and implement a cost dashboard.

5. **Quality gate rubber stamp (Pitfall 6)** -- Same AI generates and reviews outputs, leading to 100% pass rates. **Prevention:** Use a different model or adversarial prompting for reviews. Require specific evidence citations. Score 1-5 per item instead of pass/fail. Track operator overrides to calibrate.

## Implications for Roadmap

Based on combined research across all four dimensions, the build order is dictated by clear architectural dependencies. You cannot build UI without data, cannot test squads without the job queue, cannot test gates without squad outputs.

### Phase 1: Foundation and Data Model
**Rationale:** Everything depends on the database schema, Supabase setup, and Next.js scaffold. The architecture research identifies this as Layer 0 + Layer 1. The pitfalls research identifies 5 foundation-phase warnings (CLI version drift, RLS, language conventions, structured output schemas, feedback loop schema).
**Delivers:** Supabase project with complete schema (clients, phases, processes, quality_gates, squad_jobs, deliverables), RLS policies, database triggers for phase sequence enforcement, Next.js project scaffold with Supabase client configuration, TypeScript types generated from schema.
**Addresses:** T2 (Client Intake), T3 (Phase State Machine -- database layer), T10 (Client Profile)
**Avoids:** Pitfall 2 (state corruption -- DB-level enforcement from day one), Pitfall 8 (unstructured blobs -- JSON schemas for all 16 processes defined upfront), Pitfall 11 (feedback loop schema placeholder), Pitfall 13 (language convention established), Pitfall 14 (RLS enabled immediately)

### Phase 2: CLI Orchestrator and Squad Execution
**Rationale:** This is the hardest integration and the core value proposition. The architecture research places it at Layer 2 and warns it is "the most architecturally critical component." Building this early validates the entire system's feasibility.
**Delivers:** PostgreSQL-backed job queue with atomic claiming, CLI wrapper with version validation, process spawner with stdout streaming, structured output parser with multi-layer extraction, squad prompt templates for all 4 squads, progress streaming to database.
**Addresses:** T4 (Squad Triggers), T5 (Process Output Storage), D1 (Context Injection -- built alongside squad triggers)
**Avoids:** Pitfall 1 (serverless timeout -- proper worker architecture), Pitfall 3 (output parsing -- multi-layer extraction + raw storage), Pitfall 7 (no retry -- job states with retry logic), Pitfall 10 (CLI drift -- wrapper abstraction)

### Phase 3: Quality Gates and Operator Workflow
**Rationale:** Quality gates require squad outputs to exist (dependency on Phase 2). This phase closes the pipeline loop: trigger squad, review output, approve/reject, advance or rework. The pitfalls research warns strongly about the rubber stamp problem.
**Delivers:** AI gate evaluation via CLI with adversarial prompting, checklist UI with scoring (1-5, not pass/fail), evidence citations per checklist item, approve/reject workflow with rework routing, operator notes and override tracking.
**Addresses:** T6 (Quality Gate AI Review), T7 (Operator Approval), D2 (AI Reasoning Chains)
**Avoids:** Pitfall 6 (rubber stamp -- different model/prompt for review, scoring system, evidence requirement)

### Phase 4: Dashboard and Operational Views
**Rationale:** Now that data flows through the system (clients created, squads executed, outputs stored, gates evaluated), the dashboard has real data to display. The pitfalls research emphasizes building an action queue as the primary view, not just a Kanban.
**Delivers:** Multi-client Kanban board, action queue (prioritized operator to-do list), real-time updates via Supabase Realtime (centralized subscription manager), bottleneck alerts (time-in-phase, failed gates, pending approvals), health scoring per client, document viewer for deliverables.
**Addresses:** T1 (Kanban Board), T8 (Document Viewer), T9 (Bottleneck Alerts), D4 (Process-level Tracking), D6 (Health Scoring)
**Avoids:** Pitfall 5 (subscription leaks -- centralized manager, single table subscription), Pitfall 9 (overview-only dashboard -- action queue as primary interface)

### Phase 5: Polish, Export, and Feedback Loop
**Rationale:** These features enhance an already-functioning system. Export packages require structured outputs (Phase 1 schema) and stored deliverables (Phase 2). Feedback loop requires Phase 5 outputs to exist in practice, but the schema was prepared in Phase 1.
**Delivers:** PDF export packages from deliverables (branded, table of contents), prompt preview/customization before squad execution, cost tracking dashboard, feedback loop automation (Phase 5 insights to Phase 1 context), execution history with output diffing.
**Addresses:** D3 (Feedback Loop), D5 (Execution History), D7 (Export Packages), D10 (Prompt Preview)
**Avoids:** Pitfall 4 (cost explosion -- cost tracking dashboard), Pitfall 12 (export afterthought -- schema already export-aware from Phase 1)

### Phase Ordering Rationale

- **Schema before code:** Defining JSON schemas for all 16 processes, establishing language conventions, enabling RLS, and designing for the feedback loop costs almost nothing upfront but prevents 3-4 pitfalls that require painful schema migrations to fix later.
- **CLI Orchestrator before UI:** The CLI integration is the highest-risk component and the core value proposition. If it does not work reliably, no amount of dashboard polish matters. Validating it early de-risks the entire project.
- **Quality gates before dashboard:** Gates close the pipeline loop and validate the methodology works end-to-end. A beautiful dashboard showing broken gate data is worse than a basic UI showing accurate data.
- **Action queue as primary view:** The pitfalls research is clear that a Kanban-only dashboard fails at 15+ clients. The action queue (what needs attention now?) is the operator's primary interface; the Kanban provides context.
- **PostgreSQL queue over BullMQ:** Eliminating Redis simplifies infrastructure. The architecture research makes a convincing case that at 15-client scale, PostgreSQL polling is sufficient. BullMQ can be added later if needed.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (CLI Orchestrator):** Claude Code CLI flags, output format behavior, `--print` mode specifics, and `--max-turns` behavior need live verification. Training data may not reflect current CLI version. The CLI wrapper must be tested against the actual installed version.
- **Phase 3 (Quality Gates):** Adversarial prompting strategies for self-review need experimentation. No established pattern exists for "AI reviews its own output" in production agency workflows. This requires iterative prompt engineering.

Phases with standard patterns (skip deep research):
- **Phase 1 (Foundation):** Supabase schema design, Next.js App Router setup, RLS policies, and TypeScript types generation are all well-documented with established patterns.
- **Phase 4 (Dashboard):** Kanban boards with shadcn/ui + @hello-pangea/dnd, Supabase Realtime subscriptions, and React Server Components for data-heavy views are all well-documented patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Next.js 16.2 verified via official blog. Core libraries (Supabase, XState, Zod) are stable and well-established. Exact versions of some packages (Tailwind v4, BullMQ v5, Zod v3 vs v4) need verification at install time. |
| Features | MEDIUM | Feature landscape derived from established agency tools (Monday.com, ClickUp, Productive.io) + the project's own methodology doc. Could not verify current (2026) AI-native competitor features. Differentiator analysis may underestimate market. |
| Architecture | MEDIUM-HIGH | Three-tier pattern is well-established. PostgreSQL job queue with FOR UPDATE SKIP LOCKED is a proven pattern. Self-hosting requirement is a logical certainty. Specific Supabase Realtime connection limits not verified. |
| Pitfalls | MEDIUM-HIGH | Pitfalls derived from deep familiarity with all constituent technologies. Serverless CLI timeout, state corruption, and LLM output variability are well-documented problems. Claude Code CLI-specific pitfalls (version drift, flag changes) could not be verified against latest CLI docs. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Claude Code CLI current flags and behavior:** Could not access CLI documentation to verify `--print`, `--output-format json`, `--system-prompt`, and `--max-turns` flags. Must verify against installed CLI version before Phase 2 implementation.
- **Supabase Realtime connection limits:** Could not verify current limits for the free/pro tier. Must confirm that 5+ simultaneous channel subscriptions are supported.
- **Exact library versions:** Several packages flagged as MEDIUM confidence on version. Run `npm info [package] version` for XState, BullMQ, Zod, Tailwind CSS, and @supabase/supabase-js before starting development.
- **AI cost estimation:** No concrete per-session token cost data available. Must measure actual token consumption during Phase 2 development with real squad prompts and client context to build a viable cost model.
- **Competitor landscape (2026):** Could not verify current state of AI-powered agency tools. Differentiator features (D1-D10) may already exist in competing products. Validate market positioning when web search is available.
- **Prompt management:** STACK research stores prompts in `/prompts/` (version-controlled code). PITFALLS research (Pitfall 15) argues for database-stored prompts with versioning and admin UI for easier iteration. **Recommendation:** Start with file-based prompts in code, migrate to database-stored prompts in Phase 5 if prompt iteration velocity demands it.

## Sources

### Primary (HIGH confidence)
- Next.js 16.2 release blog (nextjs.org/blog, March 2026) -- framework version and features
- Agency OS methodology document (`docs/agency-os-prompt.md`) -- pipeline definition, process specs, quality gate checklists
- PROJECT.md -- system requirements, constraints, scope boundaries
- Node.js child_process.spawn API -- stable core API, unchanged for years
- PostgreSQL FOR UPDATE SKIP LOCKED -- standard feature since v9.5

### Secondary (MEDIUM confidence)
- Supabase documentation (supabase.com/docs) -- could not access, used training data
- XState v5 documentation (stately.ai/docs) -- could not access, used training data
- Claude Code CLI documentation (docs.anthropic.com) -- could not access, CLI flags unverified
- Agency management platform feature analysis (Monday.com, ClickUp, Productive.io, Function Point) -- based on training data, not live verification
- AI-native tool analysis (Jasper, Lindy.ai, Copy.ai workflows) -- based on training data

### Tertiary (LOW confidence)
- Exact package versions for Tailwind v4, BullMQ v5, Zod v3/v4, @supabase/supabase-js v2/v3 -- based on training data with May 2025 cutoff, must verify at install time
- Claude Code CLI token consumption estimates -- inferred, not measured
- Supabase Realtime connection limits -- inferred from training data

---
*Research completed: 2026-04-08*
*Ready for roadmap: yes*
