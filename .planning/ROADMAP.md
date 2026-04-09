# Roadmap: Agency OS

## Milestones

- **v1.0 MVP** — Phases 1-9, 21 plans (shipped 2026-04-09) | [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Production Hardening & Feature Expansion** — Phases 10-15 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-9) — SHIPPED 2026-04-09</summary>

- [x] Phase 1: Foundation & Data Model (3/3 plans) — completed 2026-04-08
- [x] Phase 2: Client Management (2/2 plans) — completed 2026-04-08
- [x] Phase 3: Pipeline Engine (2/2 plans) — completed 2026-04-09
- [x] Phase 4: CLI Orchestrator & Job Queue (2/2 plans) — completed 2026-04-09
- [x] Phase 5: Squad Execution & Context (3/3 plans) — completed 2026-04-09
- [x] Phase 6: Quality Gates (3/3 plans) — completed 2026-04-09
- [x] Phase 7: Document Management (2/2 plans) — completed 2026-04-09
- [x] Phase 8: Dashboard & Operational Views (2/2 plans) — completed 2026-04-09
- [x] Phase 9: Feedback Loop (2/2 plans) — completed 2026-04-09

</details>

### v1.1 Production Hardening & Feature Expansion (In Progress)

- [x] **Phase 10: Tech Debt Cleanup** - Fix tsx dependency, regenerate types, run integration tests, remove dead code (completed 2026-04-09)
- [ ] **Phase 11: Production Deployment** - Deploy Next.js + worker to VPS with PM2, SSL, and health monitoring
- [x] **Phase 12: Cost Tracking** - Token usage per run, monthly client breakdown, budget alerts, dashboard widget (completed 2026-04-09)
- [x] **Phase 13: Notifications** - Email alerts on squad completion, gate failures, and daily digest (completed 2026-04-09)
- [x] **Phase 14: Analytics** - Time per phase, gate pass rates, lifecycle metrics, trend charts (completed 2026-04-09)
- [ ] **Phase 15: Templates** - Save outputs as templates, clone client configs, use templates as prompt context

## Phase Details

### Phase 10: Tech Debt Cleanup
**Goal**: The existing codebase is clean, type-safe, and verified against the live database so that production deployment and feature work can proceed on a solid foundation
**Depends on**: Phase 9 (v1.0 complete)
**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04
**Success Criteria** (what must be TRUE):
  1. Worker process starts successfully via PM2 using tsx without manual workarounds
  2. TypeScript types match the live Supabase schema with zero `as any` casts in application code
  3. Integration tests execute against the live Supabase instance and pass
  4. No orphaned exports or dead code flagged by the codebase audit
**Plans:** 2/2 plans complete
Plans:
- [x] 10-01-PLAN.md — Regenerate TypeScript types from live schema and remove all `as any` casts
- [x] 10-02-PLAN.md — Execute integration tests against live Supabase and fix failures

### Phase 11: Production Deployment
**Goal**: Agency OS runs on a publicly accessible VPS with the Next.js app and worker process both managed, monitored, and secured for real client workloads
**Depends on**: Phase 10
**Requirements**: PROD-01, PROD-02, PROD-03
**Success Criteria** (what must be TRUE):
  1. Operator can access Agency OS via a custom domain with valid SSL certificate in a browser
  2. Next.js application serves pages and handles Server Actions in production mode under PM2
  3. Worker process polls for jobs, executes Claude CLI squad runs, and writes results to Supabase in production
  4. If the worker or app crashes, PM2 restarts it automatically and health status is visible
**Plans**: TBD

### Phase 12: Cost Tracking
**Goal**: Operator has full visibility into AI spend per run, per client, and per month so they can manage operational costs across 15+ clients
**Depends on**: Phase 11
**Requirements**: COST-01, COST-02, COST-03, COST-04
**Success Criteria** (what must be TRUE):
  1. After a squad run completes, the operator can see estimated token count and dollar cost on the run details
  2. Operator can open a monthly cost breakdown page showing total spend per client with sortable columns
  3. Operator can set a token budget per process, and the UI shows a visual warning when a run approaches or exceeds that budget
  4. The main dashboard displays a monthly cost summary widget showing total spend and the top-spending clients
**Plans:** 4/4 plans complete
Plans:
- [x] 12-01-PLAN.md — Database migration, token parser module, worker integration for cost capture
- [x] 12-02-PLAN.md — Cost breakdown page, dashboard widget, run cost badges, budget system UI
**UI hint**: yes

### Phase 13: Notifications
**Goal**: Operator receives timely email alerts for critical pipeline events so they can respond without constantly checking the dashboard
**Depends on**: Phase 11
**Requirements**: NOTF-01, NOTF-02, NOTF-03
**Success Criteria** (what must be TRUE):
  1. When a squad run completes (success or failure), the operator receives an email within minutes containing the run status and client name
  2. When a quality gate review produces a FAIL or PARTIAL verdict, the operator receives an email with the verdict summary and affected client
  3. Every morning, the operator receives a daily digest email summarizing pipeline status: phase progress, pending approvals, and stuck clients across all accounts
**Plans**: TBD

### Phase 14: Analytics
**Goal**: Operator can analyze operational performance with metrics and trend charts to identify bottlenecks and improve throughput across the client portfolio
**Depends on**: Phase 11
**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04
**Success Criteria** (what must be TRUE):
  1. Operator can view average time spent per phase across all clients on a dedicated analytics page
  2. Operator can view the first-pass gate approval rate per phase to identify which phases cause the most rework
  3. Operator can view client lifecycle metrics showing average time from intake to Phase 5 completion
  4. Analytics page renders trend charts (line or bar) for key metrics with configurable time period filters
**Plans:** 2/2 plans complete
Plans:
- [x] 14-01-PLAN.md — Analytics data layer: types, Supabase queries, aggregation utilities, unit tests, Recharts dependency
- [x] 14-02-PLAN.md — Analytics UI: /analytics page with chart components, date range filter, header navigation
**UI hint**: yes

### Phase 15: Templates
**Goal**: Operator can capture and reuse successful work patterns to accelerate onboarding and improve consistency across similar clients
**Depends on**: Phase 11
**Requirements**: TMPL-01, TMPL-02, TMPL-03
**Success Criteria** (what must be TRUE):
  1. Operator can save any successful squad output as a named template from the output viewer
  2. Operator can clone an existing client's configuration (briefing and process settings) to create a new client pre-filled with that data
  3. When triggering a squad run, operator can optionally select a template that gets included as reference context in the assembled prompt
**Plans:** 1/2 plans executed
Plans:
- [x] 15-01-PLAN.md — Verify migration applied, update test cleanup, integration tests for template CRUD and clone client
- [ ] 15-02-PLAN.md — Templates management page, OutputViewer Save-as-Template wiring, dashboard nav link
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 10 -> 11 -> 12 -> 13 -> 14 -> 15
Phases 12, 13, 14 all depend on 11 but are sequenced for data accumulation benefit.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Data Model | v1.0 | 3/3 | Complete | 2026-04-08 |
| 2. Client Management | v1.0 | 2/2 | Complete | 2026-04-08 |
| 3. Pipeline Engine | v1.0 | 2/2 | Complete | 2026-04-09 |
| 4. CLI Orchestrator & Job Queue | v1.0 | 2/2 | Complete | 2026-04-09 |
| 5. Squad Execution & Context | v1.0 | 3/3 | Complete | 2026-04-09 |
| 6. Quality Gates | v1.0 | 3/3 | Complete | 2026-04-09 |
| 7. Document Management | v1.0 | 2/2 | Complete | 2026-04-09 |
| 8. Dashboard & Operational Views | v1.0 | 2/2 | Complete | 2026-04-09 |
| 9. Feedback Loop | v1.0 | 2/2 | Complete | 2026-04-09 |
| 10. Tech Debt Cleanup | v1.1 | 2/2 | Complete   | 2026-04-09 |
| 11. Production Deployment | v1.1 | 0/0 | Not started | - |
| 12. Cost Tracking | v1.1 | 4/4 | Complete   | 2026-04-09 |
| 13. Notifications | v1.1 | 2/2 | Complete   | 2026-04-09 |
| 14. Analytics | v1.1 | 2/2 | Complete   | 2026-04-09 |
| 15. Templates | v1.1 | 1/2 | In Progress|  |
