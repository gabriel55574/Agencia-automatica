---
phase: 05-squad-execution-context
plan: 01
subsystem: squad-schemas-parser-assembler
tags: [zod, schemas, output-parser, context-assembler, migration, tdd]
dependency_graph:
  requires: []
  provides: [process-schemas, schema-dispatcher, output-parser, context-assembler, structured-output-column]
  affects: [prompt-templates, worker-pipeline, ui-rendering]
tech_stack:
  added: []
  patterns: [zod-schema-per-process, two-level-json-deserialization, context-truncation-oldest-first, injectable-supabase-client]
key_files:
  created:
    - supabase/migrations/00007_squad_structured_output.sql
    - src/lib/squads/schemas/process-01.ts
    - src/lib/squads/schemas/process-02.ts
    - src/lib/squads/schemas/process-03.ts
    - src/lib/squads/schemas/process-04.ts
    - src/lib/squads/schemas/process-05.ts
    - src/lib/squads/schemas/process-06.ts
    - src/lib/squads/schemas/process-07.ts
    - src/lib/squads/schemas/process-08.ts
    - src/lib/squads/schemas/process-09.ts
    - src/lib/squads/schemas/process-10.ts
    - src/lib/squads/schemas/process-11.ts
    - src/lib/squads/schemas/process-12.ts
    - src/lib/squads/schemas/process-13.ts
    - src/lib/squads/schemas/process-14.ts
    - src/lib/squads/schemas/process-15.ts
    - src/lib/squads/schemas/process-16.ts
    - src/lib/squads/schemas/index.ts
    - src/worker/output-parser.ts
    - src/lib/squads/assembler.ts
    - tests/unit/process-schemas.test.ts
    - tests/unit/output-parser.test.ts
    - tests/unit/assembler.test.ts
  modified:
    - src/lib/database/schema.ts
decisions:
  - "16 individual Zod schema files (one per process) with centralized dispatcher for maintainability"
  - "Two-level JSON deserialization in output-parser: outer CLI envelope then inner result string"
  - "Context assembler uses injectable Supabase client for unit testability without DB dependency"
  - "32K character truncation removes oldest outputs first, keeping most recent phase data"
metrics:
  duration: 7m
  completed: 2026-04-09
---

# Phase 05 Plan 01: Squad Schemas, Output Parser & Context Assembler Summary

16 Zod schemas (one per marketing process) derived from agency-os-prompt.md output checklists, a schema dispatcher, a two-level JSON output parser for Claude CLI results, a context assembler with 32K character truncation, and a DB migration adding structured_output JSONB to squad_jobs.

## What Was Built

### Task 1: DB migration + 16 Zod schemas + schema dispatcher + output parser

**Migration 00007:** Adds `structured_output JSONB` column to `squad_jobs` with a partial index on completed jobs. This column stores validated JSON output after Zod schema parsing (T-05-04: never stores unvalidated JSON).

**16 Process Schemas:** Each file (`process-01.ts` through `process-16.ts`) exports a Zod schema and TypeScript type matching the output checklist from the Agency OS methodology. Field names use snake_case. Schemas enforce required fields with `.min(1)` constraints and use appropriate Zod types (objects, arrays, enums, records, booleans).

**Schema Dispatcher:** `getProcessSchema(N)` maps process numbers 1-16 to their schemas, returns `null` for invalid numbers. The `index.ts` barrel re-exports all schemas and types.

**Output Parser:** Two functions in `src/worker/output-parser.ts`:
- `parseCliOutput(rawStdout)` - Two-level JSON deserialization: finds JSON line in stdout, parses CLI envelope, checks `is_error`, then parses inner `result` string. Returns `null` on any failure (T-05-01).
- `parseStructuredOutput(parsedOutput, processNumber)` - Validates parsed output against the process-specific Zod schema via `safeParse`. Returns typed success/failure result.

Uses relative imports (not `@/` alias) since it runs in the worker process outside Next.js bundler.

### Task 2: Context assembler with truncation

**Assembler:** `assembleContext(clientId, processNumber, supabaseClient?)` collects:
1. Client briefing from `clients` table
2. Completed squad_job outputs from prior phases (excludes same-phase outputs)
3. Orders by phase_number ASC, process_number ASC

**Truncation (D-06):** When total context exceeds 32,000 characters, removes oldest outputs first until within limit. Returns `truncated: true` and metadata (`totalOutputsAvailable`, `outputsIncluded`).

**feedbackContext:** Always empty string in Phase 5 (placeholder for Phase 9 feedback loop).

**Testability:** Accepts optional Supabase client parameter for dependency injection in tests.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| e6f757f | test | Add failing tests for 16 process schemas, dispatcher, and output parser |
| 562b0e5 | feat | Add 16 process Zod schemas, schema dispatcher, output parser, and DB migration |
| 79ef56d | test | Add failing tests for context assembler with truncation |
| bd4b6f5 | feat | Implement context assembler with 32K truncation |

## Test Results

```
Test Files  3 passed (3)
Tests       57 passed (57)
```

- `tests/unit/process-schemas.test.ts` - 38 tests (16 schemas x 2 + 5 dispatcher tests + 1 extra)
- `tests/unit/output-parser.test.ts` - 13 tests (8 parseCliOutput + 5 parseStructuredOutput)
- `tests/unit/assembler.test.ts` - 6 tests (empty outputs, ordering, truncation, feedback, errors, null briefing)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all functions are fully implemented with real logic.

## Self-Check: PASSED

All 10 key files verified present. All 4 commit hashes verified in git log.
