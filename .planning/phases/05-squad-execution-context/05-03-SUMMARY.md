---
phase: 05-squad-execution-context
plan: 03
subsystem: ui
tags: [react, squad-ui, dialog, structured-output, pipeline-accordion, server-actions]

# Dependency graph
requires:
  - phase: 05-squad-execution-context
    provides: "Plan 01: assembler, output-parser, schemas, structured_output column"
  - phase: 05-squad-execution-context
    provides: "Plan 02: assembleSquadContext, confirmSquadRun Server Actions, prompt templates"
provides:
  - "RunSquadButton component with D-01/D-03 visibility rules"
  - "PromptPreviewModal with Confirm & Run flow"
  - "StructuredOutputView with View Raw toggle"
  - "Extended ProcessAccordionRow with squad trigger + output display"
  - "Client page passes latestJobs (including structured_output) through accordion"
affects: [dashboard, future squad monitoring, phase-6-quality-gates]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Client component boundary at PipelineAccordion for modal state", "Callback prop drilling for onAssembled (RunSquadButton -> PipelinePhase -> PipelineAccordion)", "FieldValue recursive renderer for structured JSON output"]

key-files:
  created:
    - src/components/squad/RunSquadButton.tsx
    - src/components/squad/PromptPreviewModal.tsx
    - src/components/squad/StructuredOutputView.tsx
  modified:
    - src/components/clients/process-row.tsx
    - src/components/clients/pipeline-phase.tsx
    - src/components/clients/pipeline-accordion.tsx
    - src/lib/types/pipeline.ts
    - src/lib/database/types.ts
    - src/app/(dashboard)/clients/[id]/page.tsx

key-decisions:
  - "PipelineAccordion is the modal state boundary -- previewData lives there, passed down via onAssembled callback"
  - "Removed standalone ProcessJobsSection from client page -- accordion now handles squad trigger + status + output inline"
  - "Manually added structured_output to generated Supabase types since migration 00007 not yet pushed (Rule 3)"

patterns-established:
  - "Squad component pattern: RunSquadButton assembles context, parent callback opens modal, modal confirms"
  - "StructuredOutputView pattern: render structured fields with FieldValue recursive renderer, fallback to raw pre block"
  - "Inline job status in accordion trigger: queued/running/failed badges next to process status"

requirements-completed: [SQAD-01, SQAD-07]

# Metrics
duration: 6min
completed: 2026-04-09
---

# Phase 05 Plan 03: Squad Execution UI Summary

**RunSquadButton + PromptPreviewModal + StructuredOutputView wired into pipeline accordion with D-01/D-03 visibility rules and Confirm & Run flow**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-09T14:26:33Z
- **Completed:** 2026-04-09T14:33:08Z
- **Tasks:** 2 completed, 1 checkpoint pending
- **Files modified:** 9

## Accomplishments
- Built RunSquadButton with full visibility logic (process status, active phase, no in-flight job) and assembleSquadContext integration
- Built PromptPreviewModal with truncation warning banner, context summary, full prompt display, and Confirm & Run flow via confirmSquadRun Server Action
- Built StructuredOutputView with recursive field rendering and View Raw/View Structured toggle
- Extended ProcessAccordionRow with squad trigger button, job status badges (running/queued/failed), and completed output display
- Wired latestJobs data (including structured_output and output) from server page through PipelineAccordion -> PipelinePhase -> ProcessAccordionRow
- Removed standalone ProcessJobsSection from client page since accordion now handles everything inline

## Task Commits

Each task was committed atomically:

1. **Task 1: RunSquadButton component + visibility logic** - `ad3f65b` (feat)
2. **Task 2: PromptPreviewModal + StructuredOutputView + pipeline wiring** - `cd58023` (feat)
3. **Task 3: End-to-end verification** - CHECKPOINT (see below)

## Checkpoint: Human Verification Required

**Task 3 is a checkpoint:human-verify task.** The operator needs to:

1. **Run `supabase db push`** to apply migration 00007 (adds structured_output JSONB column to squad_jobs)
2. **Start the app:** `npm run dev` and `npm run worker`
3. **Verify end-to-end:**
   - Navigate to a client profile page with an active phase
   - Confirm "Run Squad" button appears on eligible process rows (active/pending, active phase, no in-flight job)
   - Click "Run Squad" and verify preview modal shows squad name, context summary, full prompt
   - If context was truncated, verify yellow warning banner appears
   - Click "Confirm & Run" and verify a squad_jobs row is created with status='queued'
   - After worker processes the job, verify structured output displays in the process accordion
   - Toggle "View Raw" to verify raw output fallback works
4. **Run full test suite:** `npm run test -- --run` (unit tests should pass; DB tests require running Supabase)

## Files Created/Modified
- `src/components/squad/RunSquadButton.tsx` - Squad trigger button with D-01/D-03 visibility and assembleSquadContext call
- `src/components/squad/PromptPreviewModal.tsx` - Read-only preview modal with Confirm & Run Server Action flow
- `src/components/squad/StructuredOutputView.tsx` - Renders structured_output fields or raw output fallback with toggle
- `src/components/clients/process-row.tsx` - Extended ProcessAccordionRow with squad trigger + job status + output display
- `src/components/clients/pipeline-phase.tsx` - Passes latestJobs and onAssembled to ProcessAccordionRow
- `src/components/clients/pipeline-accordion.tsx` - Modal state boundary, renders PromptPreviewModal
- `src/lib/types/pipeline.ts` - Added LatestJobData type
- `src/lib/database/types.ts` - Added structured_output to squad_jobs Row/Insert/Update types
- `src/app/(dashboard)/clients/[id]/page.tsx` - Extended query to fetch structured_output/output, passes latestJobs to accordion

## Decisions Made
- PipelineAccordion is the client component boundary holding modal state (previewData). The onAssembled callback flows down through PipelinePhase to each ProcessAccordionRow's RunSquadButton.
- Removed standalone ProcessJobsSection from the client page template since the accordion now incorporates trigger + status + output display inline -- avoids duplicate UI.
- Manually added structured_output to the generated Supabase types file since migration 00007 hasn't been pushed to the live DB yet. Types should be regenerated after `supabase db push` + `supabase gen types`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added structured_output to generated Supabase types**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** The generated types.ts did not include the structured_output column from migration 00007 (not yet pushed to DB), causing TypeScript errors when querying it
- **Fix:** Manually added `structured_output: Json | null` to squad_jobs Row, Insert, and Update types
- **Files modified:** src/lib/database/types.ts
- **Verification:** TypeScript compiles clean with zero errors
- **Committed in:** cd58023 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for TypeScript compilation. Types should be regenerated after DB push.

## Issues Encountered
- DB integration tests (tests/db/) fail because they require a running Supabase instance -- pre-existing, not caused by this plan's changes. Unit tests (121) all pass.

## Threat Surface Scan

T-05-11 mitigated: All StructuredOutputView and PromptPreviewModal render text as React text nodes only. No dangerouslySetInnerHTML used anywhere. FieldValue recursive renderer outputs text via `<span>` elements and JSON.stringify for complex nested values.

T-05-12 mitigated: RunSquadButton disables itself during loading state (assembleSquadContext call). D-03 visibility rule also hides button when a job is queued or running.

## Next Phase Readiness
- Full squad execution UI loop is complete: trigger -> preview -> confirm -> queue -> output display
- Awaiting operator verification (Task 3 checkpoint) for final sign-off
- After verification, Phase 5 is complete and Phase 6 (quality gates) can begin

## Self-Check: PASSED

All 9 files verified present. Both commit hashes verified in git log.

---
*Phase: 05-squad-execution-context*
*Completed: 2026-04-09*
