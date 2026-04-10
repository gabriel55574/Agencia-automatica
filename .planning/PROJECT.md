# Agency OS

## What This Is

A web application (Next.js + Supabase) that serves as the operating system for a solo-operated marketing agency. It manages 15+ clients through a standardized 5-phase marketing pipeline (Diagnostico, Engenharia de Valor, Go-to-Market, Tracao e Vendas, Retencao e Escala) with Claude Code CLI-powered squad automations executing the 16 processes. The operator triggers squads via the app, previews assembled prompts, AI pre-reviews quality gate checklists with adversarial prompting, and the operator makes the final approval decisions. A Kanban dashboard provides real-time operational awareness across all clients.

## Core Value

One person manages 15+ clients at agency quality by combining a standardized marketing process with AI-powered squad automation — the system enforces consistency, Claude does the heavy lifting, the operator makes the judgment calls.

## Current State

**Shipped:** v1.1 Production Hardening & Feature Expansion (2026-04-09)
**In progress:** v1.2 UI/UX Overhaul — Phase 16 complete (Brand Identity & Sidebar Layout)
**Codebase:** ~14,200 lines TypeScript across 187 commits
**Tech stack:** Next.js 16.2, Supabase (Postgres, Auth, Realtime, Storage), Claude Code CLI, Vitest, Recharts, Resend, @react-pdf/renderer

### What v1.1 Delivers

- Tech debt cleanup: tsx restored, types auto-generated from live schema, zero `as any` casts, 291 tests passing
- Cost tracking: token usage per squad run, monthly /costs breakdown by client, per-process budget alerts, dashboard cost widget
- Email notifications: Resend integration, squad completion/failure emails, gate failure alerts, daily digest via node-cron
- Analytics dashboard: /analytics page with Recharts charts — phase duration, gate approval rates, client lifecycle, monthly trends with date range filter
- Templates: save squad outputs as named templates, clone client configs, inject templates as reference context in prompts, /templates management page

### What v1.0 Delivers

- Operator authentication with Supabase Auth
- Client management (create, view, edit, archive) with automatic Phase 1 initialization
- 5-phase sequential pipeline enforced at PostgreSQL level (triggers, not just app code)
- 16 process definitions with inputs, steps, and checklists from Agency OS methodology
- Gate-controlled transitions with race condition protection (SELECT FOR UPDATE)
- Claude CLI worker with concurrency guard (max 2), retry, heartbeat, PM2 management
- Squad trigger UI with context assembly (briefing + prior outputs + feedback), prompt preview, confirm & run
- 16 Zod schemas for structured output parsing with raw fallback
- 4 quality gate checklists (23 items from methodology), adversarial AI pre-review, structured verdicts
- Operator approve/reject with AI-suggested rework items
- Outputs browsing by client/phase/process, inline viewer (structured + raw tabs), PDF export
- 5-column Kanban dashboard with bottleneck alerts, action panel, Supabase Realtime updates
- Feedback loop: Phase 5 insights (NPS/CLV/churn) feed into Phase 1 re-execution, cycle tracking

### Known Tech Debt (from v1.0 audit)

- tsx missing from package.json devDependencies (worker can't start — fix: `npm install --save-dev tsx`)
- Hand-generated TypeScript types need regeneration via `supabase gen types`
- Integration tests written but never executed against live Supabase
- `(admin as any)` type casts in gate-review.ts (resolves after type regeneration)
- Orphaned ProcessRow export (dead code, cosmetic)

## Requirements

### Validated

- FOUN-01: Operator login with email/password — v1.0
- FOUN-02: 5-phase sequential pipeline per client — v1.0
- FOUN-03: Pipeline state machine enforced at database level — v1.0
- FOUN-04: Next.js + Supabase on self-hosted VPS — v1.0
- CLNT-01: Client registration with briefing — v1.0
- CLNT-02: Client profile with phase history and outputs — v1.0
- CLNT-03: Edit client info without disrupting pipeline — v1.0
- CLNT-04: Archive/restore client — v1.0
- PIPE-01: Independent pipeline state per client — v1.0
- PIPE-02: Gate-controlled phase transitions — v1.0
- PIPE-03: Gate rejection routes to specific failed process — v1.0
- PIPE-04: Race condition protection with row-level locking — v1.0
- PIPE-05: 16 process definitions with inputs/steps/checklist — v1.0
- SQAD-01: Trigger squad via UI button click — v1.0
- SQAD-02: Auto-assemble context (briefing + prior outputs + feedback) — v1.0
- SQAD-03: CLI child processes via PostgreSQL job queue — v1.0
- SQAD-04: 4 specialized squad prompts — v1.0
- SQAD-05: Structured output parsing + raw storage — v1.0
- SQAD-06: Zod schema per process with fallback — v1.0
- SQAD-07: Preview assembled prompt before triggering — v1.0
- SQAD-08: Concurrency limits (max 2 simultaneous) — v1.0
- GATE-01: 4 gate checklists from methodology — v1.0
- GATE-02: AI pre-review when operator triggers (all processes complete) — v1.0
- GATE-03: Adversarial prompting for gate reviews — v1.0
- GATE-04: Structured verdict with evidence citations — v1.0
- GATE-05: Operator final approve/reject decision — v1.0
- GATE-06: Annotate rework items on rejection — v1.0
- DOCS-01: Outputs organized by client/phase/process — v1.0
- DOCS-02: Inline viewer without downloading — v1.0
- DOCS-03: PDF export for client sharing — v1.0
- DOCS-04: Raw output preserved alongside structured — v1.0
- DASH-01: Kanban board by pipeline phase — v1.0
- DASH-02: Display-only board (no drag between phases) — v1.0
- DASH-03: Bottleneck alerts for stuck clients — v1.0
- DASH-04: Pending approvals, failed gates, running jobs — v1.0
- DASH-05: Realtime updates via Supabase — v1.0
- FEED-01: Phase 5 outputs as context in Phase 1 re-run — v1.0
- FEED-02: NPS/CLV/churn surfaced in Phase 1 — v1.0
- FEED-03: Cycle tracking visible on client profile — v1.0

### Active

- [ ] Traducao completa para PT-BR (~45 componentes)
- [x] Sidebar com navegacao completa substituindo header fino — Validated in Phase 16: Brand Identity & Sidebar Layout
- [ ] Cores por fase no Kanban e pipeline (5 fases distintas)
- [ ] Breadcrumbs em paginas internas
- [ ] Loading states (skeleton screens) em todas as rotas
- [ ] Empty states com ilustracoes e CTAs claros
- [ ] Tabs no client profile (Pipeline / Outputs / Briefing)
- [ ] Busca global de clientes
- [ ] Toast feedback apos acoes (criar/editar/deletar/arquivar)
- [ ] Identidade visual (logo, cor de marca, hierarquia tipografica)

## Current Milestone: v1.2 UI/UX Overhaul

**Goal:** Transformar o frontend de wireframe funcional em interface operacional profissional — traduzida para PT-BR, com navegacao completa, identidade visual, e UX otimizada para operador solo gerenciando 15+ clientes.

**Target features:**
- Traducao completa para PT-BR (todos os ~45 componentes de UI)
- Sidebar com navegacao completa (Dashboard, Clientes, Custos, Analytics, Templates)
- Cores por fase no Kanban e pipeline (5 fases = 5 cores distintas)
- Breadcrumbs em todas as paginas internas
- Loading states (skeleton screens) em todas as rotas
- Empty states com ilustracoes e CTAs claros
- Tabs no client profile (Pipeline / Outputs / Briefing)
- Busca global de clientes
- Toast feedback apos todas as acoes (criar/editar/deletar/arquivar)
- Identidade visual (logo, cor de marca, hierarquia tipografica)

### Out of Scope

- Team collaboration / multi-user — solo operator only
- Client-facing portal — clients don't log in; operator shares exports manually
- Custom process builder — the 5-phase/16-process framework is fixed
- Real-time chat/messaging — communication happens outside the system
- Payment/billing — invoicing handled externally
- Mobile app — web-first, responsive is sufficient
- Drag-and-drop Kanban — phase transitions must go through quality gates
- Claude API integration — using Claude Code CLI exclusively

## Context

The system is based on a documented Agency OS methodology (see `docs/agency-os-prompt.md`) grounded in Kotler, Hormozi, Dunford, Ries & Trout, Weinberg, and Kleon.

The 4 squads map to specialized Claude Code sessions:
- **Squad Estrategia** (Phases 1-2): Market research, segmentation, positioning, offers, pricing, branding
- **Squad Planejamento** (Phase 3): G-STIC planning, channels, retail, logistics, cause marketing
- **Squad Growth** (Phase 4): Creative production, IMC, Bullseye framework, sales funnel
- **Squad CRM** (Phase 5): CLV, NPS, retention automation, loyalty programs

v1.0 was built in 2 days (April 8-9, 2026) with 9 phases executed autonomously. The codebase is ~9,000 LOC TypeScript with 170+ unit tests passing and zero TypeScript compilation errors.

## Constraints

- **Tech Stack**: Next.js + Supabase + Claude Code CLI — already decided
- **Scale**: Must handle 15+ concurrent clients from launch
- **Solo Operator**: All UX optimized for one person managing everything
- **Process Fidelity**: The 5-phase/16-process/4-gate structure is non-negotiable — it IS the product
- **Claude Code CLI**: Squad automations run via CLI triggers, not API calls

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Supabase | Solo operator needs fast development, BaaS reduces infra burden | Good — shipped v1.0 in 2 days |
| Claude Code CLI over API | Complex multi-step squad processes benefit from CLI agent capabilities | Good — worker infrastructure works, output parsing reliable |
| AI pre-review for quality gates | Operator can't manually review all outputs for 15+ clients | Good — adversarial prompting prevents rubber-stamping |
| Kanban pipeline + alerts dashboard | Solo operator needs at-a-glance status across all clients | Good — Realtime updates, action panel, bottleneck alerts |
| PostgreSQL job queue over BullMQ+Redis | Simpler infrastructure for v1 scale, one fewer service | Good — claim_next_job with FOR UPDATE SKIP LOCKED works |
| Self-hosted VPS (not serverless) | CLI processes need persistent worker process | Pending — not yet deployed to VPS |
| Operator-triggered gate review (not auto) | Operator controls when expensive CLI calls run | Good — preserves agency over automation |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-09 after v1.2 milestone start*
