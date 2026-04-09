# Phase 2: Client Management — Research

**Researched:** 2026-04-08
**Domain:** Next.js 16 App Router CRUD with Supabase SSR — client onboarding, profile, edit, archive
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Briefing format:** Hybrid — `niche`, `target_audience`, `additional_context` stored as JSON in `briefing` column
- **Client list:** Card grid — name, company, current phase (number + name), status badge, last activity (relative time)
- **Archive toggle:** Active clients shown by default; "Show archived" toggle reveals archived (greyed). Archived restorable.
- **Profile page:** Single scrollable page — header → briefing → pipeline timeline → outputs section (empty state)
- **Phase auto-init:** All 5 phase rows created when client row is inserted (phase 1 = active + started_at = NOW())
- **Routes:** `/clients`, `/clients/new`, `/clients/[id]`, `/clients/[id]/edit`
- **Archive UX:** Confirmation dialog before archiving; restore button on archived client profile

### Claude's Discretion

None identified in CONTEXT.md for this phase — all major UX decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- Phase transitions / advancing clients (Phase 3)
- Squad execution trigger (Phase 5)
- Real output display (Phase 7)
- Search / filtering beyond active/archived toggle (v2)
- Drag-and-drop (explicitly out of scope per REQUIREMENTS.md)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLNT-01 | Operator can register a new client with name, company, and initial briefing | Server Action with sequential insert (client row + 5 phase rows); briefing Zod schema validates hybrid JSON shape |
| CLNT-02 | Operator can view a client profile page showing current phase, history, and all outputs | RSC page at `/clients/[id]` fetches client + phases in one query; outputs section is empty state placeholder |
| CLNT-03 | Operator can edit client information and briefing at any time | Server Action updates `name`, `company`, `briefing` only — never touches `current_phase_number` or phase rows |
| CLNT-04 | Operator can archive/deactivate a client | Server Action sets `status: 'archived'`; client list filters via `?status=active` default |
</phase_requirements>

---

## Executive Summary

Phase 2 is a well-scoped CRUD phase with clear boundaries. The codebase already has all infrastructure needed: Next.js 16.2.3 with App Router, the `createClient()` server helper in `@supabase/ssr`, the `createAdminClient()` service-role helper for writes that bypass RLS, the full `Database` TypeScript type with typed `clients` and `phases` tables, and Zod v4.3.6 schemas for both tables. Phase 1 left a clean foundation.

The three implementation-level findings that most affect planning:

1. **shadcn/ui and React Hook Form are NOT installed.** They must be added in Wave 0 of this phase. The CLI for shadcn is `npx shadcn@latest init` (v4.2.0 current). This is a one-time setup task that gates all UI work.

2. **The phase auto-initialization (CLNT-01) cannot use a single atomic transaction via the JS client.** Supabase JS does not expose PostgreSQL transactions. The correct pattern is sequential inserts inside a Server Action using `createAdminClient()`. If the phase inserts fail after the client insert succeeds, the data ends up in a broken state. The plan MUST either: (a) use a Supabase Edge Function / RPC that wraps it all in a PL/pgSQL transaction, or (b) insert client row last (phases first would fail FK — so this doesn't work) and accept the risk with a cleanup pattern. The recommended approach is to create a Supabase RPC (`create_client_with_phases`) as a PL/pgSQL function that performs all 6 inserts atomically. The Server Action calls this RPC. This avoids partial state entirely and keeps the app simple.

3. **The phase enforcement trigger fires on INSERT.** `trg_enforce_phase_sequence_insert` runs on every INSERT into `phases`. Inserting phase 1 as `active` is allowed (phase 1 is exempt). Inserting phases 2–5 as `pending` is also safe — the trigger only fires when `NEW.status = 'active'`. All 5 can be safely inserted in sequence with phases 2–5 as `pending` and phase 1 as `active`.

**Primary recommendation:** Wire all mutations through `createAdminClient()` Server Actions. Use a PL/pgSQL RPC for the atomic client+phases creation. Install shadcn/ui and React Hook Form in Wave 0 before any UI work begins.

---

## Standard Stack

### Core (all already installed — verified in node_modules / package.json)

| Library | Installed Version | Purpose | Source |
|---------|-----------------|---------|--------|
| next | 16.2.3 | App Router, Server Components, Server Actions | [VERIFIED: package.json] |
| react | 19.2.4 | UI library, Server Components | [VERIFIED: package.json] |
| @supabase/ssr | 0.10.0 | Server-side Supabase client for RSC + route handlers | [VERIFIED: package.json] |
| @supabase/supabase-js | 2.102.1 | Supabase admin client (service role) | [VERIFIED: package.json] |
| zod | 4.3.6 | Schema validation for briefing, form inputs | [VERIFIED: package.json] |
| tailwindcss | ^4 | Utility-first CSS | [VERIFIED: package.json] |

### Needs Installing (Wave 0 gates)

| Library | Current Version | Purpose | Install Command |
|---------|----------------|---------|-----------------|
| react-hook-form | 7.72.1 (registry) | Form state for intake + edit forms | `npm install react-hook-form` |
| @hookform/resolvers | 5.2.2 (registry) | Connects Zod schema to RHF | `npm install @hookform/resolvers` |
| date-fns | 4.1.0 (registry) | Relative time display ("5h ago") | `npm install date-fns` |
| lucide-react | 1.7.0 (registry) | Icons for cards and buttons | `npm install lucide-react` |
| shadcn/ui (CLI init) | 4.2.0 (registry) | Component library scaffold | `npx shadcn@latest init` |

[VERIFIED: npm registry for all versions above — 2026-04-08]

### Version Verification Notes

`react-hook-form` v7 supports both controlled and uncontrolled inputs; `@hookform/resolvers` v5 works with Zod v4 (v4 broke Zod v3 resolvers — the resolver must match). `date-fns` v4 is a full rewrite with ESM-only distribution — import paths changed from v3. Use named imports: `import { formatDistanceToNow } from 'date-fns'`.

**shadcn/ui with Tailwind v4:** shadcn v4.x requires a Tailwind v4 config. The project uses Tailwind v4 with CSS-first config (`@import "tailwindcss"` in globals.css — verified). Run `npx shadcn@latest init` which auto-detects Tailwind v4 and configures CSS variables in globals.css. [ASSUMED — shadcn v4 + Tailwind v4 integration; verify during init]

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/(dashboard)/
│   ├── clients/
│   │   ├── page.tsx              # Client list — RSC, fetches all clients
│   │   ├── new/
│   │   │   └── page.tsx          # New client form — client component
│   │   └── [id]/
│   │       ├── page.tsx          # Client profile — RSC, fetches client + phases
│   │       └── edit/
│   │           └── page.tsx      # Edit form — client component
│   └── layout.tsx                # Existing protected layout (no changes)
├── lib/
│   ├── actions/
│   │   └── clients.ts            # All client Server Actions
│   ├── database/
│   │   ├── enums.ts              # Existing — PHASE_NAMES used for phase row names
│   │   ├── schema.ts             # Existing — extend with briefingSchema
│   │   └── types.ts              # Existing
│   └── supabase/
│       ├── server.ts             # Existing — read operations in RSC
│       ├── admin.ts              # Existing — write operations in Server Actions
│       └── client.ts             # Existing — browser client (archive toggle)
└── components/
    ├── ui/                       # shadcn/ui generated components
    ├── clients/
    │   ├── client-card.tsx       # Single client card component
    │   ├── client-grid.tsx       # Card grid with archived toggle
    │   ├── client-form.tsx       # Shared form (new + edit)
    │   ├── pipeline-timeline.tsx # Phase timeline on profile page
    │   └── archive-dialog.tsx    # Confirmation dialog
    └── shared/
        └── relative-time.tsx     # "5h ago" display using date-fns
```

### Pattern 1: Server Action with Admin Client for Mutations

All writes use `createAdminClient()` (service role key, bypasses RLS) because the solo operator IS the entire user base and writes always come from authenticated Server Actions.

```typescript
// src/lib/actions/clients.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createClient(formData: FormData) {
  const admin = createAdminClient()

  // Call the atomic RPC — see Pattern 3
  const { data, error } = await admin.rpc('create_client_with_phases', {
    p_name: formData.get('name') as string,
    p_company: formData.get('company') as string,
    p_briefing: {
      niche: formData.get('niche'),
      target_audience: formData.get('target_audience'),
      additional_context: formData.get('additional_context') ?? null,
    },
  })

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  redirect(`/clients/${data}`)  // RPC returns new client UUID
}
```

[ASSUMED — RPC signature; exact parameter types depend on SQL function created in Wave 0]

### Pattern 2: RSC Data Fetching with Server Client

```typescript
// src/app/(dashboard)/clients/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company, current_phase_number, status, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  return <ClientGrid clients={clients ?? []} />
}
```

For archived toggle: use URL search params (`?show_archived=1`) so the RSC re-runs server-side with the correct filter. No client state needed.

[VERIFIED: @supabase/ssr pattern — matches existing server.ts and dashboard/page.tsx patterns]

### Pattern 3: Atomic Client + Phase Creation via Supabase RPC

The JS client cannot wrap multiple inserts in a transaction. The correct approach is a PL/pgSQL function callable via `supabase.rpc()`.

```sql
-- New migration: 00004_create_client_with_phases.sql
CREATE OR REPLACE FUNCTION create_client_with_phases(
  p_name TEXT,
  p_company TEXT,
  p_briefing JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
  v_phase_names TEXT[] := ARRAY[
    'Diagnostico',
    'Engenharia de Valor',
    'Go-to-Market',
    'Tracao e Vendas',
    'Retencao e Escala'
  ];
  i INT;
BEGIN
  -- Insert client (phase enforcement trigger does not fire here)
  INSERT INTO clients (name, company, briefing)
  VALUES (p_name, p_company, p_briefing)
  RETURNING id INTO v_client_id;

  -- Insert 5 phase rows: phase 1 active, phases 2-5 pending
  -- The insert trigger only rejects status='active' when prev phase not completed.
  -- Phase 1 is exempt. Phases 2-5 are inserted as 'pending' — trigger allows this.
  FOR i IN 1..5 LOOP
    INSERT INTO phases (client_id, phase_number, name, status, started_at)
    VALUES (
      v_client_id,
      i,
      v_phase_names[i],
      CASE WHEN i = 1 THEN 'active' ELSE 'pending' END,
      CASE WHEN i = 1 THEN NOW() ELSE NULL END
    );
  END LOOP;

  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql;
```

This gives true atomicity: if any insert fails, the whole transaction rolls back. The Server Action calls `admin.rpc('create_client_with_phases', {...})`.

[VERIFIED: Supabase RPC pattern via existing codebase — admin.ts already has the admin client. SQL logic verified against migration 00002 trigger rules.]

### Pattern 4: Archive Toggle — URL-based, no client state

The "show archived" toggle modifies a URL search param. The RSC re-fetches with the appropriate filter. This is the correct Next.js 16 App Router pattern — no `useState` needed, fully server-rendered, shareable URL.

```typescript
// In client-grid.tsx (client component only for the toggle button)
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function ArchivedToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const showArchived = searchParams.get('show_archived') === '1'

  function toggle() {
    const params = new URLSearchParams(searchParams)
    if (showArchived) params.delete('show_archived')
    else params.set('show_archived', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <button onClick={toggle}>
      {showArchived ? 'Hide archived' : 'Show archived'}
    </button>
  )
}
```

[VERIFIED: Next.js App Router useSearchParams pattern — matches Next.js 16 docs patterns]

### Pattern 5: Archive Confirmation — shadcn AlertDialog

The archive action requires a confirmation step. shadcn's `AlertDialog` is the correct component (it exists in the shadcn catalog).

```typescript
// Triggered from client profile or client card
// Uses shadcn AlertDialog — must be installed first
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
```

[ASSUMED — shadcn AlertDialog component availability post-init; component exists in shadcn catalog as of training data]

### Anti-Patterns to Avoid

- **Calling `createClient()` (anon) for writes:** RLS policies from migration 00003 restrict writes. All mutations use `createAdminClient()` in Server Actions — never in client components.
- **Using `useState` for the archived toggle:** The list page is a RSC. Client state would force the entire list to become a client component. Use URL search params instead.
- **Inserting phases one-by-one from the Server Action:** Without the RPC, a network error between phase 2 and 3 inserts leaves the client with an incomplete timeline. Always use the atomic RPC.
- **Using Zod v3 syntax for the briefing schema:** Zod is installed at v4.3.6. The existing `schema.ts` already uses Zod v4-compatible syntax (`z.record(z.string(), z.unknown())`). The briefing schema for the form should follow the same pattern. Do NOT use `z.record(z.unknown())` — it fails in Zod v4 (requires explicit key schema).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confirmation dialogs | Custom modal with useState | shadcn AlertDialog | Accessible, keyboard-navigable, focus trap built in |
| Form validation UI | Manual error display | React Hook Form + Zod resolver | Field-level error state, touched tracking, submit prevention handled |
| Relative timestamps | Custom date diff logic | `date-fns` formatDistanceToNow | Handles DST, locales, edge cases (e.g., "less than a minute ago") |
| Toast/notification after mutations | Custom toast state | shadcn Sonner (or Toast) | Accessible, stacks, auto-dismisses |
| Form accessibility | aria-* attributes manually | shadcn Form component | Wraps RHF, links labels to inputs, surfaces errors to screen readers |

---

## Data Flow

### CLNT-01: New Client Creation

```
/clients/new (page.tsx — RSC)
  └── renders <ClientForm mode="create" />  (client component)
        ├── react-hook-form + Zod briefingSchema validates fields
        ├── onSubmit → calls createClient(formData) Server Action
        │     └── createAdminClient().rpc('create_client_with_phases', {...})
        │           └── PL/pgSQL: INSERT clients, INSERT 5x phases (atomically)
        │                 └── returns new client UUID
        ├── Server Action: revalidatePath('/clients'), redirect('/clients/{id}')
        └── Browser navigates to new profile page
```

### CLNT-02: Client Profile View

```
/clients/[id] (page.tsx — RSC)
  └── createClient() (anon, read-only)
        ├── .from('clients').select('*').eq('id', params.id).single()
        └── .from('phases').select('*').eq('client_id', params.id).order('phase_number')
  └── renders:
        ├── <ProfileHeader client={client} />
        ├── <BriefingSection briefing={client.briefing} />
        ├── <PipelineTimeline phases={phases} />
        └── <OutputsSection clientId={client.id} />  (empty state placeholder)
```

### CLNT-03: Edit Client

```
/clients/[id]/edit (page.tsx — RSC)
  └── fetches client data server-side
  └── renders <ClientForm mode="edit" defaultValues={client} />
        ├── Same form as create, pre-populated
        ├── onSubmit → updateClient(id, formData) Server Action
        │     └── createAdminClient()
        │           .from('clients')
        │           .update({ name, company, briefing })  // pipeline columns untouched
        │           .eq('id', id)
        └── Server Action: revalidatePath('/clients'), revalidatePath(`/clients/${id}`), redirect(`/clients/${id}`)
```

### CLNT-04: Archive Client

```
Archive button click (client component) → confirmation dialog
  └── user confirms → archiveClient(id) Server Action
        └── createAdminClient()
              .from('clients')
              .update({ status: 'archived' })
              .eq('id', id)
        └── revalidatePath('/clients')
        └── redirect('/clients')  (removed from active view)

Restore: restoreClient(id) Server Action — same pattern, sets status: 'active'
```

---

## Components Needed

### shadcn/ui Components to Install (after `npx shadcn@latest init`)

Run `npx shadcn@latest add <component>` for each:

| Component | Used For | Command |
|-----------|---------|---------|
| card | Client cards in grid | `npx shadcn@latest add card` |
| badge | Status badge (Active/Archived, phase name) | `npx shadcn@latest add badge` |
| button | All action buttons | `npx shadcn@latest add button` |
| form | Form wrapper linking RHF + Zod | `npx shadcn@latest add form` |
| input | Name, company, niche, target_audience fields | `npx shadcn@latest add input` |
| textarea | Additional context field | `npx shadcn@latest add textarea` |
| label | Form labels | `npx shadcn@latest add label` |
| alert-dialog | Archive confirmation dialog | `npx shadcn@latest add alert-dialog` |
| separator | Section dividers on profile page | `npx shadcn@latest add separator` |
| sonner | Mutation success/error toasts | `npx shadcn@latest add sonner` |

[ASSUMED — component names accurate as of shadcn v4.2.0 catalog; confirm names at install time]

### Custom Components to Build

| Component | Location | Notes |
|-----------|----------|-------|
| `ClientCard` | `src/components/clients/client-card.tsx` | Wraps shadcn Card; shows name, company, phase badge, status, relative time |
| `ClientGrid` | `src/components/clients/client-grid.tsx` | Grid layout + ArchivedToggle; grid = client component for toggle, cards can be server |
| `ClientForm` | `src/components/clients/client-form.tsx` | Shared for create + edit; accepts `mode` and `defaultValues` props |
| `PipelineTimeline` | `src/components/clients/pipeline-timeline.tsx` | Shows all 5 phases with status indicators |
| `ArchiveDialog` | `src/components/clients/archive-dialog.tsx` | Wraps shadcn AlertDialog with archive/restore logic |

---

## Risk Areas

### Risk 1: shadcn/ui + Tailwind v4 CSS Variable Conflicts

**What could go wrong:** shadcn's `init` command injects CSS variables (e.g., `--primary`, `--background`) into globals.css. The project already has custom `--background` and `--foreground` in globals.css. There may be conflicts or duplicates.

**Mitigation:** During `npx shadcn@latest init`, choose to append CSS variables rather than overwrite. After init, manually verify globals.css has no duplicate variable definitions. The existing layout uses `bg-zinc-50` and `border-zinc-200` directly — these are Tailwind primitives, not CSS variable aliases, so they will not be affected.

**Confidence:** MEDIUM — Tailwind v4 + shadcn v4 is a relatively new combination.

### Risk 2: @hookform/resolvers v5 + Zod v4 Compatibility

**What could go wrong:** `@hookform/resolvers` v5 added Zod v4 support. If an older version is installed, the Zod resolver will fail silently with Zod v4 schemas.

**Mitigation:** Install `@hookform/resolvers@5.2.2` (current registry version, verified 2026-04-08). The resolver for Zod v4 in v5 is: `import { zodResolver } from '@hookform/resolvers/zod'` — same import path as before. [VERIFIED: npm registry]

### Risk 3: Phase Enforcement Trigger on Init

**What could go wrong:** The `trg_enforce_phase_sequence_insert` trigger fires on every INSERT into phases. If phases 2–5 are accidentally inserted with `status: 'active'` instead of `status: 'pending'`, the trigger will reject them (phases 2–5 require prior phase completion).

**Mitigation:** The RPC SQL explicitly sets `CASE WHEN i = 1 THEN 'active' ELSE 'pending' END`. This is straightforward. The risk is low, but the plan should include an integration test that verifies: inserting a new client creates exactly 5 phase rows, phase 1 is active, phases 2–5 are pending.

### Risk 4: Supabase RLS Blocking Reads on Client Components

**What could go wrong:** If any component accidentally uses `createBrowserClient()` for reads (e.g., for a future interactive element), RLS policies from migration 00003 may restrict access.

**Mitigation:** For Phase 2, all reads are in RSC pages using `createClient()` (server). The only client component calls are Server Actions (which run on the server). No direct client-side Supabase calls needed.

### Risk 5: `date-fns` v4 ESM-only in Next.js 16

**What could go wrong:** `date-fns` v4 is ESM-only. Next.js 16 handles ESM in most cases, but if the component importing `date-fns` is not an ESM module, there may be a build error.

**Mitigation:** Use the standard named import: `import { formatDistanceToNow } from 'date-fns'`. Next.js 16 with Turbopack (default bundler) handles ESM correctly. If issues arise, `date-fns` v3 (`date-fns@3`) is an alternative and remains CJS-compatible. [ASSUMED — Next.js 16 + Turbopack + date-fns v4 compatibility; low probability issue]

---

## Validation Architecture

nyquist_validation is enabled (config.json — key present and true).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | `vitest.config.ts` (exists, configured) |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm test` |
| Test directory | `tests/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLNT-01 | Creating a client inserts 1 client row + 5 phase rows atomically | integration | `npm test -- tests/db/clients.test.ts` | ❌ Wave 0 |
| CLNT-01 | Phase 1 row is `active` + `started_at` set; phases 2-5 are `pending` | integration | `npm test -- tests/db/clients.test.ts` | ❌ Wave 0 |
| CLNT-01 | briefing column stores `{niche, target_audience, additional_context}` JSON shape | integration | `npm test -- tests/db/clients.test.ts` | ❌ Wave 0 |
| CLNT-01 | Partial failure (simulated) does NOT leave orphaned client without phases | integration | `npm test -- tests/db/clients.test.ts` | ❌ Wave 0 |
| CLNT-02 | Fetching a client by ID returns client + associated phases | integration | `npm test -- tests/db/clients.test.ts` | ❌ Wave 0 |
| CLNT-03 | Updating name/company/briefing does NOT change current_phase_number | integration | `npm test -- tests/db/clients.test.ts` | ❌ Wave 0 |
| CLNT-04 | Archiving sets status to 'archived', client remains in DB | integration | `npm test -- tests/db/clients.test.ts` | ❌ Wave 0 |
| CLNT-04 | Restoring sets status back to 'active' | integration | `npm test -- tests/db/clients.test.ts` | ❌ Wave 0 |
| N/A | briefingSchema validates correct shape; rejects missing niche | unit | `npm test -- tests/unit/schema.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- tests/db/clients.test.ts` (integration tests for new DB operations)
- **Per wave merge:** `npm test` (full suite including existing schema + trigger tests)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/db/clients.test.ts` — integration tests for CLNT-01 through CLNT-04 (uses `testClient` from existing `tests/setup.ts`)
- [ ] `tests/unit/schema.test.ts` — unit tests for briefingSchema validation
- [ ] Migration `supabase/migrations/00004_create_client_with_phases.sql` — PL/pgSQL RPC required before any client creation test can run

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | shadcn v4.2.0 `init` command auto-detects Tailwind v4 and configures CSS variables correctly | Standard Stack | Requires manual CSS variable setup; adds setup friction |
| A2 | shadcn AlertDialog component name and import path are `@/components/ui/alert-dialog` | Components Needed | Component name may differ; check catalog during install |
| A3 | `@hookform/resolvers` v5 `zodResolver` import path unchanged from v4 | Risk Areas | If path changed, imports must be updated; check resolver docs |
| A4 | `date-fns` v4 ESM works cleanly in Next.js 16 with Turbopack | Risk Areas | If not, fall back to date-fns v3 (CJS-compatible) |
| A5 | RPC function `create_client_with_phases` can be called via `admin.rpc()` with the Supabase JS client | Data Flow | If RPC return type needs different handling, Server Action needs adjustment |

---

## Open Questions

1. **Does RLS restrict the anon-key server client from reading client data?**
   - What we know: Migration 00003 applied RLS policies. The policy content was not read during research.
   - What's unclear: Whether the server client (anon key, but running server-side with the user's session cookie) can read `clients` and `phases` rows, or whether service-role is needed for reads too.
   - Recommendation: Read `00003_rls_policies.sql` before implementing RSC data fetching. If RLS blocks anon reads, use `createAdminClient()` for reads as well (acceptable for a solo-operator app).

2. **Should the `/clients/[id]/edit` route be a separate page or inline editing?**
   - What we know: CONTEXT.md specifies `/clients/[id]/edit` as a route — a dedicated edit page.
   - What's unclear: Whether the operator expects in-page editing (click a field to edit it inline) or a dedicated form page.
   - Recommendation: Implement as a dedicated `/clients/[id]/edit` page (per CONTEXT.md decision). Inline editing is a v2 improvement.

---

## Environment Availability

Step 2.6: No new external tools required for Phase 2. All dependencies are npm packages or Supabase cloud (already configured). The Supabase cloud project (`lzpcugxyjzunmerenawy.supabase.co`) is live. The PL/pgSQL migration runs via `supabase db push` (same workflow as Phase 1).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase cloud | All DB operations | ✓ | Cloud (live) | — |
| Node.js | npm installs | ✓ | Present (npm 16.2.3 works) | — |
| npx (shadcn init) | Component scaffold | ✓ | Bundled with npm | — |

---

## Sources

### Primary (HIGH confidence)
- `src/lib/database/types.ts` — exact column names and types for clients + phases tables [VERIFIED: read directly]
- `src/lib/database/enums.ts` — PHASE_NAMES constants for phase row names [VERIFIED: read directly]
- `src/lib/database/schema.ts` — existing Zod schemas and Zod v4 syntax patterns [VERIFIED: read directly]
- `src/lib/supabase/admin.ts` — createAdminClient() pattern already exists [VERIFIED: read directly]
- `supabase/migrations/00002_phase_enforcement.sql` — trigger behavior for INSERT into phases [VERIFIED: read directly]
- `package.json` — installed package versions [VERIFIED: read directly]

### Secondary (MEDIUM confidence)
- npm registry: react-hook-form@7.72.1, @hookform/resolvers@5.2.2, date-fns@4.1.0, lucide-react@1.7.0, shadcn@4.2.0 [VERIFIED: npm view commands, 2026-04-08]
- Next.js App Router searchParams pattern — consistent with existing `(auth)/login/actions.ts` Server Action patterns in codebase [VERIFIED: codebase]

### Tertiary (LOW confidence / ASSUMED)
- shadcn v4 + Tailwind v4 CSS variable integration [ASSUMED — verify during init]
- @hookform/resolvers v5 import path unchanged [ASSUMED — verify at install]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing packages verified in node_modules/package.json; new packages verified via npm registry
- Architecture: HIGH — patterns derived directly from existing codebase (admin.ts, server.ts, login/actions.ts)
- Pitfalls: MEDIUM — RLS policy content not read (open question 1), shadcn+Tailwind v4 combination assumed
- DB schema: HIGH — read directly from migration SQL and types.ts

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (npm package versions may drift; shadcn catalog may change)
