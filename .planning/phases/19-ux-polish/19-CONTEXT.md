# Phase 19: UX Polish - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add skeleton loading screens, toast feedback for all CRUD actions, empty states with CTAs, and tabbed client profile. Delivers requirements UX-01 (skeletons), UX-02 (toasts), UX-03 (tabs), VIS-03 (empty states).

</domain>

<decisions>
## Implementation Decisions

### Skeleton Loading Screens (UX-01)
- **D-01:** Use Next.js App Router `loading.tsx` convention — one per route. Automatic Suspense streaming.
- **D-02:** 6 skeleton files to create:
  - `src/app/(dashboard)/loading.tsx` — Kanban board skeleton (5 columns with card placeholders)
  - `src/app/(dashboard)/clients/loading.tsx` — Client grid skeleton (card placeholders)
  - `src/app/(dashboard)/clients/[id]/loading.tsx` — Profile skeleton with tabs outline
  - `src/app/(dashboard)/analytics/loading.tsx` — Chart area skeletons
  - `src/app/(dashboard)/costs/loading.tsx` — Table skeleton with rows
  - `src/app/(dashboard)/templates/loading.tsx` — List skeleton
- **D-03:** Style: `animate-pulse` with `bg-gray-100` blocks on white background. Match the shape of actual content (cards, tables, charts).

### Empty States (VIS-03)
- **D-04:** Empty state pattern: Lucide icon (48px, gray-300 color) + descriptive text in PT-BR + primary CTA button (Electric Lime per brand identity)
- **D-05:** Create a reusable `EmptyState` component accepting `icon`, `title`, `description`, `actionLabel`, `actionHref` props
- **D-06:** Empty states needed for:
  - `/clients` — no clients: Users icon, "Nenhum cliente cadastrado", CTA "Novo Cliente" → /clients/new
  - `/clients/[id]` outputs tab — no outputs: FileText icon, "Nenhum output gerado", CTA "Ir para Pipeline"
  - `/templates` — no templates: FileText icon, "Nenhum template salvo", CTA contextual
  - `/costs` — no cost data: DollarSign icon, "Nenhum dado de custo", informational text
  - `/analytics` — no analytics data: BarChart3 icon, "Dados insuficientes", informational text
  - Dashboard — no clients at all: Users icon, "Nenhum cliente no pipeline", CTA "Novo Cliente"

### Client Profile Tabs (UX-03)
- **D-07:** 3 tabs using shadcn Tabs component (already installed): Pipeline, Outputs, Briefing
- **D-08:** Client-side tab switching — no URL change, no navigation. Pipeline tab is default.
- **D-09:** Tab content:
  - **Pipeline** (default): Current PipelineAccordion content (5 phases with processes, gates, squad triggers)
  - **Outputs**: Output list currently at `/clients/[id]/outputs` — move inline into this tab
  - **Briefing**: Client briefing data (niche, target_audience, additional_context) with "Editar" button → /clients/[id]/edit
- **D-10:** The separate `/clients/[id]/outputs` route can remain as a redirect or be removed — Claude's discretion

### Toast Feedback (UX-02)
- **D-11:** Sonner (already installed) handles all toasts. Existing coverage in 8 components is kept.
- **D-12:** Add missing toast coverage:
  - Create client → success toast "Cliente criado com sucesso"
  - Edit client → success toast "Cliente atualizado"
  - Archive client → success toast "Cliente arquivado"
  - Restore client → success toast "Cliente restaurado"
  - Delete/remove actions → success toast with appropriate message
  - Form validation errors → error toast with specific message
- **D-13:** Toast style: Sonner default with semantic colors (success=green, error=red, info=blue). No customization needed beyond message text.

### Claude's Discretion
- Exact skeleton shapes and proportions per route
- Whether to create a shared `SkeletonCard`, `SkeletonTable` component or inline the skeletons
- How to handle the `/clients/[id]/outputs` route after moving content to tabs (redirect vs remove)
- Empty state icon choices for each page (suggestions provided, final selection flexible)
- Whether to add toast feedback for additional edge cases not listed

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Brand Identity
- `docs/VELOCITY-UI-IDENTITY-SYSTEM.md` — Section 6.1 (buttons for CTAs), Section 7 (iconography sizes), Section 9 (animations)
- `.planning/phases/16-brand-identity-sidebar-layout/16-CONTEXT.md` — Brand tokens, Lucide icons

### Phase Dependencies
- `.planning/phases/17-phase-colors-breadcrumbs/17-CONTEXT.md` — Phase colors for skeleton/empty state color accents
- `.planning/phases/18-pt-br-localization/18-CONTEXT.md` — All text must be in PT-BR (D-02 translations, D-01 terms kept in English)

### Existing Components
- `src/components/ui/tabs.tsx` — shadcn Tabs (for client profile tabs)
- `src/components/ui/sonner.tsx` — Sonner toast setup (for missing toast coverage)
- `src/components/ui/button.tsx` — shadcn Button (for empty state CTAs)

### Current Toast Usage (reference)
- `src/components/templates/template-list.tsx` — template save/delete toasts
- `src/components/costs/BudgetSettingDialog.tsx` — budget toasts
- `src/components/clients/clone-client-dialog.tsx` — clone toast
- `src/components/clients/reset-pipeline-dialog.tsx` — reset toast
- `src/components/clients/gate-section.tsx` — gate approve/reject toasts
- `src/components/squad/RunSquadButton.tsx` — squad trigger toast

### Client Profile
- `src/app/(dashboard)/clients/[id]/page.tsx` — current profile page (needs tab restructure)
- `src/app/(dashboard)/clients/[id]/outputs/` — outputs subpage (content moves to tab)

### Requirements
- `.planning/REQUIREMENTS.md` — UX-01 (skeletons), UX-02 (toasts), UX-03 (tabs), VIS-03 (empty states)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/tabs.tsx` — shadcn Tabs, ready to use for client profile
- `src/components/ui/sonner.tsx` — Sonner provider, already mounted in app
- `src/components/ui/button.tsx` — Button component for empty state CTAs
- Lucide React already installed — all icon imports available

### Established Patterns
- Toast usage pattern: `import { toast } from 'sonner'` then `toast.success("message")` or `toast.error("message")`
- Client actions in `src/lib/actions/clients.ts` — create, update, archive functions that need toast wrappers
- Client profile at `/clients/[id]/page.tsx` fetches phases, processes, gates, latest jobs, latest reviews, budget usage in parallel

### Integration Points
- Every `src/app/(dashboard)/*/` route needs a `loading.tsx`
- `src/lib/actions/clients.ts` — client CRUD actions need toast calls in the calling components
- `src/app/(dashboard)/clients/[id]/page.tsx` — restructure from single scroll to tabbed layout
- Pages with empty data states — KanbanBoard, client-grid, template-list, etc.

</code_context>

<specifics>
## Specific Ideas

- Skeletons should match the actual layout shape — Kanban skeleton has 5 columns, client grid has card shapes, etc.
- Empty states should feel helpful, not just decorative — the CTA should be the obvious next action
- Tab switching should be instant (no loading between tabs) — all data fetched on initial page load
- Toast messages should be in PT-BR (consistent with Phase 18 localization)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-ux-polish*
*Context gathered: 2026-04-09*
