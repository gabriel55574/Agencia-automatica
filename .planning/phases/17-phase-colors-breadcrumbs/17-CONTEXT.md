# Phase 17: Phase Colors & Breadcrumbs - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply distinct colors per pipeline phase across Kanban, accordion, and badges. Add hierarchical breadcrumbs to detail pages. Delivers requirements VIS-01 (phase colors) and NAV-02 (breadcrumbs).

</domain>

<decisions>
## Implementation Decisions

### Phase Color Palette
- **D-01:** 5 semantic colors, one per phase, associated by squad work type:
  - Phase 1 (Diagnostico): Blue `#3B82F6` — research/analysis
  - Phase 2 (Engenharia de Valor): Violet `#8B5CF6` — strategy/positioning
  - Phase 3 (Go-to-Market): Amber `#F59E0B` — planning/logistics
  - Phase 4 (Tracao e Vendas): Green `#22C55E` — growth/execution
  - Phase 5 (Retencao e Escala): Teal `#14B8A6` — retention/loyalty
- **D-02:** Each phase color has 3 variants: base (icon/borders), light (backgrounds at ~10% opacity), dark (text on light backgrounds — WCAG AA compliant)
- **D-03:** Phase colors are defined as a centralized constant (extend `src/lib/database/enums.ts` alongside PHASE_NAMES) — single source of truth consumed by all components

### Color Application (Subtle Approach)
- **D-04:** Kanban columns — colored bar (3-4px) at the top of the column header + phase name in base color
- **D-05:** Pipeline accordion — colored left border (3px) on the accordion item for each phase
- **D-06:** Status badges — phase badges use light variant as background + dark variant as text (e.g., blue-light bg + blue-dark text for "Diagnostico")
- **D-07:** No large colored backgrounds — colors used as accents only (borders, bars, badge fills, small indicators)

### Breadcrumbs
- **D-08:** Chevron separator style — Lucide `ChevronRight` icon (14px) between breadcrumb items
- **D-09:** Text styling: ancestor links in `--color-gray-300` with hover in `--text-accent` (Lime Dark #6D8A03 per accessibility). Current page in `--text-primary`, font-medium, no link.
- **D-10:** Breadcrumbs appear ONLY on detail pages, NOT on root pages. Root pages (/, /clients, /costs, /analytics, /templates) have no breadcrumb — sidebar active state is sufficient.

### Breadcrumb Hierarchy
- **D-11:** Breadcrumb routes:
  - `/clients/[id]` → `Clientes > {client name}`
  - `/clients/[id]/edit` → `Clientes > {client name} > Editar`
  - `/clients/[id]/outputs` → `Clientes > {client name} > Outputs`
- **D-12:** Breadcrumb component is reusable — accepts an array of `{ label, href? }` items. Last item has no href (current page).
- **D-13:** Breadcrumb positioned at the top of the content area, above the page title, with `--space-2` (8px) margin below.

### Claude's Discretion
- Exact Tailwind class mapping for the 3 color variants per phase (base, light, dark)
- Whether to define phase colors in CSS custom properties or as Tailwind theme extensions
- Breadcrumb component implementation approach (server component vs client component)
- Animation/transition on breadcrumb hover

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Brand Identity System
- `docs/VELOCITY-UI-IDENTITY-SYSTEM.md` — Section 10 (accessibility/contrast), Section 1.3 (semantic colors), Section 6.4 (badges/tags), Section 6.5 (navigation)

### Phase 16 Context (Dependency)
- `.planning/phases/16-brand-identity-sidebar-layout/16-CONTEXT.md` — Brand tokens, sidebar layout, theme decisions (D-02 hybrid theme, D-05 accessibility)

### Phase Names & Enums
- `src/lib/database/enums.ts` — PHASE_NAMES (PT-BR), PhaseNumber type, PROCESS_TO_PHASE mapping — extend this file with PHASE_COLORS

### Requirements
- `.planning/REQUIREMENTS.md` — VIS-01 (phase colors), NAV-02 (breadcrumbs)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/database/enums.ts` — PHASE_NAMES already defined for all 5 phases. PHASE_COLORS should live here too.
- `src/components/ui/badge.tsx` — shadcn Badge component. Needs phase-color variant support.
- `src/components/ui/accordion.tsx` — shadcn Accordion. Pipeline accordion wraps this.

### Established Patterns
- `KanbanColumn` (`src/components/dashboard/KanbanColumn.tsx`) — uses `PHASE_NAMES[column.phase_number]` for headers. Currently zinc-700 text, zinc-50 background. Needs phase color bar + phase-colored header text.
- `PipelinePhase` (`src/components/clients/pipeline-phase.tsx`) — has `PhaseStatusBadge` with hard-coded blue/green colors. Needs phase-aware coloring.
- `KanbanClientCard` (`src/components/dashboard/KanbanClientCard.tsx`) — client cards in Kanban. May need subtle phase color indicator.

### Integration Points
- `src/components/dashboard/KanbanColumn.tsx` — add phase color bar to column header
- `src/components/clients/pipeline-phase.tsx` — add phase color to accordion left border + badge
- All client detail pages (`/clients/[id]`, `/clients/[id]/edit`, `/clients/[id]/outputs`) — add Breadcrumb component
- No existing breadcrumb component — needs to be created from scratch

</code_context>

<specifics>
## Specific Ideas

- Phase colors are an extension of the brand identity system, not a replacement. Electric Lime remains the app-level accent; phase colors are domain-specific identifiers.
- The 5 phase colors intentionally don't include Electric Lime to avoid confusion with the app accent.
- Badge coloring follows the same pattern as the identity doc's section 6.4 (light bg + dark text variant).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-phase-colors-breadcrumbs*
*Context gathered: 2026-04-09*
