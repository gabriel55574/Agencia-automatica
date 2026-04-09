---
plan: 03-02
phase: 03-pipeline-engine
status: completed
completed_at: 2026-04-09
executor: inline (main context — subagent lacked Bash access)
tasks_completed: 3/3
checkpoint: auto-approved (auto_advance=true)
---

## What Was Built

Full pipeline engine — DB layer, Server Actions, TypeScript types, and accordion UI replacing PipelineTimeline on the client profile.

## Key Files Created

- `supabase/migrations/00005_initialize_client_processes.sql` — extended `create_client_with_phases` to seed 16 process rows + 4 quality_gate rows atomically
- `supabase/migrations/00006_gate_actions.sql` — `approve_gate` and `reject_gate` PostgreSQL functions with `SELECT FOR UPDATE` row locking
- `src/lib/types/pipeline.ts` — `PhaseRow`, `ProcessRow`, `GateRow` TypeScript types
- `src/lib/actions/gates.ts` — `approveGateAction`, `rejectGateAction` Server Actions with auth, Zod validation, admin RPC
- `src/components/clients/process-row.tsx` — expandable process row (status badge + definition panel)
- `src/components/clients/gate-section.tsx` — Approve Gate (AlertDialog) + Reject Gate (Dialog with checkboxes)
- `src/components/clients/pipeline-phase.tsx` — single phase accordion item
- `src/components/clients/pipeline-accordion.tsx` — top-level accordion, auto-expands active phase
- `src/app/(dashboard)/clients/[id]/page.tsx` — updated to fetch processes + quality_gates, renders PipelineAccordion

## Key Decisions

- **Array fix**: PostgreSQL PL/pgSQL doesn't support `INTO v_phase_ids[i]` subscript assignment — used temp variable + array append (`v_phase_ids := v_phase_ids || v_temp_phase_id`)
- **RPC types**: Supabase generated types only know about `create_client_with_phases`; used `(admin.rpc as any)` cast until types are regenerated
- **Test parallelism**: Added `fileParallelism: false` to vitest.config.ts — parallel test files with shared DB state caused cascade failures
- **Migrations via MCP**: Supabase CLI couldn't link (wrong project ref in CLI); used `mcp__supabase-velocity__apply_migration` instead

## Deviations

- Executed inline in main context (not subagent) — subagent reported no Bash access
- `supabase db push` replaced by MCP `apply_migration` calls

## Verification

- `npm test -- tests/db/` → 30/30 pass (all files sequential)
- `npx tsc --noEmit` → 0 errors
- `npm run build` → exits 0, all routes dynamic/static as expected

## Self-Check: PASSED
