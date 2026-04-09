---
phase: 02-client-management
plan: 02
subsystem: ui, api
tags: [nextjs, supabase, shadcn, react-hook-form, zod, server-actions, typescript]

# Dependency graph
requires:
  - phase: 02-client-management
    plan: 01
    provides: [createClientAction, ClientForm, briefingSchema, clientInsertSchema, alert-dialog, shadcn/ui scaffold, createClient/createAdminClient helpers]
provides:
  - updateClientAction Server Action (auth + field validation + admin UPDATE for name/company/briefing)
  - archiveClientAction Server Action (soft archive — sets status='archived', redirects to /clients)
  - restoreClientAction Server Action (sets status='active', redirects to profile)
  - PipelineTimeline component (5-phase vertical list with status badges and date display)
  - ArchiveDialog component (shadcn AlertDialog for archive confirmation; Restore button for archived clients)
  - /clients/[id] RSC profile page (header, briefing, pipeline timeline, outputs placeholder)
  - /clients/[id]/edit RSC page with pre-populated ClientForm in edit mode
  - 10 new unit tests (edit validation + archive contracts) — all passing
affects:
  - Any phase that links to /clients/[id] or /clients/[id]/edit
  - Phase 3 pipeline engine (will read/update phase rows displayed in PipelineTimeline)
  - Phase 7 outputs display (Outputs section placeholder already wired in profile page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Profile page data: Promise.all() for parallel client + phases fetches in RSC"
    - "parseBriefing() type guard: check typeof raw !== 'object' || Array.isArray before casting Json to Record"
    - "ArchiveDialog: useTransition for async Server Action calls in client component; error state inline below button"
    - "Edit page: RSC fetches client, parses JSON briefing, passes flat defaultValues to ClientForm"
    - "ClientForm edit mode: mode === 'edit' && clientId guards before calling updateClientAction"

key-files:
  created:
    - src/components/clients/pipeline-timeline.tsx
    - src/components/clients/archive-dialog.tsx
    - "src/app/(dashboard)/clients/[id]/page.tsx"
    - "src/app/(dashboard)/clients/[id]/edit/page.tsx"
    - tests/unit/edit-action.test.ts
    - tests/unit/archive-action.test.ts
  modified:
    - src/lib/actions/clients.ts (added updateClientAction, archiveClientAction, restoreClientAction)
    - src/components/clients/client-form.tsx (wired updateClientAction for edit mode)

key-decisions:
  - "Archive is soft-delete only: UPDATE status='archived', all data preserved, restorable via restoreClientAction"
  - "SECURITY: updateClientAction never touches current_phase_number, status, or cycle_number — only name/company/briefing"
  - "parseBriefing() used in both profile page (returns null if missing) and edit page (returns {} if missing) — different defaults by design"
  - "node_modules symlinked from main project to worktree — dotenv installed in main project as dev dependency"

# Metrics
duration: ~30min
completed: 2026-04-08
---

# Phase 2 Plan 02: Profile, Edit, Archive Summary

**Client profile page, edit page, archive/restore dialog, PipelineTimeline component — all wired with Server Actions, 21 unit tests passing, build succeeds with /clients/[id] and /clients/[id]/edit routes**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-08T23:00:00Z
- **Completed:** 2026-04-08T23:30:00Z
- **Tasks:** 4 (1-1, 1-2, 1-3, 2-1, 2-2 — counting from plan structure)
- **Files modified/created:** 8

## Accomplishments

- Extended `clients.ts` with three new Server Actions: `updateClientAction` (auth + validation + selective UPDATE), `archiveClientAction` (soft archive), `restoreClientAction`
- Built `PipelineTimeline` server component: 5-phase vertical list with Active/Completed/Pending badges, pt-BR date formatting, active phase highlighted with blue left-border accent
- Built `ArchiveDialog` client component: shadcn AlertDialog for archive confirmation; shows "Restore client" button for archived clients
- Built `/clients/[id]` RSC profile page: header (name + status badge + Edit/Archive buttons), Briefing section (rendered as text nodes per T-2-02-05), Pipeline Timeline, Outputs placeholder
- Built `/clients/[id]/edit` RSC page: fetches client, parses briefing JSON, pre-populates ClientForm in edit mode
- Wired `updateClientAction` into ClientForm: edit mode branch replaces the `// edit mode handled in Plan 02-02` placeholder
- 21 unit tests passing (11 from 02-01 + 10 new tests for edit validation + archive contracts)
- Next.js build succeeds with both new routes

## Task Commits

1. **1-1: Server Actions extension** - `65b4e89` (feat)
2. **1-2: PipelineTimeline component** - `c7ceac9` (feat)
3. **1-3: ArchiveDialog component** - `fd1c05a` (feat)
4. **2-1: /clients/[id] profile page** - `489838e` (feat)
5. **2-2: /clients/[id]/edit page + ClientForm wire** - `6e5dccc` (feat)

## Files Created/Modified

- `src/lib/actions/clients.ts` — 3 new Server Actions appended (updateClientAction, archiveClientAction, restoreClientAction)
- `src/components/clients/pipeline-timeline.tsx` — new server component
- `src/components/clients/archive-dialog.tsx` — new client component
- `src/app/(dashboard)/clients/[id]/page.tsx` — new RSC profile page
- `src/app/(dashboard)/clients/[id]/edit/page.tsx` — new RSC edit page
- `src/components/clients/client-form.tsx` — wired updateClientAction for edit mode
- `tests/unit/edit-action.test.ts` — 7 new unit tests
- `tests/unit/archive-action.test.ts` — 3 new unit tests

## Decisions Made

- **updateClientAction field restriction:** Only `name`, `company`, `briefing` are in the UPDATE statement. `current_phase_number`, `status`, and `cycle_number` are never updated here (T-2-02-01 mitigation). This is enforced structurally, not by validation.
- **parseBriefing() returns null vs {}:** Profile page returns `null` (shows "No briefing information" empty state) while edit page returns `{}` with empty strings (pre-populates form with blank values — prevents undefined in controlled inputs).
- **node_modules symlink:** Worktree had an empty node_modules directory. Symlinked to main project's node_modules. Also installed `dotenv` in main project (was missing from package.json, existed only in tests/setup.ts import).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] node_modules symlink + dotenv installation**
- **Found during:** Task 1-1 (running unit tests)
- **Issue:** Worktree had an empty `node_modules` directory (only `.vite` dir). Tests failed with "Cannot find package 'dotenv'" because `dotenv` was imported in `tests/setup.ts` but not installed in the main project's `node_modules`.
- **Fix:** Removed the empty worktree node_modules directory, created a symlink to the main project's `node_modules`. Installed `dotenv` in the main project as a dev dependency.
- **Files modified:** `package.json` (main project, added dotenv)
- **Committed in:** `65b4e89` (part of task 1-1 commit)

**2. [Rule 1 - Bug] Fixed ClientForm clientId prop name (_clientId vs clientId)**
- **Found during:** Task 2-2 (wiring updateClientAction)
- **Issue:** `client-form.tsx` destructured `clientId` as `_clientId` (prefixed with underscore to suppress unused warning, since edit mode wasn't wired yet). Needed to rename to `clientId` to use in `updateClientAction(clientId, fd)`.
- **Fix:** Changed `clientId: _clientId` to `clientId` in the destructuring.
- **Files modified:** `src/components/clients/client-form.tsx`
- **Committed in:** `6e5dccc`

## Known Stubs

**Outputs section placeholder** — `/clients/[id]/page.tsx` line ~100: The "Outputs" section renders only static placeholder text: "Outputs will appear here as squads complete processes." This is intentional per plan D-04/CONTEXT.md — real outputs will be wired in Phase 7 when squad execution is implemented. The stub is documented and does not prevent the plan's goal (CLNT-02/03/04) from being achieved.

## Threat Surface Scan

No new security surface introduced beyond what was planned in the threat model. All planned mitigations implemented:
- T-2-02-01/02: `updateClientAction` validates all fields and restricts UPDATE to name/company/briefing only
- T-2-02-03: archive/restore only update status field
- T-2-02-04: `notFound()` called in both profile and edit pages for missing client IDs
- T-2-02-05: All briefing fields rendered as React text nodes (no `dangerouslySetInnerHTML`)
- T-2-02-07: Both new pages inside `(dashboard)` layout (auth-protected)

---
*Phase: 02-client-management*
*Completed: 2026-04-08*

## Self-Check: PASSED

Files verified on disk:
- FOUND: src/lib/actions/clients.ts (extended with 3 new actions)
- FOUND: src/components/clients/pipeline-timeline.tsx
- FOUND: src/components/clients/archive-dialog.tsx
- FOUND: src/app/(dashboard)/clients/[id]/page.tsx
- FOUND: src/app/(dashboard)/clients/[id]/edit/page.tsx
- FOUND: tests/unit/edit-action.test.ts
- FOUND: tests/unit/archive-action.test.ts

Commits verified:
- FOUND: 65b4e89 (feat(02-02): add updateClientAction, archiveClientAction, restoreClientAction)
- FOUND: c7ceac9 (feat(02-02): build PipelineTimeline component)
- FOUND: fd1c05a (feat(02-02): build ArchiveDialog component)
- FOUND: 489838e (feat(02-02): build /clients/[id] profile page)
- FOUND: 6e5dccc (feat(02-02): build /clients/[id]/edit page and wire updateClientAction)

Unit tests: 21/21 passing (all unit tests in tests/unit/).
TypeScript: 0 errors (npx tsc --noEmit).
Next.js build: succeeds with /clients/[id] and /clients/[id]/edit routes.
