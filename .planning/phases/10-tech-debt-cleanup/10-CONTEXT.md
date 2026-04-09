# Phase 10: Tech Debt Cleanup - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The existing codebase is clean, type-safe, and verified against the live database so that production deployment and feature work can proceed on a solid foundation.

Requirements: DEBT-01, DEBT-02, DEBT-03, DEBT-04
- DEBT-01: Fix tsx missing from package.json devDependencies so worker process can start via PM2
- DEBT-02: Regenerate TypeScript types from live database schema via supabase gen types
- DEBT-03: Execute integration tests against live Supabase instance and fix any failures
- DEBT-04: Remove orphaned ProcessRow export and (admin as any) type casts

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Key technical context:

- tsx was accidentally removed from package.json in commit 2ed9a35 (worktree soft-reset during Phase 4 Plan 02)
- The `worker` npm script (`tsx src/worker/index.ts`) also needs to be restored
- TypeScript types in `src/lib/database/types.ts` were hand-generated because Docker was offline during v1.0 Phase 1
- `(admin as any)` casts exist in `src/lib/actions/gate-review.ts` because gate_reviews table wasn't in generated types
- ProcessRow export in `src/components/clients/process-row.tsx` is dead code (replaced by ProcessAccordionRow in Phase 5)
- Integration tests in `tests/db/` need a running Supabase instance (supabase start)

</decisions>

<code_context>
## Existing Code Insights

### Key Files to Fix
- `package.json` — Add tsx to devDependencies, add worker script
- `src/lib/database/types.ts` — Regenerate from live schema
- `src/lib/actions/gate-review.ts` — Remove (admin as any) casts after type regen
- `src/components/clients/process-row.tsx` — Remove orphaned ProcessRow export
- `tests/db/` — connection.test.ts, schema.test.ts, triggers.test.ts, pipeline.test.ts, squad-jobs.test.ts

### Integration Points
- `ecosystem.config.js` references `node_modules/.bin/tsx` as interpreter
- Worker scripts in `src/worker/` use tsx for TypeScript execution
- All Supabase client operations depend on generated types

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
