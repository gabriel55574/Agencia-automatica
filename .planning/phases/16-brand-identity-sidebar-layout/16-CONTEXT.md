# Phase 16: Brand Identity & Sidebar Layout - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Define visual identity tokens from the Velocity brand system and restructure app layout from horizontal header navigation to a persistent vertical sidebar. Delivers requirements VIS-02 (brand identity) and NAV-01 (sidebar navigation).

</domain>

<decisions>
## Implementation Decisions

### Brand Identity
- **D-01:** Use `docs/VELOCITY-UI-IDENTITY-SYSTEM.md` as the single source of truth for all visual tokens — colors, typography, spacing, shadows, radius, animations
- **D-02:** Hybrid theme approach — sidebar uses Dark theme tokens (Rich Black #062222 background, Smoke White #F2F2F2 text, Electric Lime #BFF205 accent) while content area uses Light theme tokens (Smoke White #F2F2F2 background, Rich Black #062222 text)
- **D-03:** Replace current fonts (Geist Sans/Mono) with Velocity brand fonts: Montserrat (headings) + Roboto (body)
- **D-04:** Implement all CSS custom properties from section 4 of the identity doc as Tailwind theme extensions
- **D-05:** Electric Lime (#BFF205) must NOT be used as text on light backgrounds (fails WCAG). Use Lime Dark (#6D8A03) for text on light backgrounds instead

### Sidebar Structure
- **D-06:** Fixed sidebar, 240px width, always visible on desktop (>= 1024px)
- **D-07:** Flat list layout — no section grouping or separators between items
- **D-08:** Item order: Dashboard, Clientes, Custos, Analytics, Templates
- **D-09:** Logo area at top (Velocity logo, light variant for dark background)
- **D-10:** "Sair" (sign out) button at bottom, visually separated from nav items

### Navigation Behavior
- **D-11:** Current header navigation fully removed — sidebar is the only navigation
- **D-12:** On screens < 1024px: sidebar collapses to hamburger menu icon + logo in a slim top bar. Tap hamburger opens sidebar as overlay
- **D-13:** Active page indicator: 3px vertical Electric Lime (#BFF205) bar on left edge of active item + lime text color + subtle background (rgba lime ~8% opacity)

### Icons
- **D-14:** Each sidebar item has a Lucide React icon (24px, nav size per identity doc) to the left of the label
- **D-15:** Icon selection: LayoutDashboard (Dashboard), Users (Clientes), DollarSign (Custos), BarChart3 (Analytics), FileText (Templates), LogOut (Sair) — final icon choices at Claude's discretion

### Claude's Discretion
- Exact Lucide icon names for each nav item (D-15 provides suggestions)
- Hamburger menu animation style on mobile
- Transition animation when sidebar overlay opens/closes on mobile
- Exact padding/gap values within sidebar (follow identity doc spacing tokens)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Brand Identity System
- `docs/VELOCITY-UI-IDENTITY-SYSTEM.md` — Complete brand identity: colors (section 1), typography (section 2), logo variants (section 3), CSS custom properties (section 4), light/dark themes (section 5), component specs (section 6), iconography (section 7), grid (section 8), animations (section 9), accessibility (section 10), Tailwind config (section 11)

### Logo Assets
- `Logo/logotipo fundo claro.svg` — Light variant (for dark sidebar background)
- `Logo/logotipo fundo escuro.svg` — Dark variant (reference only)
- `Logo/logo tipo fundo claro (icone).svg` — Icon-only variant for favicon

### Requirements
- `.planning/REQUIREMENTS.md` — VIS-02 (brand identity), NAV-01 (sidebar navigation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` — 21 shadcn/ui components (button, card, badge, tabs, dialog, etc.) that need brand token integration
- `src/components/ui/sonner.tsx` — Toast component already installed (used in Phase 19)

### Established Patterns
- Dashboard layout: `src/app/(dashboard)/layout.tsx` — current header-based layout with auth check and sign out Server Action. This file is the primary refactor target
- NavLinks: `src/components/layout/NavLinks.tsx` — current horizontal nav component. Will be replaced entirely by sidebar
- CSS: `src/app/globals.css` — minimal setup with Tailwind v4, only `--background` and `--foreground` vars defined. Needs full brand token injection
- Root layout: `src/app/layout.tsx` — loads Geist fonts. Needs font swap to Montserrat + Roboto
- Auth: `src/lib/supabase/server.ts` — createClient for server-side auth checks (used in dashboard layout)

### Integration Points
- `src/app/(dashboard)/layout.tsx` — must be restructured from header to sidebar layout
- `src/app/layout.tsx` — font imports and global CSS vars
- `src/app/globals.css` — brand tokens and theme variables
- All shadcn/ui components may need token updates if they reference zinc/slate/neutral defaults

</code_context>

<specifics>
## Specific Ideas

- User provided a complete brand identity document (`VELOCITY-UI-IDENTITY-SYSTEM.md`) — this is the authoritative reference, not something to interpret loosely
- The identity doc notes that the brandbook PNG has outdated colors — ignore the brandbook, follow SVG-derived colors
- Tagline "cresga com a velocidade certa" should NOT appear in the app sidebar — only for hero/institutional use per the doc

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-brand-identity-sidebar-layout*
*Context gathered: 2026-04-09*
