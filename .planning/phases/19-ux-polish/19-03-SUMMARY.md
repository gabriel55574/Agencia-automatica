---
phase: 19-ux-polish
plan: 03
subsystem: ui
tags: [react, tabs, shadcn, client-profile, outputs-browser]

requires:
  - phase: 19-ux-polish
    provides: EmptyState component for empty outputs tab
provides:
  - Tabbed client profile layout (Pipeline, Outputs, Briefing)
  - Shared output types at src/lib/types/outputs.ts
affects: [19-ux-polish]

tech-stack:
  added: []
  patterns: ["Tabbed layout with server-prefetched data and client-side tab switching", "Shared types extraction from page to lib/types"]

key-files:
  created:
    - src/components/clients/client-profile-tabs.tsx
    - src/lib/types/outputs.ts
  modified:
    - src/app/(dashboard)/clients/[id]/page.tsx
    - src/app/(dashboard)/clients/[id]/outputs/page.tsx
    - src/app/(dashboard)/clients/[id]/outputs/outputs-browser.tsx

key-decisions:
  - "Extracted ProcessWithRuns/CompletedJob types to shared lib/types/outputs.ts to avoid page-level imports"
  - "Used controlled Tabs state (useState) for programmatic tab switching from empty outputs CTA"
  - "Server component prefetches all data including outputs — tab switching is instant with no loading"

patterns-established:
  - "Tabbed layout pattern: server prefetch all data, pass to client tabs component, instant client-side switching"
  - "Shared types extraction: move types from page files to lib/types/ when needed by multiple components"

requirements-completed: [UX-03]

duration: 10min
completed: 2026-04-09
---

# Plan 19-03: Client Profile Tabs Summary

**Client profile restructured from linear scroll into Pipeline/Outputs/Briefing tabs with instant client-side switching**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-09
- **Completed:** 2026-04-09
- **Tasks:** 2
- **Files created:** 2
- **Files modified:** 3

## Accomplishments
- Created ClientProfileTabs client component with 3 tabs: Pipeline (default), Outputs, Briefing
- Restructured client profile page to use tabs instead of long scroll
- Server component prefetches all data (pipeline + outputs + briefing) for instant tab switching
- Extracted ProcessWithRuns/CompletedJob types to shared lib/types/outputs.ts
- Empty outputs tab shows EmptyState with "Ir para Pipeline" action that switches tabs programmatically

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ClientProfileTabs component** - `73a469c` (feat)
2. **Task 2: Restructure profile page with tabs** - `9c168d3` (feat)

**Type fix:** `b73f5a1` (fix budgetUsage type to match PipelineAccordion props)

## Files Created/Modified
- `src/components/clients/client-profile-tabs.tsx` - Client component with Pipeline/Outputs/Briefing tabs
- `src/lib/types/outputs.ts` - Shared CompletedJob and ProcessWithRuns types
- `src/app/(dashboard)/clients/[id]/page.tsx` - Restructured to prefetch outputs data and render ClientProfileTabs
- `src/app/(dashboard)/clients/[id]/outputs/page.tsx` - Re-exports types from shared location
- `src/app/(dashboard)/clients/[id]/outputs/outputs-browser.tsx` - Updated import to shared types

## Decisions Made
- Extracted types to shared location instead of importing from page file (avoids circular/page imports)
- Used controlled Tabs state for programmatic switching from empty outputs CTA
- Kept /clients/[id]/outputs route intact as standalone page (backward compatible)

## Deviations from Plan

### Auto-fixed Issues

**1. [Type mismatch] budgetUsage prop type**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** ClientProfileTabs declared budgetUsage as `Record<string, { used: number; budget: number | null }>` but PipelineAccordion expects `Record<string, { budget: number; used: number; status: string }>`
- **Fix:** Updated type to match PipelineAccordion's expected shape
- **Verification:** `npx tsc --noEmit` passes with 0 errors

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Client profile is now organized into tabs, ready for any future tab additions
- Outputs data is prefetched alongside pipeline data for efficient loading

---
*Phase: 19-ux-polish*
*Completed: 2026-04-09*
