---
phase: 07-document-management
plan: 01
subsystem: ui
tags: [react, next.js, supabase, shadcn, tabs, accordion, blob-api, document-viewer]

# Dependency graph
requires:
  - phase: 05-squad-execution-context
    provides: StructuredOutputView component and squad_jobs table with output/structured_output columns
  - phase: 03-pipeline-engine
    provides: PROCESS_DEFINITIONS, PHASE_NAMES, Accordion UI component
provides:
  - /clients/[id]/outputs page for browsing completed squad outputs by phase/process
  - RunHistoryList component for per-process run history display
  - OutputViewer component with Structured/Raw tabs and raw .txt download
  - OutputsBrowser client component managing split layout state
  - shadcn Tabs UI component
affects: [07-document-management, 08-dashboard]

# Tech tracking
tech-stack:
  added: [shadcn/ui tabs]
  patterns: [RSC data fetch + client component wrapper for interactive state, Blob API file download with sanitized filename]

key-files:
  created:
    - src/app/(dashboard)/clients/[id]/outputs/page.tsx
    - src/app/(dashboard)/clients/[id]/outputs/outputs-browser.tsx
    - src/components/documents/RunHistoryList.tsx
    - src/components/documents/OutputViewer.tsx
    - src/components/ui/tabs.tsx
  modified:
    - src/app/(dashboard)/clients/[id]/page.tsx

key-decisions:
  - "OutputsBrowser as separate client component wrapper to keep outputs page as RSC for data fetching"
  - "Split layout 40/60 when run selected, full-width accordion when no selection"
  - "Reuse StructuredOutputView from Phase 5 directly in Structured tab"

patterns-established:
  - "RSC + client wrapper pattern: RSC fetches data, passes to client component for interactive state management"
  - "Blob API download with filename sanitization: replace non-alphanumeric with hyphens, lowercase, truncate to 100 chars"

requirements-completed: [DOCS-01, DOCS-02, DOCS-04]

# Metrics
duration: 4min
completed: 2026-04-09
---

# Phase 7 Plan 1: Outputs Browsing and Inline Viewer Summary

**Outputs browsing page with phase/process accordion, inline OutputViewer with Structured/Raw tabs, and raw .txt download via Blob API**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-09T15:28:26Z
- **Completed:** 2026-04-09T15:32:44Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built /clients/[id]/outputs page as RSC that fetches completed squad_jobs and groups them by phase/process in an accordion layout
- Created RunHistoryList with date, duration, structured/raw badge, and View button for each completed run
- Built OutputViewer with Structured tab (reusing StructuredOutputView from Phase 5) and Raw tab (scrollable pre block)
- Implemented Download Raw (.txt) button using Blob API with sanitized filenames (T-07-02 mitigation)
- Added "View All Outputs" link to client profile page replacing the placeholder section
- Installed shadcn Tabs component for Structured/Raw toggle

## Task Commits

Each task was committed atomically:

1. **Task 1: Outputs page with phase accordion and run history** - `8cad3b3` (feat)
2. **Task 2: Inline OutputViewer with Structured/Raw tabs and raw download** - `0e7c778` (feat)

## Files Created/Modified
- `src/app/(dashboard)/clients/[id]/outputs/page.tsx` - RSC outputs page fetching completed squad_jobs, grouped by phase/process
- `src/app/(dashboard)/clients/[id]/outputs/outputs-browser.tsx` - Client component managing selectedRun state and split layout
- `src/components/documents/RunHistoryList.tsx` - Per-process run history with date, duration, badges, View button
- `src/components/documents/OutputViewer.tsx` - Full-width panel with Structured/Raw tabs and Download Raw button
- `src/components/ui/tabs.tsx` - shadcn Tabs component (auto-generated)
- `src/app/(dashboard)/clients/[id]/page.tsx` - Added View All Outputs link replacing placeholder section

## Decisions Made
- Used a separate OutputsBrowser client component to keep the outputs page.tsx as an RSC for server-side data fetching, passing serialized data down
- Split layout uses 40/60 ratio when a run is selected (accordion left, viewer right), full width when no selection
- Reused StructuredOutputView from Phase 5 directly in the Structured tab rather than creating a new renderer
- Only phases with completed runs are shown (empty phases hidden) per Claude's Discretion from CONTEXT.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Known Stubs

- `OutputViewer.tsx` line 133: Comment placeholder `{/* PDF export button added by Plan 02 */}` -- intentional, will be implemented in Plan 07-02

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- OutputViewer is ready for Plan 02 to add PDF export button alongside the Download Raw button
- The `src/components/documents/` directory is established for future document management components
- All threat mitigations applied: no dangerouslySetInnerHTML (T-07-01), sanitized download filenames (T-07-02)

## Self-Check: PASSED

- All 5 created files verified on disk
- Both task commits (8cad3b3, 0e7c778) verified in git log
- TypeScript compiles with zero errors
- All acceptance criteria pass (14/14)

---
*Phase: 07-document-management*
*Completed: 2026-04-09*
