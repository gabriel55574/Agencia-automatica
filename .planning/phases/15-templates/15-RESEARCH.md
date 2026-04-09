# Phase 15: Templates - Research

**Researched:** 2026-04-09
**Researcher:** Orchestrator (inline)
**Status:** Complete

## Research Question

What do we need to know to PLAN Phase 15 (Templates) well?

## 1. Existing Codebase Patterns

### Database Schema Pattern
- All tables use UUID primary keys (`id uuid DEFAULT gen_random_uuid()`)
- Standard timestamp columns: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Foreign keys reference parent tables (e.g., `client_id REFERENCES clients(id)`)
- CHECK constraints for status enums (not PG ENUMs)
- Migrations are sequential: `00001_` through `00009_` exist; next is `00010_`
- Types are auto-generated via `supabase gen types typescript --project-id lzpcugxyjzunmerenawy`
- Zod schemas in `src/lib/database/schema.ts` mirror DB tables for runtime validation

### Server Action Pattern
- All actions in `src/lib/actions/*.ts` use `'use server'` directive
- Auth check pattern: `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: 'Unauthorized' }`
- Write operations use `createAdminClient()` (bypasses RLS)
- Input validation with Zod before any DB operation
- Return type: `ActionResult = { error: string } | { success: true }`
- `revalidatePath()` called after mutations

### Client Creation Pattern (relevant for TMPL-02 clone)
- `createClientAction` in `src/lib/actions/clients.ts` validates with `briefingSchema` and `clientInsertSchema`
- Uses `admin.rpc('create_client_with_phases', { p_name, p_company, p_briefing })` to atomically create client + 5 phases + 16 processes + 4 gates
- Redirects to `/clients/${clientId}` after creation
- Briefing is a JSONB column with shape: `{ niche: string, target_audience: string, additional_context?: string }`

### Squad Execution Context Assembly (relevant for TMPL-03)
- `assembleContext()` in `src/lib/squads/assembler.ts` builds context for squad prompts
- Takes `clientId` and `processNumber`, returns `AssembledContext`
- Context includes: briefing, prior phase outputs, feedback from previous cycles
- Truncation at 32,000 chars total (oldest outputs removed first)
- `AssembledContext` type: `{ briefing, priorOutputs, feedbackContext, truncated, totalOutputsAvailable, outputsIncluded }`
- Squad prompt builders in `src/lib/squads/{estrategia,planejamento,growth,crm}.ts` take `(context, processNumber)` and return prompt string

### Squad Output Viewing (relevant for TMPL-01)
- `StructuredOutputView` in `src/components/squad/StructuredOutputView.tsx` renders `structured_output` JSONB
- Component receives `structuredOutput: Record<string, unknown> | null` and `rawOutput: string | null`
- `structured_output` is a JSONB column on `squad_jobs` table (added in migration `00007`)
- The output viewer is used inside process-row / process-jobs-section components
- Only completed jobs with `structured_output` should offer "Save as Template"

### PromptPreviewModal (relevant for TMPL-03)
- `PromptPreviewModal` in `src/components/squad/PromptPreviewModal.tsx` shows assembled prompt before confirming
- Receives `PreviewData` with `context, prompt, squadType, processId, clientId, phaseId`
- Calls `confirmSquadRun` server action on confirm
- The modal would need a template selector dropdown added between context summary and full prompt

### Dashboard Routing
- App uses Next.js App Router with route groups: `(auth)` and `(dashboard)`
- Dashboard layout requires auth (redirects to /login if no user)
- Client pages: `/clients`, `/clients/new`, `/clients/[id]`, `/clients/[id]/edit`, `/clients/[id]/outputs`
- No `/templates` route exists yet — needs to be created

## 2. Schema Design for Templates Table

### templates table
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  process_number INTEGER NOT NULL CHECK (process_number >= 1 AND process_number <= 16),
  content JSONB NOT NULL,
  source_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  source_job_id UUID REFERENCES squad_jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Key decisions:
- `content` stores the `structured_output` JSON from the source squad job
- `source_client_id` and `source_job_id` use `ON DELETE SET NULL` so templates survive if source is deleted
- No RLS needed (solo operator), but migration should add basic RLS policy for forward-compatibility
- `process_number` allows filtering templates by process when selecting in PromptPreviewModal

## 3. Integration Points Analysis

### TMPL-01: Save as Template
- **Where:** Add "Save as Template" button to `StructuredOutputView.tsx`
- **Data flow:** Button click → dialog (name, description) → `createTemplateAction` server action → insert into `templates` table
- **Guard:** Only show button when `structuredOutput` is not null (already have `hasStructured` check in component)
- **New files needed:** `src/lib/actions/templates.ts` (server actions), template save dialog component

### TMPL-02: Clone Client
- **Where:** Add "Clone Client" button on client profile page (`src/app/(dashboard)/clients/[id]/page.tsx`)
- **Data flow:** Button click → dialog (new name, new company) → `cloneClientAction` server action → `create_client_with_phases` RPC with source briefing
- **Key constraint:** Clone copies briefing only, NOT pipeline state, jobs, or gate reviews. Fresh start at Phase 1.
- **Placement:** Next to Edit/Archive buttons in header area

### TMPL-03: Template in Squad Prompt
- **Where:** Add template selector to `PromptPreviewModal.tsx`
- **Data flow:** Dropdown fetches templates filtered by current process_number → selected template content appended to assembled context
- **Context budget:** Template content must count against the 32K truncation budget
- **Assembler change:** `assembleContext()` needs an optional `templateContent` parameter, or the template injection happens at the prompt builder level
- **Decision:** Inject at assembler level (before truncation) so template content participates in the truncation budget. Add optional `templateContent?: string` parameter to `assembleContext()`.

### Template Management Page
- **Route:** `/templates` under `(dashboard)` group
- **Features:** List all templates, delete, edit name/description
- **No complex CRUD needed:** Simple table with actions

## 4. Validation Architecture

### Test Strategy
- Unit: Zod schema validation for template insert
- Integration: Template CRUD server actions with live Supabase
- Integration: Clone client action creates client with correct briefing
- Integration: Template content injected into assembled context correctly
- E2E: Save template from output viewer, use template in squad run

### Verification Commands
- `npx tsc --noEmit` — TypeScript compiles clean
- `npm run build` — Next.js build succeeds
- `grep -q "templates" src/lib/database/types.ts` — types regenerated with templates table
- `grep -r "createTemplateAction" src/` — server action exists and is imported

## RESEARCH COMPLETE
