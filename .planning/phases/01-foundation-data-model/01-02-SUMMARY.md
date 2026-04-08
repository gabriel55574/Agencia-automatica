---
phase: 01-foundation-data-model
plan: 02
subsystem: database
tags: [postgresql, supabase, migrations, rls, zod, typescript, triggers]

# Dependency graph
requires: []
provides:
  - 6-table PostgreSQL schema (clients, phases, processes, quality_gates, squad_jobs, deliverables)
  - Phase sequence enforcement trigger (enforce_phase_sequence) preventing phase skipping at DB level
  - Row Level Security on all tables (authenticated-only access)
  - claim_next_job() function with FOR UPDATE SKIP LOCKED for concurrent job workers
  - TypeScript domain constants (PHASE_NAMES, PROCESS_TO_PHASE, PROCESS_TO_SQUAD, GATE_TO_PHASE)
  - Status type arrays and TypeScript types for all domain entities
  - Zod v3 schemas for all 6 tables with inferred TypeScript types
  - supabase/seed.sql with demo client and 5 phases for local development
affects:
  - 01-03 (Supabase client setup -- needs schema in place)
  - All future phases (schemas and types are the canonical data model)

# Tech tracking
tech-stack:
  added:
    - Supabase CLI (supabase init, local dev config)
    - moddatetime PostgreSQL extension (auto-updates updated_at columns)
    - Zod v3 (schema validation and TypeScript inference)
  patterns:
    - "TEXT + CHECK constraints for status columns (not PostgreSQL ENUM types -- easier to extend)"
    - "TIMESTAMPTZ for all timestamps (timezone-aware)"
    - "UUID primary keys via gen_random_uuid() (no external dependency)"
    - "ON DELETE CASCADE for all child tables (clients -> phases -> processes/quality_gates/squad_jobs)"
    - "Status arrays as const in TypeScript mirroring SQL CHECK values (single source of truth)"
    - "Zod schemas infer TypeScript types -- no hand-written interfaces"

key-files:
  created:
    - supabase/config.toml
    - supabase/migrations/00001_initial_schema.sql
    - supabase/migrations/00002_phase_enforcement.sql
    - supabase/migrations/00003_rls_policies.sql
    - supabase/seed.sql
    - src/lib/database/enums.ts
    - src/lib/database/schema.ts
  modified: []

key-decisions:
  - "Used TEXT+CHECK for status columns instead of PostgreSQL ENUM to allow future extension without ALTER TYPE migrations"
  - "Phase enforcement trigger fires on both BEFORE UPDATE and BEFORE INSERT to prevent any bypass path"
  - "claim_next_job() uses FOR UPDATE SKIP LOCKED to handle concurrent BullMQ workers safely"
  - "RLS uses USING(true) / WITH CHECK(true) for solo operator -- acceptable for v1, documented for future tightening"
  - "Zod enum values in schema.ts reference the const arrays from enums.ts (DRY -- single source of truth)"

patterns-established:
  - "Pattern 1: Status constants in enums.ts are used in both z.enum() calls and SQL CHECK constraints"
  - "Pattern 2: Child tables reference parent with ON DELETE CASCADE (clients -> everything)"
  - "Pattern 3: moddatetime extension handles updated_at triggers -- no custom trigger function needed"

requirements-completed: [FOUN-02, FOUN-03]

# Metrics
duration: 12min
completed: 2026-04-08
---

# Phase 1 Plan 02: Database Schema & Domain Constants Summary

**PostgreSQL 6-table Agency OS schema with phase sequence enforcement triggers, RLS policies, and TypeScript Zod schemas mirroring the 5-phase/16-process/4-squad/4-gate domain model**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-08T18:19:00Z
- **Completed:** 2026-04-08T18:31:00Z
- **Tasks:** 2 of 2
- **Files created:** 7

## Accomplishments

- Complete 6-table PostgreSQL schema with UUID primary keys, TIMESTAMPTZ timestamps, TEXT+CHECK status constraints, and ON DELETE CASCADE foreign keys
- Phase sequence enforcement trigger (enforce_phase_sequence) fires on BOTH BEFORE UPDATE and BEFORE INSERT on the phases table -- phase skipping is structurally impossible at the DB level
- RLS enabled on all 6 tables with SELECT/INSERT/UPDATE/DELETE policies for authenticated role
- TypeScript domain constants in enums.ts define all 5 phase names, 16 process-to-phase mappings, 16 process-to-squad mappings, and 4 gate-to-phase mappings
- Zod v3 schemas in schema.ts mirror all database tables with inferred TypeScript types

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migrations -- schema, phase enforcement trigger, and RLS** - `b6cefbe` (feat)
2. **Task 2: TypeScript domain enums, Zod schemas, and constants** - `a85eb19` (feat)

## Files Created/Modified

- `supabase/config.toml` - Supabase local dev configuration (via supabase init)
- `supabase/migrations/00001_initial_schema.sql` - 6-table schema with moddatetime triggers and indexes
- `supabase/migrations/00002_phase_enforcement.sql` - enforce_phase_sequence trigger + claim_next_job() function
- `supabase/migrations/00003_rls_policies.sql` - RLS enabled + 4 policies per table (SELECT/INSERT/UPDATE/DELETE)
- `supabase/seed.sql` - Demo client with 5 phases for local development
- `src/lib/database/enums.ts` - Domain constants: PHASE_NAMES, PROCESS_TO_PHASE, PROCESS_TO_SQUAD, GATE_TO_PHASE, all status arrays and types
- `src/lib/database/schema.ts` - Zod v3 schemas for all 6 tables, TypeScript types inferred from schemas

## Decisions Made

- TEXT+CHECK constraints for status columns instead of PostgreSQL ENUM types: allows adding new statuses with a simple ALTER TABLE column change rather than ALTER TYPE migration
- Phase enforcement on both UPDATE and INSERT triggers: prevents any bypass path (direct SQL insert of an active phase out of order)
- claim_next_job() with FOR UPDATE SKIP LOCKED: enables concurrent BullMQ workers in Phase 4 without race conditions
- RLS USING(true) / WITH CHECK(true) for authenticated role: appropriate for solo operator v1; documented for future multi-user tightening
- Zod enum values reference const arrays from enums.ts: a single source of truth -- changing a status value requires one change, not two

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria met:
- 6 CREATE TABLE statements in 00001
- enforce_phase_sequence in 00002 (6 references)
- 6 ENABLE ROW LEVEL SECURITY in 00003
- claim_next_job() with FOR UPDATE SKIP LOCKED
- All UNIQUE constraints (client_id/phase_number, phase_id/process_number, phase_id/gate_number)
- All 18 TIMESTAMPTZ usages
- All required enums.ts exports (PHASE_NAMES, PROCESS_TO_PHASE x16, PROCESS_TO_SQUAD x16, GATE_TO_PHASE x4)
- All required schema.ts exports (7 schemas, 7 inferred types)

## Issues Encountered

None - supabase CLI available, all migrations written correctly on first pass.

## User Setup Required

None - no external service configuration required for schema files. When running locally, `supabase start` will apply migrations and run seed.sql automatically.

## Next Phase Readiness

- Schema is complete and ready for plan 01-03 (Supabase client setup, auth helpers)
- enums.ts and schema.ts are ready for use throughout the application
- seed.sql provides a demo client for verifying client setup in plan 01-03
- No blockers

---
*Phase: 01-foundation-data-model*
*Completed: 2026-04-08*
