---
phase: 02-client-management
plan: 01
subsystem: ui, database, api
tags: [nextjs, supabase, shadcn, react-hook-form, zod, plpgsql, server-actions, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-data-model
    provides: [6-table PostgreSQL schema (clients + phases tables), supabase client helpers, Zod schema file, TypeScript Database types]
provides:
  - shadcn/ui component library (card, badge, button, form, input, textarea, label, alert-dialog, separator, sonner)
  - PL/pgSQL RPC function create_client_with_phases (atomic 1 client + 5 phases insert)
  - briefingSchema Zod schema with typed niche/target_audience/additional_context fields
  - createClientAction Server Action (validated, auth-checked, RPC-backed)
  - /clients RSC page with active/archived card grid and URL-param toggle
  - /clients/new page with ClientForm intake form (react-hook-form + Zod)
  - 11 unit tests (briefing + client insert schemas) — all passing
  - 8 integration tests for client DB operations (CLNT-01 to CLNT-04) — ready to run once migration applied
affects:
  - 02-02 (client profile + edit + archive actions build on these foundations)
  - Any phase that creates clients or reads the clients table

# Tech tracking
tech-stack:
  added:
    - react-hook-form ^7.x — form state management with Zod resolver
    - "@hookform/resolvers" — Zod integration for react-hook-form
    - date-fns ^4.x — formatDistanceToNow for last activity display
    - lucide-react — icons (installed, not yet used)
    - clsx + tailwind-merge — cn() utility for shadcn
    - class-variance-authority — shadcn component variants
    - dotenv — test env loading from .env.local for cloud Supabase
    - shadcn/ui (New York style, Zinc base) — card, badge, button, form, input, textarea, label, alert-dialog, separator, sonner
  patterns:
    - "Server Action pattern: use server + auth check via createClient() + z.safeParse() + admin.rpc() + revalidatePath + redirect"
    - "RSC data fetch: createClient() (anon key + session) + chained query builder + await searchParams for URL params"
    - "Client component toggle: useRouter().push() with URLSearchParams to update show_archived URL param"
    - "TypeScript types: Database['public']['Tables'] must include Relationships: [] on each table to satisfy supabase-js GenericTable constraint"
    - "Integration tests: load .env.local via dotenv in tests/setup.ts for cloud Supabase access"

key-files:
  created:
    - supabase/migrations/00004_create_client_with_phases.sql
    - src/lib/actions/clients.ts
    - src/components/clients/client-card.tsx
    - src/components/clients/client-grid.tsx
    - src/components/clients/client-form.tsx
    - "src/app/(dashboard)/clients/page.tsx"
    - "src/app/(dashboard)/clients/new/page.tsx"
    - src/lib/utils.ts
    - src/components/ui/ (10 shadcn components)
    - tests/unit/briefing-schema.test.ts
    - tests/unit/client-schema.test.ts
    - tests/db/clients.test.ts
    - components.json
  modified:
    - src/lib/database/schema.ts (briefingSchema + BriefingInsert added; clientInsertSchema.briefing tightened)
    - src/lib/database/types.ts (Relationships added to all tables; Views type fixed; Functions.create_client_with_phases added)
    - tests/setup.ts (dotenv loading for cloud DB access)
    - vitest.config.ts (unchanged — reverted loadEnv attempt, back to original)
    - package.json (new dependencies)

key-decisions:
  - "supabase-js rpc() requires Database['public']['Tables'] to include Relationships: [] on every table — otherwise GenericSchema constraint fails and all rpc() calls type as Args: never"
  - "shadcn init --yes doesn't fully non-interactive; used components.json manual creation + npx shadcn@latest add --yes for components"
  - "Supabase migration 00004 cannot be auto-applied in CI context (management API requires different token; direct DB needs password); committed for manual application via Supabase dashboard SQL editor"
  - "Integration tests use dotenv to load .env.local, enabling cloud Supabase connection without Docker"
  - "briefingSchema.shape.niche/target_audience reused in clientFormSchema to avoid duplication"

patterns-established:
  - "Server Action: always verify auth session with createClient().auth.getUser() before admin writes"
  - "RSC page searchParams: always await searchParams in Next.js 16 App Router"
  - "URL-based filter toggle: show_archived=1 param, no useState — preserves RSC server filtering"

requirements-completed: [CLNT-01, CLNT-02]

# Metrics
duration: 90min
completed: 2026-04-08
---

# Phase 2 Plan 01: Foundation + Client Creation Summary

**shadcn/ui scaffold + PL/pgSQL atomic RPC + createClientAction Server Action + /clients card grid + /clients/new intake form with 11 unit tests all passing**

## Performance

- **Duration:** ~90 min
- **Started:** 2026-04-08T22:10:00Z
- **Completed:** 2026-04-08T23:40:00Z
- **Tasks:** 7 (W0-1, W0-2, W0-3, W0-4, 1-1, 1-2, 1-3)
- **Files modified/created:** 21

## Accomplishments

- Installed all UI dependencies (react-hook-form, date-fns, shadcn/ui with 10 components)
- Created PL/pgSQL RPC `create_client_with_phases` for atomic 1-client + 5-phase initialization
- Added `briefingSchema` to Zod schema; fixed `Database` types for proper supabase-js rpc() type safety
- Built `createClientAction` Server Action with full auth + validation + RPC call
- Built `/clients` card grid RSC page with show_archived URL param toggle
- Built `/clients/new` intake form with react-hook-form + Zod client-side validation
- All 11 unit tests passing; 8 integration tests written (require migration on cloud)

## Task Commits

1. **W0-1: Install deps + scaffold shadcn/ui** - `f661724` (chore)
2. **W0-2: DB migration 00004** - `c94f9b3` (feat)
3. **W0-3: briefingSchema + unit tests** - `bc166e8` (feat)
4. **W0-4: Integration test scaffold** - `b8079a1` (feat)
5. **1-1: createClientAction Server Action + types fix** - `7527b79` (feat)
6. **1-2: ClientForm + /clients/new page** - `17cb2e6` (feat)
7. **1-3: /clients list page + ClientCard + ClientGrid** - `3aea090` (feat)

## Files Created/Modified

- `supabase/migrations/00004_create_client_with_phases.sql` — atomic client + phases RPC
- `src/lib/database/schema.ts` — added briefingSchema, BriefingInsert, tightened clientInsertSchema
- `src/lib/database/types.ts` — added Relationships to all tables, fixed Views, added Functions type
- `src/lib/actions/clients.ts` — createClientAction with auth + validation + RPC + redirect
- `src/components/clients/client-card.tsx` — RSC card with phase, status badge, relative time
- `src/components/clients/client-grid.tsx` — client component with archive toggle
- `src/components/clients/client-form.tsx` — react-hook-form + Zod intake form
- `src/app/(dashboard)/clients/page.tsx` — RSC data fetch + ClientGrid
- `src/app/(dashboard)/clients/new/page.tsx` — NewClientPage wrapping ClientForm
- `src/lib/utils.ts` — cn() helper for shadcn
- `components.json` — shadcn/ui config (New York style, Zinc, CSS vars)
- `src/components/ui/` (10 files) — shadcn components
- `tests/unit/briefing-schema.test.ts` — 5 tests, all passing
- `tests/unit/client-schema.test.ts` — 6 tests, all passing
- `tests/db/clients.test.ts` — 8 integration tests (ready to run post-migration)
- `tests/setup.ts` — updated to load .env.local via dotenv

## Decisions Made

- **supabase-js GenericSchema compatibility:** `Database['public']['Tables']` values must have `Relationships: GenericRelationship[]` field and `Views` must use proper GenericView structure. Without this, all `rpc()` calls resolve `Args` as `never`. Fixed by adding `Relationships: []` to all 6 table types.
- **shadcn/ui init approach:** `--yes` flag is non-interactive for version selection but prompts for style. Workaround: create `components.json` manually, then run `npx shadcn@latest add --yes` for components.
- **Migration application:** Cannot auto-apply to cloud Supabase (management API blocked; direct DB needs password). Migration SQL committed to `supabase/migrations/00004_create_client_with_phases.sql`. Must be applied via Supabase dashboard SQL editor before integration tests pass.
- **Test dotenv:** Updated `tests/setup.ts` to load `.env.local` via dotenv so tests can connect to cloud Supabase when executed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed supabase-js Database type incompatibility causing rpc() to type as never**
- **Found during:** Task 1-1 (createClientAction Server Action)
- **Issue:** `Database['public']` didn't satisfy `GenericSchema` because tables lacked `Relationships: []` field and `Views` had wrong type. This caused all `admin.rpc()` calls to have `Args: never`.
- **Fix:** Added `Relationships: []` to all 6 table types; fixed `Views` type; added `Functions.create_client_with_phases` type.
- **Files modified:** `src/lib/database/types.ts`
- **Committed in:** `7527b79` (part of task 1-1 commit)

**2. [Rule 2 - Missing Critical] Added dotenv env loading to tests/setup.ts**
- **Found during:** Task W0-4 (integration test scaffold)
- **Issue:** vitest doesn't auto-load `.env.local`, causing tests to connect to non-existent local Supabase (127.0.0.1:54321) instead of cloud. Tests would never pass even after migration is applied.
- **Fix:** Added dotenv config() call in tests/setup.ts to load .env.local
- **Files modified:** `tests/setup.ts`
- **Committed in:** `b8079a1` (part of task W0-4 commit)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for TypeScript correctness and test functionality. No scope creep.

## Known Stubs

None — the form, list page, and Server Action are fully wired. The only incomplete item is the integration tests which fail until the migration is applied to the cloud DB.

## Issues Encountered

- **Supabase migration cannot auto-apply:** Management API returns 403 (access control); direct DB connection requires password not in env. Migration SQL is committed but must be applied manually via Supabase dashboard SQL editor. **Action required before integration tests pass.**
- **shadcn/ui `--yes` non-interactive:** `npx shadcn@latest init --yes` doesn't handle all prompts. Workaround: create `components.json` manually then use `npx shadcn@latest add --yes` for components. This worked cleanly.
- **vitest loadEnv not available:** `loadEnv` is not exported from `vitest/config` in vitest 4.x. Used dotenv directly in setup.ts instead.

## User Setup Required

**One manual step required to complete integration test verification:**

Apply the migration to the cloud Supabase project:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/lzpcugxyjzunmerenawy/sql/new)
2. Paste the contents of `supabase/migrations/00004_create_client_with_phases.sql`
3. Run the query
4. Verify: `npm test -- --run tests/db/clients.test.ts` (all 8 tests should pass)

## Next Phase Readiness

- `/clients` list and `/clients/new` creation flow are complete
- Plan 02-02 can now build: client profile page `/clients/[id]`, edit action, archive/restore action
- The `createClientAction` redirect to `/clients/${clientId}` will work once 02-02 creates that route
- shadcn/ui is fully scaffolded for 02-02 to use

---
*Phase: 02-client-management*
*Completed: 2026-04-08*

## Self-Check: PASSED

All created files verified on disk. All 7 commits verified in git log.
Unit tests: 11/11 passing (briefing-schema.test.ts + client-schema.test.ts).
TypeScript: 0 errors (npx tsc --noEmit).
Next.js build: passes with /clients and /clients/new routes visible.
