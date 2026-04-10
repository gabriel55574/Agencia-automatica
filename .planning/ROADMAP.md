# Roadmap: Agency OS

## Milestones

- **v1.0 MVP** — Phases 1-9, 21 plans (shipped 2026-04-09) | [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Production Hardening & Feature Expansion** — Phases 10-15, 12 plans (shipped 2026-04-09) | [Archive](milestones/v1.1-ROADMAP.md)
- **v1.2 UI/UX Overhaul** — Phases 16-19 (in progress)

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

<details>
<summary>v1.1 Production Hardening & Feature Expansion (Phases 10-15) — SHIPPED 2026-04-09</summary>

- [x] Phase 10: Tech Debt Cleanup (2/2 plans) — completed 2026-04-09
- [ ] Phase 11: Production Deployment (0/0 plans) — skipped (manual VPS provisioning)
- [x] Phase 12: Cost Tracking (4/4 plans) — completed 2026-04-09
- [x] Phase 13: Notifications (2/2 plans) — completed 2026-04-09
- [x] Phase 14: Analytics (2/2 plans) — completed 2026-04-09
- [x] Phase 15: Templates (2/2 plans) — completed 2026-04-09

</details>

### v1.2 UI/UX Overhaul (In Progress)

**Milestone Goal:** Transformar o frontend de wireframe funcional em interface operacional profissional — traduzida para PT-BR, com navegacao completa, identidade visual, e UX otimizada para operador solo gerenciando 15+ clientes.

- [x] **Phase 16: Brand Identity & Sidebar Layout** - Define visual identity tokens and restructure app layout from header nav to persistent sidebar (completed 2026-04-10)
- [x] **Phase 17: Phase Colors & Breadcrumbs** - Apply distinct colors per pipeline phase and add hierarchical breadcrumbs to detail pages (completed 2026-04-10)
- [x] **Phase 18: PT-BR Localization** - Translate all UI text across ~45 components to Brazilian Portuguese (completed 2026-04-10)
- [x] **Phase 19: UX Polish** - Add skeleton loading, toast feedback, empty states with CTAs, and tabbed client profile (completed 2026-04-10)

## Phase Details

### Phase 16: Brand Identity & Sidebar Layout
**Goal**: Operator sees a professional, branded app with persistent sidebar navigation replacing the thin header
**Depends on**: Phase 15 (v1.1 complete)
**Requirements**: VIS-02, NAV-01
**Success Criteria** (what must be TRUE):
  1. App displays a defined primary color, accent color, and logo area visible on every page
  2. Operator navigates between Dashboard, Clientes, Custos, Analytics, and Templates via a persistent sidebar visible on all authenticated routes
  3. Sidebar shows active state highlighting for the current section
  4. Previous header navigation is fully replaced — no duplicate nav elements
**Plans**: TBD
**UI hint**: yes

### Phase 17: Phase Colors & Breadcrumbs
**Goal**: Operator instantly identifies pipeline phases by color and always knows where they are in the page hierarchy
**Depends on**: Phase 16 (brand tokens defined, sidebar layout stable)
**Requirements**: VIS-01, NAV-02
**Success Criteria** (what must be TRUE):
  1. Each of the 5 pipeline phases (Diagnostico, Engenharia de Valor, Go-to-Market, Tracao e Vendas, Retencao e Escala) renders with a distinct, consistent color across Kanban columns, pipeline accordion, and status badges
  2. Detail pages (client profile, client edit, output view) display breadcrumbs showing the full navigation path back to the parent section
  3. Breadcrumb links are clickable and navigate correctly to each ancestor page
**Plans**: TBD
**UI hint**: yes

### Phase 18: PT-BR Localization
**Goal**: Operator uses the entire application in Brazilian Portuguese with zero English text in the UI
**Depends on**: Phase 17 (layout and navigation finalized — avoids re-translating restructured components)
**Requirements**: LOC-01, LOC-02
**Success Criteria** (what must be TRUE):
  1. All ~45 UI components display labels, buttons, messages, placeholders, and empty states in PT-BR
  2. The 5 pipeline phase names display as their PT-BR names (Diagnostico, Engenharia de Valor, Go-to-Market, Tracao e Vendas, Retencao e Escala) everywhere they appear — Kanban headers, pipeline accordion, badges, breadcrumbs
  3. No English user-facing text remains in the rendered application (developer-only content like console logs excluded)
**Plans**: TBD
**UI hint**: yes

### Phase 19: UX Polish
**Goal**: Operator experiences smooth loading, clear feedback, helpful empty states, and organized client information
**Depends on**: Phase 18 (all text translated — skeletons/toasts/empty states should display in PT-BR)
**Requirements**: UX-01, UX-02, UX-03, VIS-03
**Success Criteria** (what must be TRUE):
  1. Every route in the dashboard displays skeleton loading screens while data loads instead of blank content or spinners
  2. Creating, editing, deleting, and archiving a client each triggers a visible toast notification confirming the action
  3. Saving a template, triggering a squad, and approving/rejecting a gate each trigger appropriate toast feedback
  4. Pages with no data (no clients, no outputs, no templates, no cost data) display an illustration/icon with descriptive text and a clear CTA guiding the operator to the next action
  5. Client profile page is organized into three tabs (Pipeline / Outputs / Briefing) instead of a long scrollable page
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 | 21/21 | Complete | 2026-04-09 |
| 10. Tech Debt Cleanup | v1.1 | 2/2 | Complete | 2026-04-09 |
| 11. Production Deployment | v1.1 | 0/0 | Skipped | - |
| 12. Cost Tracking | v1.1 | 4/4 | Complete | 2026-04-09 |
| 13. Notifications | v1.1 | 2/2 | Complete | 2026-04-09 |
| 14. Analytics | v1.1 | 2/2 | Complete | 2026-04-09 |
| 15. Templates | v1.1 | 2/2 | Complete | 2026-04-09 |
| 16. Brand Identity & Sidebar Layout | v1.2 | 2/2 | Complete    | 2026-04-10 |
| 17. Phase Colors & Breadcrumbs | v1.2 | 2/2 | Complete    | 2026-04-10 |
| 18. PT-BR Localization | v1.2 | 3/3 | Complete   | 2026-04-10 |
| 19. UX Polish | v1.2 | 4/4 | Complete    | 2026-04-10 |
