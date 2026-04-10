# Phase 17: Phase Colors & Breadcrumbs — Research

**Researched:** 2026-04-09
**Phase Goal:** Operator instantly identifies pipeline phases by color and always knows where they are in the page hierarchy
**Requirements:** VIS-01 (phase colors), NAV-02 (breadcrumbs)

## 1. Current State Analysis

### Phase Color System — What Exists

**`src/lib/database/enums.ts`** is the single source of truth for domain constants. It already exports:
- `PHASE_NAMES` — Record<1|2|3|4|5, string> with PT-BR phase names
- `PhaseNumber` type — union `1 | 2 | 3 | 4 | 5`
- `PHASE_LABELS_EN` — English labels for internal use

There is **no color mapping** yet. The CONTEXT.md (D-03) specifies adding `PHASE_COLORS` to this same file.

### Current Component Color Usage

**KanbanColumn** (`src/components/dashboard/KanbanColumn.tsx`):
- Header: `text-zinc-700` (plain gray)
- Container: `bg-zinc-50` (gray background)
- No phase-specific coloring at all

**PipelinePhase** (`src/components/clients/pipeline-phase.tsx`):
- `PhaseStatusBadge` uses hard-coded colors: `bg-blue-100 text-blue-700` (active), `bg-green-100 text-green-700` (completed)
- Phase number circle: `bg-zinc-800 text-white` (dark gray)
- Accordion item border: `border-zinc-200`
- No phase-specific coloring

**Badge** (`src/components/ui/badge.tsx`):
- Standard shadcn variants: default, secondary, destructive, outline, ghost, link
- No phase-color variants

### Breadcrumbs — What Exists

**No breadcrumb component exists.** The `src/components/ui/` directory has standard shadcn components but no breadcrumb.

Current navigation patterns on detail pages:
- `/clients/[id]` — No navigation context, just header with client name
- `/clients/[id]/edit` — Has `h1` "Edit Client" but no breadcrumb trail
- `/clients/[id]/outputs` — Has a crude "client name / Outputs" separator using `<span className="text-zinc-400">/</span>` and a "Back to Profile" button

### Layout Context

**Dashboard layout** (`src/app/(dashboard)/layout.tsx`):
- Sidebar + main content area
- `<main className="flex-1 px-6 py-6">{children}</main>`
- Breadcrumbs should go inside the `<main>` area, at the top of each detail page — NOT in the layout (since root pages should not have them per D-10)

## 2. Implementation Approach

### Phase Colors — Centralized Constant

**Approach:** Define a `PHASE_COLORS` constant in `src/lib/database/enums.ts` with 3 variants per phase (base, light, dark). Each variant maps to a Tailwind class string, NOT raw hex values. This enables consumption via `className` directly without dynamic class generation.

```typescript
export const PHASE_COLORS = {
  1: { base: 'text-blue-500', light: 'bg-blue-500/10', dark: 'text-blue-700', border: 'border-blue-500' },
  2: { base: 'text-violet-500', light: 'bg-violet-500/10', dark: 'text-violet-700', border: 'border-violet-500' },
  3: { base: 'text-amber-500', light: 'bg-amber-500/10', dark: 'text-amber-700', border: 'border-amber-500' },
  4: { base: 'text-green-500', light: 'bg-green-500/10', dark: 'text-green-700', border: 'border-green-500' },
  5: { base: 'text-teal-500', light: 'bg-teal-500/10', dark: 'text-teal-700', border: 'border-teal-500' },
} as const satisfies Record<PhaseNumber, { base: string; light: string; dark: string; border: string }>
```

**Why Tailwind classes instead of CSS custom properties:** The app already uses Tailwind exclusively. Defining classes keeps the pattern consistent. The hex values from D-01 map cleanly to Tailwind's default palette:
- `#3B82F6` = `blue-500`
- `#8B5CF6` = `violet-500`
- `#F59E0B` = `amber-500`
- `#22C55E` = `green-500`
- `#14B8A6` = `teal-500`

These are exact matches in Tailwind's color palette.

### Color Application Points

Per CONTEXT.md decisions D-04 through D-07:

1. **KanbanColumn** (D-04): Add a 3-4px colored top bar to column header + phase name in base color
2. **PipelinePhase accordion** (D-05): Add 3px colored left border on the AccordionItem
3. **PhaseStatusBadge** (D-06): Replace hard-coded blue/green with phase-aware colors (light bg + dark text)
4. **General principle** (D-07): Colors as accents only — no large colored backgrounds

### Breadcrumb Component

**Approach:** Create a reusable `Breadcrumb` server component at `src/components/ui/breadcrumb.tsx` following D-12's interface: accepts `Array<{ label: string; href?: string }>`. Last item has no href.

**Styling per D-08, D-09:**
- Chevron separator: Lucide `ChevronRight` at 14px
- Ancestor links: `text-zinc-400` (maps to `--color-gray-300` intent) with `hover:text-[#6D8A03]` (Lime Dark per accessibility)
- Current page: `text-zinc-900 font-medium` (no link)

**Positioning per D-13:** Top of content area, above page title, `mb-2` (8px) below breadcrumb.

### Pages Requiring Breadcrumbs (D-10, D-11)

Only detail pages — NOT root pages:

| Route | Breadcrumb |
|-------|-----------|
| `/clients/[id]` | `Clientes > {client.name}` |
| `/clients/[id]/edit` | `Clientes > {client.name} > Editar` |
| `/clients/[id]/outputs` | `Clientes > {client.name} > Outputs` |

Root pages (`/`, `/clients`, `/costs`, `/analytics`, `/templates`) get **no** breadcrumb.

## 3. Dependencies and Risks

### Phase 16 Dependency
Phase 17 depends on Phase 16 (brand tokens, sidebar layout). The sidebar is already implemented based on the layout file. Brand tokens (CSS custom properties) should already be available. If Phase 16 colors/tokens are not yet applied, Phase 17 can still proceed since phase colors use Tailwind's default palette (blue-500, violet-500, etc.), not brand tokens.

### WCAG Compliance
D-02 requires WCAG AA compliance for dark variants (text on light backgrounds). Tailwind's `-700` variants on their respective `-500/10` backgrounds provide sufficient contrast:
- `blue-700` on `blue-500/10` ≈ 7:1 ratio (passes AA)
- `violet-700` on `violet-500/10` ≈ 7:1 ratio (passes AA)
- `amber-700` on `amber-500/10` ≈ 6:1 ratio (passes AA)
- `green-700` on `green-500/10` ≈ 5:1 ratio (passes AA)
- `teal-700` on `teal-500/10` ≈ 6:1 ratio (passes AA)

All pass WCAG AA (minimum 4.5:1 for normal text).

### Tailwind Dynamic Classes
Tailwind purges unused classes at build time. Since `PHASE_COLORS` uses string literals (not template literals), all classes are statically present in the source and will be preserved by the purge process. No `safelist` configuration needed.

## 4. File Impact Map

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/ui/breadcrumb.tsx` | Reusable breadcrumb component |

### Files to Modify
| File | Change |
|------|--------|
| `src/lib/database/enums.ts` | Add `PHASE_COLORS` constant |
| `src/components/dashboard/KanbanColumn.tsx` | Add phase color bar + colored header text |
| `src/components/clients/pipeline-phase.tsx` | Add colored left border + phase-aware badges |
| `src/app/(dashboard)/clients/[id]/page.tsx` | Add breadcrumb |
| `src/app/(dashboard)/clients/[id]/edit/page.tsx` | Add breadcrumb |
| `src/app/(dashboard)/clients/[id]/outputs/page.tsx` | Add breadcrumb (replace crude "/" separator) |

### Files Unchanged
- `src/components/ui/badge.tsx` — No need to add variants; phase badges use `className` override directly with PHASE_COLORS values
- `src/app/(dashboard)/layout.tsx` — Breadcrumbs go in individual pages, not layout

## 5. Validation Architecture

### Acceptance Tests

**VIS-01 (Phase Colors):**
1. `enums.ts` exports `PHASE_COLORS` with keys 1-5, each having `base`, `light`, `dark`, `border` string properties
2. `KanbanColumn.tsx` renders a colored top bar using `PHASE_COLORS[column.phase_number].border`
3. `KanbanColumn.tsx` renders phase name with `PHASE_COLORS[column.phase_number].base`
4. `pipeline-phase.tsx` AccordionItem has `border-l-[3px]` with phase-specific border color
5. `PhaseStatusBadge` uses phase-aware colors (not hard-coded blue/green)

**NAV-02 (Breadcrumbs):**
1. `breadcrumb.tsx` exists and exports a `Breadcrumb` component accepting `items: Array<{ label: string; href?: string }>`
2. `/clients/[id]/page.tsx` renders breadcrumb with `Clientes > {client.name}`
3. `/clients/[id]/edit/page.tsx` renders breadcrumb with `Clientes > {client.name} > Editar`
4. `/clients/[id]/outputs/page.tsx` renders breadcrumb with `Clientes > {client.name} > Outputs`
5. Root pages (`/`, `/clients`, `/costs`, `/analytics`, `/templates`) do NOT render breadcrumbs
6. Breadcrumb ancestor links use Lucide `ChevronRight` separator (14px)
7. Breadcrumb appears above page title with 8px margin below

## RESEARCH COMPLETE
