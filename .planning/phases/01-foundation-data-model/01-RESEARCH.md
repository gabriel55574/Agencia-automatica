# Phase 1: Foundation & Data Model - Research

**Researched:** 2026-04-08
**Domain:** Next.js 16 + Supabase + PostgreSQL schema design + Auth
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire foundation: a Next.js 16 App Router application scaffold with Supabase integration (auth, database, storage), operator authentication, and a complete PostgreSQL schema that enforces the 5-phase sequential pipeline at the database level. This is a greenfield setup phase with no existing code.

The core technical challenges are: (1) correctly configuring `@supabase/ssr` with Next.js middleware for cookie-based auth, (2) designing a database schema that models the 5-phase/16-process/4-gate pipeline with proper referential integrity, (3) writing PostgreSQL triggers that enforce sequential phase progression at the database level (not just application code), and (4) generating TypeScript types from the Supabase schema and wiring them through the entire app.

**Primary recommendation:** Use `create-next-app@latest` with defaults (TypeScript, Tailwind, App Router, Turbopack all default now), set up Supabase local dev with `supabase init`, write the complete schema as migrations, create PostgreSQL triggers for phase sequence enforcement, configure `@supabase/ssr` middleware for auth, and generate types with `supabase gen types`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUN-01 | Operator can log in with email/password (Supabase Auth, solo user) | Supabase Auth + `@supabase/ssr` middleware pattern with `getClaims()` for server-side validation; single operator user created via Supabase dashboard or seed script |
| FOUN-02 | System enforces a fixed 5-phase sequential pipeline per client (Diagnostico, Engenharia de Valor, Go-to-Market, Tracao, Retencao) | Database schema with `phases` table, `phase_number` column (1-5), and CHECK constraints + trigger preventing non-sequential activation |
| FOUN-03 | Pipeline state machine is enforced at the database level via PostgreSQL constraints and triggers | PostgreSQL BEFORE UPDATE trigger on `phases` table that raises exception if phase N is activated without phase N-1 being completed; FOR UPDATE row locking prevents race conditions |
| FOUN-04 | Next.js app scaffold with Supabase integration runs on self-hosted VPS (not serverless) | `create-next-app@latest` with `next start` for production; PM2 or systemd for process management on VPS; connects to Supabase Cloud for managed Postgres |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech Stack**: Next.js + Supabase + Claude Code CLI -- already decided, non-negotiable
- **Scale**: Must handle 15+ concurrent clients from launch
- **Solo Operator**: All UX optimized for one person managing everything
- **Process Fidelity**: The 5-phase/16-process/4-gate structure is non-negotiable -- it IS the product
- **No Prisma**: Use Supabase client with generated types (`supabase gen types`)
- **No NextAuth/Auth.js**: Supabase Auth only
- **No tRPC**: Server Actions + Zod validation instead
- **No Pages Router**: App Router only
- **English for code, Portuguese for UI**: Convention from PITFALLS.md (Pitfall 13)
- **RLS from day one**: Even for solo operator (Pitfall 14)

## Standard Stack

### Core (Phase 1 specific)

| Library | Version | Purpose | Why Standard | Confidence |
|---------|---------|---------|--------------|------------|
| Next.js | 16.2.3 | Full-stack framework (App Router) | Latest stable, Turbopack default, Server Components + Server Actions | HIGH [VERIFIED: npm registry] |
| React | 19.2.5 | UI library | Ships with Next.js 16 | HIGH [VERIFIED: npm registry] |
| TypeScript | 6.0.2 | Type safety | Latest stable; needed for complex domain model types | HIGH [VERIFIED: npm registry] |
| @supabase/supabase-js | 2.102.1 | Supabase client SDK | Official JS client for auth, DB queries, storage, realtime | HIGH [VERIFIED: npm registry] |
| @supabase/ssr | 0.10.0 | Server-side Supabase for Next.js | Required for App Router; handles cookie-based auth in RSC context | HIGH [VERIFIED: npm registry] |
| Tailwind CSS | 4.2.2 | Utility-first CSS | Default with Next.js 16; zero-config setup | HIGH [VERIFIED: npm registry] |
| Zod | 3.25.76 | Schema validation | Use Zod v3 for Phase 1 (ecosystem compatibility); upgrade to v4 later | MEDIUM [VERIFIED: npm registry -- see rationale below] |

**Zod v3 vs v4 decision:** Zod v4 (4.3.6) is now the latest on npm [VERIFIED: npm registry]. However, Zod v4 has breaking changes (string validators moved to top-level, `.record()` requires two args, `._def` moved to `._zod.def`). The `@hookform/resolvers@5.2.2` supports both v3 and v4 via `zod/v4` subpath. **Recommendation for Phase 1: use Zod v3 (3.25.76)** since Phase 1 only needs schema validation for DB types and forms are not built yet. This avoids compatibility risks. Upgrade to v4 when forms are built in Phase 2. [ASSUMED -- risk is low since v3 is still fully supported]

### Supporting (Phase 1 dev dependencies)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| supabase (CLI) | 2.84.2 | Local dev, migrations, type generation | Installed globally already | [VERIFIED: local machine] |
| Vitest | 4.1.3 | Unit testing | Test trigger logic, schema validation | [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod v3 | Zod v4 | v4 has better performance but breaking API changes; ecosystem still transitioning |
| `getClaims()` | `getUser()` | `getUser()` makes network request to auth server (slower but verifies session validity); `getClaims()` validates JWT locally (faster, sufficient for solo operator) |
| PostgreSQL triggers | Application-level checks only | App-level checks fail under concurrency; triggers enforce at DB level regardless of how data is modified |

**Installation (Phase 1 only):**
```bash
# Create Next.js project (TypeScript, Tailwind, App Router are defaults)
npx create-next-app@latest agency-os --yes --src-dir

# Core Supabase dependencies
cd agency-os
npm install @supabase/supabase-js @supabase/ssr

# Validation
npm install zod

# Dev dependencies
npm install -D vitest supabase
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope only)
```
agency-os/
  src/
    app/
      (auth)/
        login/
          page.tsx              # Login page
      (dashboard)/
        page.tsx                # Placeholder dashboard (protected)
        layout.tsx              # Auth-protected layout
      layout.tsx                # Root layout
      middleware.ts             # Supabase auth middleware (at src root)
    lib/
      supabase/
        client.ts               # Browser Supabase client (createBrowserClient)
        server.ts               # Server Supabase client (createServerClient)
        admin.ts                # Service role client (for triggers/admin ops)
        middleware.ts            # Middleware helper (updateSession)
      database/
        types.ts                # Generated types (supabase gen types output)
        schema.ts               # Zod schemas mirroring DB tables
        enums.ts                # Phase/status enums and constants
  supabase/
    config.toml                 # Local dev config
    migrations/
      00001_initial_schema.sql  # Core tables: clients, phases, processes, quality_gates, squad_jobs, deliverables
      00002_phase_enforcement.sql # Triggers enforcing sequential phases
      00003_rls_policies.sql    # Row-level security policies
    seed.sql                    # Test data: operator user, sample clients
```

### Pattern 1: Supabase SSR Middleware for Auth

**What:** A Next.js middleware that refreshes Supabase auth tokens on every request using `@supabase/ssr`.

**When to use:** Every protected route in the application.

**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not use getSession() -- it reads from storage, not validated.
  // Use getClaims() for JWT validation or getUser() for full server check.
  const { data: { user } } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```
[CITED: https://supabase.com/docs/guides/auth/server-side/nextjs]

**Important caveat:** The Supabase docs warn that `getSession()` should NOT be used for server-side auth validation because cookies can be spoofed. Use `getUser()` (network request) or `getClaims()` (local JWT validation). For a solo operator app, `getUser()` is the safer default since it verifies the session is still valid. [CITED: https://supabase.com/docs/guides/auth/server-side/nextjs]

### Pattern 2: Server-Side Supabase Client Creation

**What:** Lightweight client creation per request in Server Components and Server Actions.

**Example:**
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component -- ignore
            // The middleware will handle refreshing
          }
        },
      },
    }
  )
}
```
[CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client]

### Pattern 3: PostgreSQL Trigger for Phase Sequence Enforcement

**What:** A BEFORE UPDATE trigger on the `phases` table that prevents activating phase N unless phase N-1 is completed.

**When to use:** This is the critical requirement FOUN-03. The trigger fires on any update to the phases table, regardless of whether it comes from the application, Supabase dashboard, or direct SQL.

**Example:**
```sql
-- supabase/migrations/00002_phase_enforcement.sql

-- Trigger function: enforce sequential phase activation
CREATE OR REPLACE FUNCTION enforce_phase_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when status is being changed to 'active'
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    -- Phase 1 can always be activated (it's the starting phase)
    IF NEW.phase_number > 1 THEN
      -- Check that the previous phase is completed
      IF NOT EXISTS (
        SELECT 1 FROM phases
        WHERE client_id = NEW.client_id
          AND phase_number = NEW.phase_number - 1
          AND status = 'completed'
      ) THEN
        RAISE EXCEPTION 'Cannot activate phase % for client %: phase % is not completed',
          NEW.phase_number, NEW.client_id, NEW.phase_number - 1;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_phase_sequence
  BEFORE UPDATE ON phases
  FOR EACH ROW
  EXECUTE FUNCTION enforce_phase_sequence();

-- Also enforce on INSERT (prevent inserting an active phase out of order)
CREATE TRIGGER trg_enforce_phase_sequence_insert
  BEFORE INSERT ON phases
  FOR EACH ROW
  EXECUTE FUNCTION enforce_phase_sequence();
```
[ASSUMED -- pattern follows standard PostgreSQL trigger approach; the specific implementation is sound but should be tested against edge cases]

### Pattern 4: Database Schema Design with Future-Proofing

**What:** Complete schema covering all 6 core tables with relationships, constraints, and proper types.

**Key design decisions:**
1. Use `uuid` primary keys (Supabase default, works with RLS)
2. Use `text` type for status enums (not PostgreSQL `ENUM` -- easier to extend without migrations)
3. Use `CHECK` constraints to limit valid status values
4. Store `phase_number` as `smallint` with CHECK (1-5) -- not an enum, for easy arithmetic
5. Include `previous_cycle_id` on clients table for feedback loop (Pitfall 11 -- design schema for it now)
6. Include `metadata JSONB` columns for flexible extension
7. All timestamps use `timestamptz` (timezone-aware)

**Core schema:**
```sql
-- Phase statuses
-- clients.status: 'active' | 'archived'
-- phases.status: 'pending' | 'active' | 'completed'
-- processes.status: 'pending' | 'active' | 'completed' | 'failed'
-- quality_gates.status: 'pending' | 'evaluating' | 'approved' | 'rejected'
-- squad_jobs.status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  briefing JSONB,
  current_phase_number SMALLINT NOT NULL DEFAULT 1 CHECK (current_phase_number BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  cycle_number SMALLINT NOT NULL DEFAULT 1,
  previous_cycle_id UUID REFERENCES clients(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  phase_number SMALLINT NOT NULL CHECK (phase_number BETWEEN 1 AND 5),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, phase_number)
);

CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  process_number SMALLINT NOT NULL CHECK (process_number BETWEEN 1 AND 16),
  name TEXT NOT NULL,
  squad TEXT NOT NULL CHECK (squad IN ('estrategia', 'planejamento', 'growth', 'crm')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  input_snapshot JSONB,
  output_json JSONB,
  output_markdown TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phase_id, process_number)
);

CREATE TABLE quality_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gate_number SMALLINT NOT NULL CHECK (gate_number BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'evaluating', 'approved', 'rejected')),
  ai_review_json JSONB,
  checklist_results JSONB,
  operator_decision TEXT CHECK (operator_decision IN ('approved', 'rejected')),
  operator_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phase_id, gate_number)
);

CREATE TABLE squad_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  process_id UUID REFERENCES processes(id),
  squad_type TEXT NOT NULL CHECK (squad_type IN ('estrategia', 'planejamento', 'growth', 'crm')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  cli_command TEXT,
  progress_log TEXT,
  output TEXT,
  error_log TEXT,
  attempts SMALLINT NOT NULL DEFAULT 0,
  max_attempts SMALLINT NOT NULL DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
  phase_number SMALLINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
[ASSUMED -- schema design based on domain analysis of the Agency OS methodology document and architecture research; validated against requirements but exact column choices may need user review]

### Anti-Patterns to Avoid

- **Using `getSession()` for server-side auth:** Cookie data can be spoofed. Use `getUser()` or `getClaims()` instead. [CITED: https://supabase.com/docs/guides/auth/server-side/nextjs]
- **Using plain `@supabase/supabase-js` in Server Components:** Must use `@supabase/ssr` with cookie handling. The plain client has no concept of server-side session management. [CITED: https://supabase.com/docs/guides/auth/server-side/creating-a-client]
- **Skipping RLS because solo operator:** The anon key is exposed in the browser bundle. Without RLS, anyone with that key can read/modify all data. [ASSUMED -- standard Supabase security practice]
- **Using PostgreSQL ENUM types for statuses:** Hard to extend without ALTER TYPE migrations. Use TEXT + CHECK constraints instead -- adding a new status is a simple ALTER TABLE. [ASSUMED -- common PostgreSQL pattern recommendation]
- **Storing timestamps without timezone:** Use `TIMESTAMPTZ` always. Plain `TIMESTAMP` causes timezone bugs when the VPS timezone differs from the operator's timezone. [ASSUMED -- standard PostgreSQL best practice]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management | Custom JWT/cookie handling | `@supabase/ssr` middleware | Handles token refresh, cookie rotation, edge cases around SSR/RSC boundaries |
| Database type generation | Manual TypeScript interfaces | `supabase gen types typescript` | Auto-syncs with schema, catches drift, one command |
| Form validation schemas | Manual type guards | Zod schemas | Runtime validation + TypeScript inference in one definition |
| Route protection | Custom auth checks per page | Next.js middleware + Supabase auth | Single enforcement point, no forgotten routes |
| Database migrations | Manual SQL against production | Supabase CLI migrations (`supabase migration new`) | Version-controlled, repeatable, testable |
| UUID generation | Custom ID functions | PostgreSQL `gen_random_uuid()` | Database-native, no external dependency, guaranteed uniqueness |

## Common Pitfalls

### Pitfall 1: Supabase SSR Cookie Misconfiguration

**What goes wrong:** Auth works in development but breaks in production. Users get logged out on page refresh, or server components see a different user than client components.
**Why it happens:** The `@supabase/ssr` package requires precise cookie handling with `getAll()` and `setAll()` methods. Missing the `setAll` in either the middleware or server client causes token refresh to fail silently.
**How to avoid:** Follow the exact Supabase SSR guide pattern. Test by: (1) logging in, (2) waiting for token expiry (configurable in Supabase dashboard, default 1 hour), (3) refreshing the page -- user should still be authenticated.
**Warning signs:** Users randomly logged out, "No session" errors in server components, cookies not being set in response headers.

### Pitfall 2: Missing `updated_at` Auto-Update

**What goes wrong:** The `updated_at` column always shows the creation date, never the last modification date.
**Why it happens:** PostgreSQL does not automatically update timestamp columns. You need a trigger.
**How to avoid:** Create a `moddatetime` trigger or a custom trigger function:
```sql
-- Use Supabase's built-in moddatetime extension
CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
```
**Warning signs:** Sorting by "last modified" shows creation order instead.

### Pitfall 3: Phase Trigger Not Handling Edge Cases

**What goes wrong:** The phase enforcement trigger works for normal sequential progression but fails for: (a) inserting a new client (needs Phase 1 auto-created as active), (b) feedback loop re-entry (Phase 5 completed, need to start a new Phase 1 cycle), (c) direct SQL access.
**Why it happens:** Triggers are tested against the happy path only.
**How to avoid:** Write specific test cases for: new client creation, re-entry after Phase 5, attempting to skip phases, concurrent phase transitions for different clients, attempting to activate the same phase twice.
**Warning signs:** Test suite does not cover edge cases; trigger only tested via application code.

### Pitfall 4: Exposing Service Role Key

**What goes wrong:** The `SUPABASE_SERVICE_ROLE_KEY` is used in a client component or API route that's accessible from the browser. This key bypasses all RLS policies.
**Why it happens:** Copy-paste from server code to client code, or importing the wrong Supabase client file.
**How to avoid:** Keep three separate client files: `client.ts` (browser, uses anon key), `server.ts` (RSC/server actions, uses anon key + cookies), `admin.ts` (service role, only for server-side admin operations). Never import `admin.ts` from a client component.
**Warning signs:** `SUPABASE_SERVICE_ROLE_KEY` appearing in browser network requests or source maps.

### Pitfall 5: Type Generation Drift

**What goes wrong:** Database schema is updated via migration, but `supabase gen types` is not re-run. TypeScript types are stale, causing runtime errors where the code expects a column that was renamed or removed.
**Why it happens:** Manual step is forgotten after schema changes.
**How to avoid:** Add a script to `package.json`: `"db:types": "supabase gen types typescript --project-id $PROJECT_REF --schema public > src/lib/database/types.ts"`. Run it after every migration. Consider adding it to a pre-commit hook or CI step.
**Warning signs:** TypeScript compiles but runtime errors mention missing columns.

## Code Examples

### Creating the Operator User (Seed Script)

```sql
-- supabase/seed.sql
-- Create the operator user via Supabase Auth
-- Note: In production, create the operator through the Supabase dashboard
-- or a one-time setup script. This is for local development.

-- The operator user is created via supabase.auth.signUp() or dashboard.
-- For local dev with supabase start, users can be created via the dashboard at localhost:54323
```
[ASSUMED -- Supabase local dev provides a dashboard at port 54323 for user management]

### RLS Policies for Solo Operator

```sql
-- supabase/migrations/00003_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- For solo operator: authenticated users can do everything
-- This is simple now but can be tightened for multi-user later
CREATE POLICY "Authenticated users can read all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

-- Repeat for all tables...
-- In a real implementation, create a helper function:
-- CREATE FUNCTION is_authenticated() RETURNS BOOLEAN AS $$
--   SELECT auth.role() = 'authenticated'
-- $$ LANGUAGE sql SECURITY DEFINER;
```
[ASSUMED -- standard Supabase RLS pattern for authenticated-only access]

### Generated Types Usage

```typescript
// After running: npx supabase gen types typescript --project-id $REF > src/lib/database/types.ts
// The generated file provides Database type that types all Supabase client operations

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database/types'

// In a Server Component:
export default async function DashboardPage() {
  const supabase = await createClient()

  // Fully typed! client is typed as Database['public']['Tables']['clients']['Row']
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error

  return <div>{clients.map(c => <p key={c.id}>{c.name}</p>)}</div>
}
```
[CITED: https://supabase.com/docs/guides/api/rest/generating-types]

### Process-to-Phase Mapping Constants

```typescript
// src/lib/database/enums.ts

export const PHASE_NAMES = {
  1: 'Diagnostico',
  2: 'Engenharia de Valor',
  3: 'Go-to-Market',
  4: 'Tracao e Vendas',
  5: 'Retencao e Escala',
} as const

export const PHASE_LABELS_EN = {
  1: 'diagnostic',
  2: 'value_engineering',
  3: 'go_to_market',
  4: 'traction_sales',
  5: 'retention_scale',
} as const

// Process number -> Phase number mapping
export const PROCESS_TO_PHASE: Record<number, number> = {
  1: 1, 2: 1,                    // Phase 1: Diagnostico (Processes 1-2)
  3: 2, 4: 2, 5: 2, 6: 2,       // Phase 2: Engenharia de Valor (Processes 3-6)
  7: 3, 8: 3, 9: 3, 10: 3, 11: 3, // Phase 3: Go-to-Market (Processes 7-11)
  12: 4, 13: 4, 14: 4, 15: 4,   // Phase 4: Tracao e Vendas (Processes 12-15)
  16: 5,                          // Phase 5: Retencao e Escala (Process 16)
}

// Process number -> Squad mapping
export const PROCESS_TO_SQUAD: Record<number, string> = {
  1: 'estrategia', 2: 'estrategia',
  3: 'estrategia', 4: 'estrategia', 5: 'estrategia', 6: 'estrategia',
  7: 'planejamento', 8: 'planejamento', 9: 'planejamento', 10: 'planejamento', 11: 'planejamento',
  12: 'growth', 13: 'growth', 14: 'growth', 15: 'growth',
  16: 'crm',
}

// Gate number -> Phase number (gate N follows phase N)
export const GATE_TO_PHASE: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4,
}
```
[VERIFIED: domain mapping extracted from docs/agency-os-prompt.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers is deprecated; SSR package is the replacement |
| `getSession()` for server auth | `getUser()` or `getClaims()` | 2025 | `getSession()` reads from cookies which can be spoofed; `getClaims()` validates JWT |
| Next.js Pages Router | Next.js App Router | Next.js 13+ (default since 14) | App Router is required for RSC, Server Actions, middleware patterns |
| Zod v3 | Zod v4 (transitioning) | 2025 | v4 released with subpath import `zod/v4`; ecosystem still migrating |
| TypeScript 5.x | TypeScript 6.0 | 2025-2026 | Ships with latest Next.js; minor import resolution improvements |
| `create-next-app` with explicit flags | `create-next-app --yes` | Next.js 16 | TypeScript, Tailwind, App Router, Turbopack are all defaults now |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Zod v3 is better for Phase 1 than v4 due to ecosystem compatibility | Standard Stack | Low -- v3 is still fully maintained; can upgrade to v4 anytime |
| A2 | TEXT + CHECK is better than PostgreSQL ENUM for status columns | Architecture Patterns | Low -- both work; ENUM is slightly more efficient but harder to modify |
| A3 | Solo operator should be created via Supabase dashboard, not code | Code Examples | Low -- multiple valid approaches; dashboard is simplest |
| A4 | `getUser()` is the safer default for middleware auth validation | Architecture Patterns | Low -- `getClaims()` is also valid; `getUser()` adds ~100ms per request but verifies session |
| A5 | Schema includes `previous_cycle_id` for future feedback loop support | Architecture Patterns | Low -- one nullable FK column; if feedback loop design changes, the column is simply unused |
| A6 | Supabase local dev dashboard runs on port 54323 | Code Examples | Low -- port may vary; check `supabase start` output |

## Open Questions

1. **Supabase project: cloud or local-first for development?**
   - What we know: Supabase CLI 2.84.2 is installed. `supabase start` runs a local Supabase stack via Docker (which is installed). Cloud project is needed for production.
   - What's unclear: Should development use local Supabase (via Docker) or a cloud dev project? Local is faster and free but requires Docker running.
   - Recommendation: Use local Supabase for development (`supabase start`), cloud for production. Type generation can work from either. Docker is available on this machine.

2. **Operator user creation strategy**
   - What we know: FOUN-01 requires email/password login. Supabase Auth handles this.
   - What's unclear: Should the operator user be created via seed script, Supabase dashboard, or a one-time signup page?
   - Recommendation: Create via Supabase dashboard (simplest for solo operator). Include a seed script for local dev that creates a test user.

3. **VPS deployment in Phase 1 scope?**
   - What we know: FOUN-04 says "runs on a VPS." But Phase 1 is about the foundation and schema.
   - What's unclear: Is actual VPS deployment in scope for Phase 1, or just ensuring the architecture supports it?
   - Recommendation: Phase 1 should ensure the app works with `next start` (production mode, not dev). Actual VPS deployment and PM2 setup can be deferred to a later deployment phase, unless the success criteria strictly requires a running VPS.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js 16 (requires >= 20.9) | Yes | 20.19.6 | -- |
| npm | Package management | Yes | 10.8.2 | -- |
| Supabase CLI | Migrations, type generation, local dev | Yes | 2.84.2 | -- |
| Docker | Supabase local dev (`supabase start`) | Yes | 29.3.1 | Use Supabase Cloud project for dev instead |
| Claude Code CLI | Not needed for Phase 1 | Yes | installed | -- |
| PM2 | VPS process management | No | -- | Use `next start` directly or install pm2 globally |
| Redis | Not needed for Phase 1 | No | -- | PostgreSQL-backed job queue (decided) |

**Missing dependencies with no fallback:**
- None -- all Phase 1 requirements can be met with available tools.

**Missing dependencies with fallback:**
- PM2 not installed but not critical for Phase 1 (can install later: `npm install -g pm2`)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | None -- Wave 0 (needs `vitest.config.ts`) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUN-01 | Unauthenticated users redirected to login | integration | `npx vitest run tests/auth/middleware.test.ts -t "redirect"` | Wave 0 |
| FOUN-02 | 5 phases created per client with correct numbers | unit | `npx vitest run tests/db/schema.test.ts -t "phases"` | Wave 0 |
| FOUN-03 | Non-sequential phase activation rejected by trigger | integration | `npx vitest run tests/db/triggers.test.ts -t "sequential"` | Wave 0 |
| FOUN-03 | Sequential phase activation succeeds | integration | `npx vitest run tests/db/triggers.test.ts -t "advance"` | Wave 0 |
| FOUN-04 | App builds and starts in production mode | smoke | `npx next build && timeout 10 npx next start` | Wave 0 |
| FOUN-04 | Supabase client connects successfully | integration | `npx vitest run tests/db/connection.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration for Next.js project
- [ ] `tests/db/triggers.test.ts` -- covers FOUN-03 (phase sequence enforcement)
- [ ] `tests/db/schema.test.ts` -- covers FOUN-02 (schema creation and relationships)
- [ ] `tests/db/connection.test.ts` -- covers FOUN-04 (Supabase connectivity)
- [ ] `tests/auth/middleware.test.ts` -- covers FOUN-01 (auth redirect)
- [ ] Framework install: `npm install -D vitest` -- not yet installed

**Note:** Testing database triggers requires a running Supabase local instance. Tests for FOUN-03 should use `supabase start` + direct SQL queries against the local database to verify trigger behavior. These are integration tests, not unit tests.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase Auth (email/password); middleware enforces auth on all protected routes |
| V3 Session Management | Yes | `@supabase/ssr` handles session tokens via cookies; JWT refresh in middleware |
| V4 Access Control | Yes | RLS policies on all tables; service role key server-side only |
| V5 Input Validation | Yes | Zod schemas validate all inputs at API boundaries |
| V6 Cryptography | No (Phase 1) | Supabase handles password hashing and JWT signing |

### Known Threat Patterns for Next.js + Supabase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Exposed Supabase service role key | Elevation of Privilege | Never import `admin.ts` from client components; use env var naming conventions (`SUPABASE_SERVICE_ROLE_KEY` without `NEXT_PUBLIC_` prefix) |
| Cookie spoofing for auth bypass | Spoofing | Use `getUser()` or `getClaims()` instead of `getSession()` for server-side auth checks |
| Anon key data access without RLS | Information Disclosure | Enable RLS on ALL tables from day one; anon key is public |
| SQL injection via Supabase client | Tampering | Supabase client uses parameterized queries by default; Zod validates inputs |
| CSRF on Server Actions | Tampering | Next.js Server Actions have built-in CSRF protection via origin checking |

## Sources

### Primary (HIGH confidence)
- [npm registry] -- Verified versions: Next.js 16.2.3, React 19.2.5, TypeScript 6.0.2, @supabase/supabase-js 2.102.1, @supabase/ssr 0.10.0, Zod 4.3.6 (latest) / 3.25.76 (v3 latest), Tailwind 4.2.2, Vitest 4.1.3
- [Local machine] -- Node.js 20.19.6, Supabase CLI 2.84.2, Docker 29.3.1, Claude CLI installed
- [Supabase docs: auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs) -- SSR middleware setup, `getClaims()` vs `getUser()` guidance
- [Supabase docs: auth/server-side/creating-a-client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) -- Server and browser client creation patterns
- [Supabase docs: api/rest/generating-types](https://supabase.com/docs/guides/api/rest/generating-types) -- TypeScript type generation with `supabase gen types`
- [docs/agency-os-prompt.md] -- Domain model: 5 phases, 16 processes, 4 squads, 4 quality gates with exact process-to-phase mapping

### Secondary (MEDIUM confidence)
- [Zod v4 migration guide](https://zod.dev/v4/changelog) -- Breaking changes from v3 to v4; subpath import strategy
- [Next.js 16 blog post](https://nextjs.org/blog/next-16) -- Turbopack default, App Router patterns
- [Supabase docs: deployment/database-migrations](https://supabase.com/docs/guides/deployment/database-migrations) -- Migration workflow with CLI

### Tertiary (LOW confidence)
- [PostgreSQL trigger patterns for state machines](https://www.cybertec-postgresql.com/en/triggers-to-enforce-constraints/) -- General trigger approach; specific implementation needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry, environment probed
- Architecture: HIGH -- Supabase SSR patterns verified against official docs; schema design validated against domain document
- Pitfalls: MEDIUM-HIGH -- based on official docs warnings (getSession vs getUser) and established PostgreSQL patterns; trigger edge cases need testing
- Security: HIGH -- RLS and auth patterns directly from Supabase official guidance

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (30 days -- stable stack, no fast-moving components in Phase 1)
