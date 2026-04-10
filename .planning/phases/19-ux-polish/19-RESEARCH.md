# Phase 19: UX Polish — Research

**Researched:** 2026-04-09
**Phase Goal:** Operator experiences smooth loading, clear feedback, helpful empty states, and organized client information
**Requirements:** UX-01 (skeletons), UX-02 (toasts), UX-03 (tabs), VIS-03 (empty states)

---

## Standard Stack

| Category | Technology | Version | Notes |
|----------|-----------|---------|-------|
| Framework | Next.js App Router | 16.x | `loading.tsx` convention for automatic Suspense streaming |
| UI Components | shadcn/ui (new-york) | latest | Tabs, Button, Card already installed |
| Icons | lucide-react | installed | All icons available via tree-shaking |
| Toast | Sonner | installed | Already mounted via `src/components/ui/sonner.tsx` |
| Styling | Tailwind CSS v4 + CSS vars | installed | Velocity brand tokens in `globals.css` |

---

## Architecture Patterns

### 1. Skeleton Loading Screens (UX-01)

**Pattern:** Next.js App Router `loading.tsx` files — placed at each route segment, automatically wrapped in `<Suspense>` by the framework.

**Current state:** Zero `loading.tsx` files exist in the codebase. All routes currently show blank content during data fetching.

**Routes needing skeletons (6 files):**

| Route | File Path | Content Shape |
|-------|-----------|---------------|
| Dashboard | `src/app/(dashboard)/loading.tsx` | 5-column Kanban with card placeholders |
| Clients | `src/app/(dashboard)/clients/loading.tsx` | Card grid (3x2 layout) |
| Client Profile | `src/app/(dashboard)/clients/[id]/loading.tsx` | Header + 3 tabs + content area |
| Analytics | `src/app/(dashboard)/analytics/loading.tsx` | Chart placeholders + stat cards |
| Costs | `src/app/(dashboard)/costs/loading.tsx` | Table header + rows |
| Templates | `src/app/(dashboard)/templates/loading.tsx` | List items |

**Implementation approach:**
- Each `loading.tsx` exports a default function returning `animate-pulse` blocks matching actual content shapes
- Use `bg-[#E8EDED]` (gray-100 token) for pulse blocks on white card backgrounds
- Accessibility: wrap in `<div role="status" aria-label="Carregando..." aria-busy="true">`
- No shared skeleton components needed — each route's skeleton is unique to its layout

**Key finding:** `createClientAction` and `updateClientAction` both call `redirect()` after success, which means the server action never returns `{ success: true }` to the client. Toasts for create/update must be handled differently (see Toast section below).

### 2. Empty States (VIS-03)

**Current state:** Minimal empty states exist:
- `KanbanColumn.tsx` line 25: `<p className="text-xs text-zinc-400 text-center py-8">No clients</p>` — plain text, no icon/CTA
- `client-grid.tsx` line 55: `<p className="text-lg">No clients yet.</p>` — plain text, no icon/CTA
- `templates/page.tsx` lines 34-39: basic "No templates yet" text — no icon, no CTA button
- `outputs/page.tsx` lines 147-150: "No completed outputs yet" — no icon, no CTA

**Pattern: Reusable `EmptyState` component**

Create `src/components/ui/empty-state.tsx` accepting:
- `icon: LucideIcon` — rendered at 48px, `text-[#8A9999]` (gray-300)
- `title: string` — rendered as heading-sm (20px Montserrat 600)
- `description: string` — rendered as body-md (16px Roboto 400), `text-[#5C6E6E]` (gray-400)
- `actionLabel?: string` — CTA button text
- `actionHref?: string` — CTA link
- `onAction?: () => void` — CTA callback (alternative to href)

**Empty states to implement (6 locations):**

| Location | Icon | Title | CTA |
|----------|------|-------|-----|
| Dashboard (no clients) | Users | "Nenhum cliente no pipeline" | "Novo Cliente" → /clients/new |
| Client list (no clients) | Users | "Nenhum cliente cadastrado" | "Novo Cliente" → /clients/new |
| Client outputs tab (no outputs) | FileText | "Nenhum output gerado" | "Ir para Pipeline" (switches tab) |
| Templates (no templates) | FileText | "Nenhum template salvo" | "Criar Template" (contextual) |
| Costs (no data) | DollarSign | "Nenhum dado de custo" | none (informational) |
| Analytics (no data) | BarChart3 | "Dados insuficientes" | none (informational) |

### 3. Client Profile Tabs (UX-03)

**Current state:** `src/app/(dashboard)/clients/[id]/page.tsx` renders as a single long scrollable page with sections separated by `<Separator>`:
1. Header (name, company, badges, action buttons)
2. Briefing section
3. Pipeline accordion
4. Outputs section (link to `/clients/[id]/outputs`)

**Restructure approach:**
- Keep Header above tabs (always visible)
- Add shadcn `Tabs` component below header
- 3 tabs: Pipeline (default), Outputs, Briefing
- **Pipeline tab:** Move existing `PipelineAccordion` content here
- **Outputs tab:** Inline the outputs browser content (currently at `/clients/[id]/outputs/page.tsx` with `OutputsBrowser` component). This requires:
  - Moving the data fetching for outputs into the parent page
  - Rendering `OutputsBrowser` directly in the tab content
  - The existing outputs route can redirect to the profile page with `?tab=outputs` or be kept as-is
- **Briefing tab:** Move existing briefing section here, add "Editar Briefing" CTA button

**Data fetching impact:** The client profile page already fetches all pipeline data in parallel. For outputs, the fetch currently happens in the outputs subpage. Two options:
1. **Lazy load outputs tab** — only fetch when tab is selected (requires client component + `useEffect`)
2. **Prefetch all data** — fetch outputs in parallel on the profile page (simpler, aligns with D-08 "all data fetched on initial page load")

**Decision (from CONTEXT.md D-08):** "Tab switching should be instant — all data fetched on initial page load." This means option 2: prefetch all data in the server component, pass to tabs.

**Tab implementation:**
- The page stays as a Server Component for data fetching
- Tab switching is client-side only — use a wrapper `"use client"` component that receives all pre-fetched data
- No URL state for tabs (D-08: no URL change) — use React state

### 4. Toast Feedback (UX-02)

**Current toast coverage (8 components, from CONTEXT.md):**
- `gate-section.tsx` — gate review error/success
- `reset-pipeline-dialog.tsx` — pipeline reset
- `template-list.tsx` — template delete
- `clone-client-dialog.tsx` — clone error
- `StructuredOutputView.tsx` — template save
- `RunSquadButton.tsx` — squad trigger error
- `PromptPreviewModal.tsx` — squad queue success/error
- `BudgetSettingDialog.tsx` — budget toasts (noted in CONTEXT.md)

**Missing toast coverage to add:**

| Action | Component | Challenge | Solution |
|--------|-----------|-----------|----------|
| Create client | `client-form.tsx` | `createClientAction` calls `redirect()` on success — never returns to client | Use `useRouter` + toast in `startTransition`, catch the redirect or restructure the action to not redirect |
| Update client | `client-form.tsx` | Same redirect issue | Same approach |
| Archive client | `archive-dialog.tsx` | `archiveClientAction` calls `redirect('/clients')` on success | Same pattern — actions redirect before toast can fire |
| Restore client | `archive-dialog.tsx` | `restoreClientAction` calls `redirect()` on success | Same pattern |
| Form validation | `client-form.tsx` | Currently shows inline `<FormMessage>` + `serverError` state | Add `toast.error()` alongside existing inline errors |

**Critical finding — redirect() blocks toast:**
All client CRUD server actions (`createClientAction`, `updateClientAction`, `archiveClientAction`, `restoreClientAction`) call `redirect()` on success, which throws a NEXT_REDIRECT error. The client-side code never reaches the success handling after `redirect()`.

**Solutions (in order of preference):**

1. **Query parameter approach:** After redirect, the target page reads a `?toast=created` query param and fires the toast. This works with Server Components but adds URL pollution.

2. **Split action pattern:** Refactor server actions to NOT redirect — return `{ success: true }`. Move `redirect()` to the client component after firing the toast. This is the cleanest approach:
   ```tsx
   // client-form.tsx
   const result = await createClientAction(fd)
   if ('success' in result) {
     toast.success('Cliente criado com sucesso')
     router.push(`/clients/${result.clientId}`)
   }
   ```
   This requires server actions to return the new client ID instead of redirecting.

3. **Flash message via cookies:** Set a cookie in the server action, read it on the next page to show toast. More complex, not recommended.

**Recommendation:** Option 2 (split action pattern). Modify server actions to return `{ success: true, clientId: string }` instead of calling `redirect()`. The calling component handles the toast + navigation. This is a small refactor with clear boundaries.

**For archive/restore specifically:** These already return the result to the client. The issue is they also call `redirect()`. Remove `redirect()` from `archiveClientAction` and `restoreClientAction`, handle navigation in the dialog component.

### 5. BudgetSettingDialog Toast Coverage

**Current state:** `src/components/costs/BudgetSettingDialog.tsx` already has toast coverage (noted in CONTEXT.md). No changes needed.

---

## Validation Architecture

### Critical Verification Points

1. **Skeleton rendering:** Each `loading.tsx` file must be a valid React component exporting `default`. Verify by checking `next build` completes without errors on these routes.

2. **Empty state rendering:** `EmptyState` component must render icon, title, description correctly. Verify by checking the component renders without errors when given valid props.

3. **Tab switching:** Client profile tabs must switch without page navigation. Verify: clicking each tab shows the correct content without URL changes.

4. **Toast firing:** Each toast must appear after the action completes. Verify: action → toast visible → correct message text.

5. **Server action refactor:** Modified actions must still work correctly. Verify: create/update/archive/restore all succeed with correct data + redirect behavior.

### Risk Areas

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Server action redirect refactor breaks existing flow | HIGH — client creation/editing could break | Test each action end-to-end after refactor |
| Prefetching all data for tabs slows page load | MEDIUM — extra query for outputs | Add parallel fetch with Promise.all (already patterned in the page) |
| Skeleton shapes don't match actual content | LOW — visual mismatch | Review each skeleton against the rendered page |

---

## Dependencies

| Dependency | Status | Notes |
|-----------|--------|-------|
| Phase 16 (Brand Identity) | Complete | Brand tokens in globals.css, Lucide icons available |
| Phase 17 (Phase Colors) | Not started | Phase colors not yet implemented — skeletons/empty states use neutral gray |
| Phase 18 (PT-BR) | Not started | All new text should be in PT-BR per CONTEXT.md |
| shadcn Tabs | Installed | `src/components/ui/tabs.tsx` exists |
| Sonner | Installed | `src/components/ui/sonner.tsx` mounted in app |
| Lucide React | Installed | All icons available |

---

## RESEARCH COMPLETE
