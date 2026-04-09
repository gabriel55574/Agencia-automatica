---
phase: 03-pipeline-engine
plan: "01"
subsystem: pipeline-config
tags: [process-definitions, shadcn-ui, tdd, test-infrastructure]
dependency_graph:
  requires: []
  provides:
    - PROCESS_DEFINITIONS (src/lib/pipeline/processes.ts)
    - Accordion UI primitive (src/components/ui/accordion.tsx)
    - Dialog UI primitive (src/components/ui/dialog.tsx)
    - Checkbox UI primitive (src/components/ui/checkbox.tsx)
    - Pipeline DB test stubs (tests/db/pipeline.test.ts)
    - DB test helper fixture (tests/db/helpers.ts)
  affects:
    - Plan 03-02 (pipeline accordion view depends on PROCESS_DEFINITIONS and Accordion component)
tech_stack:
  added: []
  patterns:
    - TDD red/green cycle (test first, implement second)
    - shadcn/ui copy-paste pattern with radix-ui imports and data-slot attributes
    - it.todo() Wave 0 stubs to establish test structure without failing suites
key_files:
  created:
    - src/lib/pipeline/processes.ts
    - src/components/ui/accordion.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/checkbox.tsx
    - tests/unit/processes-config.test.ts
    - tests/db/pipeline.test.ts
    - tests/db/helpers.ts
  modified: []
decisions:
  - Sub-processes (Ries/Trout complemento steps for Process 3) included as steps within parent process, not as separate entries — maintains exactly 16 process entries
  - Accordion animation classes use data-[state=open]:animate-accordion-down / data-[state=closed]:animate-accordion-up (standard shadcn pattern; animation keyframes to be defined in tailwind config when needed)
  - Dialog uses combined translate/animate pattern matching alert-dialog.tsx for consistency
metrics:
  duration_seconds: 329
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_created: 7
  files_modified: 0
---

# Phase 3 Plan 1: Process Definitions and UI Primitives Summary

**One-liner:** Static PROCESS_DEFINITIONS config for all 16 Agency OS processes plus three shadcn/ui Radix UI wrappers (Accordion, Dialog, Checkbox) built via TDD with Wave 0 pipeline integration test stubs.

## What Was Built

**Task 1 (RED phase — TDD):** Created Wave 0 test stubs establishing the test infrastructure for Plan 03-02 integration tests. `tests/unit/processes-config.test.ts` contained 4 failing tests (module not found — correct RED state). `tests/db/pipeline.test.ts` contained PIPE-01 through PIPE-04 describe blocks with `it.todo()` stubs (suite passes, nothing fails). `tests/db/helpers.ts` provides the `createTestClientWithProcesses()` fixture reused across DB tests.

**Task 2 (GREEN phase — TDD):** Created `src/lib/pipeline/processes.ts` with the `ProcessDefinition` type and all 16 process definitions populated from `docs/agency-os-prompt.md`. Phase/squad assignments align exactly with `PROCESS_TO_PHASE` and `PROCESS_TO_SQUAD` from `enums.ts`. All 4 unit tests turned green. Created three shadcn/ui wrapper components following the exact pattern from `alert-dialog.tsx`: radix-ui package import (not @radix-ui/*), `data-slot` attributes on every sub-component, `cn()` for className merging.

## Test Results

- `tests/unit/` (all 5 files): 25/25 tests passing
- `tests/db/pipeline.test.ts`: 8 todos (suite skipped — correct Wave 0 behavior)
- TypeScript: no errors in new files

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 58dd869 | test | Wave 0 test stubs — processes-config (RED), pipeline stubs, helpers |
| e15d7a2 | feat | PROCESS_DEFINITIONS (16 processes) and shadcn/ui wrappers |

## Deviations from Plan

None — plan executed exactly as written. The TDD red/green cycle proceeded as specified. All 16 process names match `docs/agency-os-prompt.md` exactly. Phase and squad alignments match `enums.ts`.

## Known Stubs

None — PROCESS_DEFINITIONS is fully populated with real content from the Agency OS methodology document. No placeholder data, no TODOs, no empty arrays.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. PROCESS_DEFINITIONS is read-only static data with no user input surface.

## Self-Check: PASSED

- [x] src/lib/pipeline/processes.ts exists
- [x] src/components/ui/accordion.tsx exists
- [x] src/components/ui/dialog.tsx exists
- [x] src/components/ui/checkbox.tsx exists
- [x] tests/unit/processes-config.test.ts exists
- [x] tests/db/pipeline.test.ts exists
- [x] tests/db/helpers.ts exists
- [x] Commit 58dd869 exists (task 1)
- [x] Commit e15d7a2 exists (task 2)
- [x] 25/25 unit tests pass
- [x] 8 todos in pipeline stubs (no failures)
