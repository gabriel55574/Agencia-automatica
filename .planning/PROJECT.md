# Agency OS

## What This Is

A web application (Next.js + Supabase) that serves as the operating system for a solo-operated marketing agency. It manages 15+ clients through a standardized 5-phase marketing pipeline (Diagnostico, Engenharia de Valor, Go-to-Market, Tracao e Vendas, Retencao e Escala) with Claude Code CLI-powered squad automations executing the 16 processes. The operator triggers phases via the app, AI pre-reviews quality gate checklists, and the operator makes the final approval decisions.

## Core Value

One person manages 15+ clients at agency quality by combining a standardized marketing process with AI-powered squad automation — the system enforces consistency, Claude does the heavy lifting, the operator makes the judgment calls.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-client pipeline dashboard (Kanban-style board showing client phases + smart alerts for stuck/failing clients)
- [ ] Client intake and onboarding (register new client, capture briefing, start Phase 1)
- [ ] 5-phase pipeline engine (enforce sequential phases, no skipping, track state per client)
- [ ] 16 process execution via Claude Code CLI (trigger squad sessions from the app, store outputs)
- [ ] 4 quality gates with AI pre-review (Claude evaluates outputs against checklists, flags issues, operator approves/rejects)
- [ ] Squad system integration (Strategy, Planning, Growth, CRM squads triggered by phase)
- [ ] Document/deliverable storage per client per phase (reports, analysis, offer stacks, plans)
- [ ] Export capability (share deliverables with clients, PDF/Doc export)
- [ ] Feedback loop (Phase 5 insights feed back into Phase 1 for returning clients)
- [ ] Bottleneck alerts and notifications (clients stuck too long, failed gates, pending approvals)

### Out of Scope

- Team collaboration features — solo operator only, no multi-user auth/roles for v1
- Client-facing portal — clients don't log in; operator shares exports manually
- Real-time chat or messaging — communication happens outside the system
- Payment/billing integration — invoicing handled externally
- Mobile app — web-first, responsive is sufficient
- Custom process builder — the 5-phase/16-process framework is fixed per the Agency OS methodology

## Context

The system is based on a documented Agency OS methodology (see `docs/agency-os-prompt.md`) grounded in Kotler (Marketing Management), Hormozi ($100M Offers), Dunford (Obviously Awesome), Ries & Trout (Positioning), Weinberg (Traction), and Kleon (Steal Like an Artist).

The 4 squads map to specialized Claude Code sessions:
- **Squad Estrategia** (Phases 1-2): Market research, segmentation, positioning, offers, pricing, branding
- **Squad Planejamento** (Phase 3): G-STIC planning, channels, retail, logistics, cause marketing
- **Squad Growth** (Phase 4): Creative production, IMC, Bullseye framework, sales funnel
- **Squad CRM** (Phase 5): CLV, NPS, retention automation, loyalty programs

Each squad is triggered via button click in the app, which spawns a Claude Code CLI session with the appropriate squad prompt and client context. Outputs are parsed and stored in Supabase.

Tech stack: Next.js (frontend + API routes), Supabase (database, auth, storage), Claude Code CLI (squad execution).

## Constraints

- **Tech Stack**: Next.js + Supabase + Claude Code CLI — already decided
- **Scale**: Must handle 15+ concurrent clients from launch
- **Solo Operator**: All UX optimized for one person managing everything
- **Process Fidelity**: The 5-phase/16-process/4-gate structure is non-negotiable — it IS the product
- **Claude Code CLI**: Squad automations run via CLI triggers, not API calls

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Supabase | Solo operator needs fast development, BaaS reduces infra burden | -- Pending |
| Claude Code CLI over API | Complex multi-step squad processes benefit from CLI agent capabilities | -- Pending |
| AI pre-review for quality gates | Operator can't manually review all 16 process outputs for 15+ clients — AI flags issues | -- Pending |
| Kanban pipeline + alerts dashboard | Solo operator needs at-a-glance status across all clients, not just lists | -- Pending |

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
*Last updated: 2026-04-08 after initialization*
