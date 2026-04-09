# Phase 5: Squad Execution & Context — Research

**Researched:** 2026-04-09
**Domain:** Squad trigger UI, context assembly, prompt templates, Claude CLI output parsing, structured output storage
**Confidence:** HIGH (all critical findings verified from live codebase and CLI)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** "Run Squad" button appears on process rows where `process.status IN ('active', 'pending')` AND the process belongs to the client's currently active phase. Completed processes show `[View Output]` only.
- **D-02:** Button label `▶ Run Squad`. Auto-squad from `PROCESS_TO_SQUAD`. Tooltip shows squad name.
- **D-03:** While a job is running, show Phase 4's `[running]` badge and `[View Progress ►]`. "Run Squad" hidden while job is in-flight.
- **D-04:** Context assembler collects: (1) `clients.briefing`, (2) prior phase outputs (`squad_jobs.output` WHERE status='completed' AND phase_number < current), (3) empty feedback placeholder.
- **D-05:** `assembleContext(clientId, processNumber): Promise<AssembledContext>` lives in `src/lib/squads/assembler.ts`.
- **D-06:** If context exceeds 32,000 characters, truncate oldest-first. Preview shows yellow warning banner.
- **D-07:** Four static squad template files in `src/lib/squads/`: `estrategia.ts`, `planejamento.ts`, `growth.ts`, `crm.ts`. Each exports `buildPrompt(context, processNumber): string`.
- **D-08:** Prompt structure: Squad Identity + Agency OS Methodology + Client Context + Process Instructions + Output Format.
- **D-09:** CLI invocation: `claude --print --output-format json -p "{assembledPrompt}"`. Full prompt stored in `squad_jobs.cli_command`.
- **D-10:** Preview modal is read-only. Shows squad name, process name, context summary (briefing truncated to 300 chars), full prompt in `<pre>`, yellow truncation banner if applicable.
- **D-11:** "Confirm & Run" is a Server Action that INSERTs into `squad_jobs` with `status='queued'`. Worker picks it up.
- **D-12:** 16 Zod schemas in `src/lib/squads/schemas/process-01.ts` through `process-16.ts`. Schema derived from each process output checklist.
- **D-13:** Parse flow in worker after CLI completes: (1) write raw output, (2) safeParse, (3) success → write `structured_output`, (4) failure → log to `error_log`, leave `structured_output` null.
- **D-14:** New migration: add `structured_output JSONB` to `squad_jobs`.
- **D-15:** Accordion expansion shows structured view if `structured_output` present, else raw `<pre>`. "View Raw" toggle always available.
- **D-16:** Show latest completed run only. Run history deferred to Phase 7.

### Claude's Discretion

- Exact Zod schema structure per process — derive from `docs/agency-os-prompt.md` output checklists
- Whether output parsing runs in worker vs. post-completion Server Action
- Whether `buildPrompt()` imports from PROCESS_DEFINITIONS or reads inline
- Exact truncation behavior (character count vs token estimate)
- Structured output rendering approach per process type

### Deferred Ideas (OUT OF SCOPE)

- Prompt editing in preview modal — v2
- Re-run a completed process — v1.1
- Run history side sheet — Phase 7
- Per-process token budget alerts (COST-01-03) — v2
- Feedback loop context injection — Phase 9
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SQAD-01 | Operator can trigger a squad session for any process via button click | `RunSquadButton` component in `ProcessAccordionRow`, Server Action `confirmSquadRun` INSERT to `squad_jobs` |
| SQAD-02 | System automatically assembles context (prior outputs, briefing, feedback slot) | `assembleContext()` in `src/lib/squads/assembler.ts` — query `squad_jobs` + `clients` |
| SQAD-04 | Each of the 4 squads has specialized prompts for their processes | 4 `buildPrompt()` files in `src/lib/squads/`, squad identities verbatim from `docs/agency-os-prompt.md` |
| SQAD-05 | Squad outputs are parsed into structured data and stored alongside raw CLI output | Worker `close` handler parses `JSON.parse(outer.result)` → Zod schema, writes `structured_output` |
| SQAD-06 | Output parsing uses Zod schemas per process type with fallback to raw storage | 16 schemas in `src/lib/squads/schemas/`, `safeParse` with fallback leaves `structured_output` null |
| SQAD-07 | Operator can preview assembled prompt before triggering run | `PromptPreviewModal` reads assembled prompt before INSERT |
</phase_requirements>

---

## Summary

Phase 5 builds the end-to-end squad execution loop: operator clicks "Run Squad" on a process row, the system assembles a structured prompt from client data and prior outputs, the operator previews it, confirms, and the existing Phase 4 worker picks up the job and runs the Claude CLI. After completion, the worker parses the structured output and stores it alongside the raw CLI text.

The codebase is in a strong position for this phase. The Phase 4 worker (`src/worker/job-runner.ts`) already handles spawn, progress batching, completion writing, and failure retry — Phase 5 adds only the post-completion parse step to the `close` handler. The Phase 3 accordion (`ProcessAccordionRow` in `pipeline-phase.tsx`) is the correct extension point for the "Run Squad" button and output display. All status enums, squad mappings, and process definitions are already in the codebase and directly injectable into prompts.

One verified critical finding: the Claude CLI `--output-format json` wraps the actual response in an envelope. The `result` field is always a **string**, even when Claude returns JSON content. Output parsing must do two-level deserialization: `JSON.parse(outer.result)` before applying Zod schemas. The existing `isCliError()` function already reads this envelope correctly (checks `is_error` field). The parser must follow the same pattern.

**Primary recommendation:** Extend `ProcessAccordionRow` to accept a `latestJob` prop, add `RunSquadButton` and output display inside the existing accordion content, and add the parse step to the worker's `close` handler — minimal structural changes, maximum leverage of existing infrastructure.

---

## Standard Stack

### Core (all already installed)

| Library | Installed Version | Purpose | Source |
|---------|------------------|---------|--------|
| Next.js | 16.2.3 | Server Actions, App Router, RSC | [VERIFIED: package.json] |
| React | 19.2.4 | Client components (modal, button) | [VERIFIED: package.json] |
| TypeScript | ^5 | Type safety for prompt templates and schemas | [VERIFIED: package.json] |
| Zod | 4.3.6 | 16 process output schemas + input validation | [VERIFIED: node_modules/zod/package.json] |
| @supabase/supabase-js | ^2.102.1 | DB queries in assembler + Server Action INSERT | [VERIFIED: package.json] |
| @supabase/ssr | ^0.10.0 | Server-side Supabase in Server Action | [VERIFIED: package.json] |
| sonner | ^2.0.7 | Toast notifications on trigger/error | [VERIFIED: package.json] |
| lucide-react | ^1.7.0 | Icons (Play icon for "Run Squad" button) | [VERIFIED: package.json] |
| shadcn/ui | Installed (Dialog, Badge, Button) | PromptPreviewModal, RunSquadButton styling | [VERIFIED: src/components/ui/] |
| Claude Code CLI | 2.1.94 | Squad execution engine | [VERIFIED: `claude --version`] |

**No new dependencies required.** Phase 5 uses only what is already installed.

### CLI Flags (verified live)

```bash
# Confirmed working flags (verified with `claude --help` and live test)
claude --print --output-format json -p "{prompt}"
# --print      : non-interactive, exit after response
# --output-format json : wraps result in JSON envelope
# -p           : alias for --print, prompt as positional arg
# --no-session-persistence : already used by worker (avoids session state)
# --permission-mode auto   : already used by worker
```
[VERIFIED: live CLI test with `claude --help` output and actual invocation]

---

## Architecture Patterns

### Recommended Project Structure (new files)

```
src/
├── lib/
│   └── squads/
│       ├── assembler.ts              # assembleContext() pure function
│       ├── estrategia.ts             # buildPrompt() for processes 1-6
│       ├── planejamento.ts           # buildPrompt() for processes 7-11
│       ├── growth.ts                 # buildPrompt() for processes 12-15
│       ├── crm.ts                    # buildPrompt() for process 16
│       └── schemas/
│           ├── index.ts              # getSchema(processNumber) dispatcher
│           ├── process-01.ts         # Pesquisa de Mercado e Insights
│           ├── process-02.ts         # Segmentacao, Targeting e Personas
│           ├── process-03.ts         # ... (through process-16.ts)
│           └── process-16.ts         # CRM, Lealdade e CLV
├── actions/
│   └── squad.ts                      # confirmSquadRun() Server Action
└── components/
    └── squad/
        ├── RunSquadButton.tsx         # Trigger button (client component)
        └── PromptPreviewModal.tsx     # Read-only preview + confirm (client component)
supabase/migrations/
└── 00007_squad_structured_output.sql # ADD COLUMN structured_output JSONB
```

Note: CONTEXT.md named migration `00005_squad_structured_output.sql` but the filesystem already has `00005` and `00006`. Correct filename is `00007_squad_structured_output.sql`.
[VERIFIED: `ls supabase/migrations/` shows 00001 through 00006 exist]

### Pattern 1: Two-Level JSON Parsing (CRITICAL)

**What:** Claude CLI `--output-format json` outputs a JSON envelope. The actual Claude response is always a **string** in the `result` field, even when Claude returns structured JSON.

**Verified structure:**
```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "result": "{\"process_number\":1,\"insights\":[...]}",
  "stop_reason": "end_turn",
  "session_id": "...",
  "total_cost_usd": 0.199
}
```

**Parse flow in worker `close` handler:**
```typescript
// Source: verified via live CLI test 2026-04-09
function parseCliOutput(rawStdout: string): unknown | null {
  try {
    const jsonLine = rawStdout.split('\n').find(l => l.trim().startsWith('{'))
    if (!jsonLine) return null
    const envelope = JSON.parse(jsonLine)          // Step 1: outer envelope
    if (envelope.is_error || !envelope.result) return null
    return JSON.parse(envelope.result)              // Step 2: inner JSON string
  } catch {
    return null
  }
}
```

This is identical in structure to the existing `isCliError()` function — same two-step pattern.

### Pattern 2: Context Assembler

**What:** Pure async function that queries Supabase for briefing + prior phase outputs.

**Key query logic (Claude's discretion for exact implementation):**
```typescript
// src/lib/squads/assembler.ts
// Uses admin client (worker context) or server client (Server Action context)
// Prior outputs: squad_jobs.output WHERE status='completed' 
//   AND processes.phase_number < client.current_phase_number
//   ORDER BY phase_number ASC, process_number ASC
```

**Important DB relationship to query:**
- `squad_jobs.process_id` → `processes.process_number` and `processes.phase_id`
- `phases.phase_number` → compare against `clients.current_phase_number`
- Only `squad_jobs.status = 'completed'` rows
- Exclude same-phase processes (D-04 decision)

### Pattern 3: Server Action (matches existing gates.ts pattern)

```typescript
// src/lib/actions/squad.ts — follows gates.ts pattern exactly
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function confirmSquadRun(
  processId: string,
  clientId: string,
  phaseId: string,
  squadType: SquadType,
  cliCommand: string
): Promise<ActionResult> {
  // 1. Auth check (always first — matches clients.ts and gates.ts)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 2. Validate inputs with Zod
  // 3. Admin INSERT into squad_jobs with status='queued'
  // 4. revalidatePath(`/clients/${clientId}`)
  // 5. Return { success: true } or { error: message }
}
```
[CITED: src/lib/actions/gates.ts]

### Pattern 4: Worker Parse Step (extends existing close handler)

The existing `job-runner.ts` `close` handler currently writes `output: stdoutBuffer` on success. Phase 5 adds parse logic **within** the existing success branch:

```typescript
// Extend the existing success branch in proc.on('close', ...) 
// in src/worker/job-runner.ts
if (success) {
  // EXISTING: write raw output
  const parsedStructured = attemptParse(stdoutBuffer, job.process_id)
  
  await supabase
    .from('squad_jobs')
    .update({
      status: 'completed',
      output: stdoutBuffer,                    // raw always preserved
      structured_output: parsedStructured,     // null if parse fails
      progress_log: stdoutBuffer,
      completed_at: new Date().toISOString(),
    })
    .eq('id', job.id)
}
```

The `attemptParse` function lives in a new module (e.g., `src/worker/output-parser.ts`) to keep job-runner.ts clean.

### Pattern 5: Prompt Template Structure

Squad identity text comes verbatim from `docs/agency-os-prompt.md` "COMO OS SQUADS CLAUDE OPERAM" section. The planner must extract exact identity text per squad:

- **Squad Estrategia:** "Agentes: Pesquisador de Mercado, Analista de Segmentacao, Especialista em Posicionamento, Arquiteto de Ofertas"
- **Squad Planejamento:** "Agentes: Planejador G-STIC, Arquiteto de Canais, Especialista em Logistica"
- **Squad Growth:** "Agentes: Diretor Criativo, Gestor de Midia, Growth Hacker (Bullseye), Closer de Vendas"
- **Squad CRM:** "Agentes: Analista de CLV, Gestor de Retencao, Especialista em Automacao"

`buildPrompt()` injects `PROCESS_DEFINITIONS[processNumber]` for inputs, steps, and checklist. No need to duplicate that data — import directly from `src/lib/pipeline/processes.ts`.

### Pattern 6: Accordion Extension Point

`ProcessAccordionRow` in `src/components/clients/process-row.tsx` is the component to extend. It currently receives `process` and `definition` props. Phase 5 adds:
- `latestJob: { id, status, structured_output, output } | null` prop
- `clientPhaseNumber: number` prop (for active-phase check per D-01)
- `onRunSquad: (processId: string) => void` callback (triggers assembleContext → preview modal)

The parent `PipelinePhase` passes these down after receiving them from `PipelineAccordion`.

### Anti-Patterns to Avoid

- **Parsing raw `output` directly as JSON:** The `output` field is raw CLI stdout including the envelope. Always extract `envelope.result` first.
- **Shell injection via exec():** Worker already uses `spawn()` with array args. Never switch to `exec()` or `shell: true` for prompt injection.
- **Assembling context in the client component:** `assembleContext()` must be server-side only — briefing and prior outputs contain sensitive client data.
- **Running assembleContext in the Server Action without preview:** Context must be assembled before the modal opens, not after confirmation — the preview shows the assembled prompt.
- **Calling `buildPrompt()` before `assembleContext()`:** Template functions depend on assembled context; the order is assemble → build → preview → confirm.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dialog/modal | Custom modal overlay | shadcn/ui Dialog (already installed) | Already used in GateSection — consistent UX |
| Toast notifications | Custom alert | sonner (already installed) | Gate pattern already uses this |
| Character truncation | Custom string slicer | `String.slice(0, 32000)` with length check | Simple string operation, no library needed |
| JSON schema validation | Manual field checks | Zod `safeParse` (already installed, v4.3.6) | Graceful failure path with `.success` flag |
| Supabase realtime for output display | Manual polling | Page `revalidatePath` after job completion | Simpler: Server Action + revalidate is sufficient for post-run display; Realtime only needed during run (Phase 4 already handles this) |

---

## Runtime State Inventory

Step 2.5: SKIPPED — Phase 5 is greenfield addition to existing tables, not a rename/refactor.

---

## Common Pitfalls

### Pitfall 1: Two-Level JSON Parsing

**What goes wrong:** Parser calls `JSON.parse(rawOutput)` expecting process-specific JSON. Gets the CLI envelope object, which has no process-specific fields. Zod parse fails for every run.

**Why it happens:** `squad_jobs.output` stores raw CLI stdout, which is the full envelope JSON, not the inner result.

**How to avoid:** Always extract `envelope.result` (string) before calling `JSON.parse()` again. Follow the `isCliError()` pattern in `job-runner.ts` — it already finds the JSON line and parses the envelope.

**Warning signs:** All 16 process schemas fail to parse despite CLI reporting success (`is_error: false`). `structured_output` is always null.

### Pitfall 2: Migration Numbering Conflict

**What goes wrong:** CONTEXT.md references `00005_squad_structured_output.sql` but `00005` is already taken by `00005_initialize_client_processes.sql`.

**Why it happens:** Context was written before Phase 3 migrations were committed.

**How to avoid:** Use `00007_squad_structured_output.sql` — verified that `00001` through `00006` are already used.
[VERIFIED: `ls supabase/migrations/`]

### Pitfall 3: `assembleContext` Query Joins

**What goes wrong:** Query fetches prior outputs but includes current-phase processes, or loses process ordering.

**Why it happens:** `squad_jobs` links to `processes` which links to `phases`. Multi-join query is easy to get wrong.

**How to avoid:** Join path: `squad_jobs → processes.process_number, phase_id → phases.phase_number`. Filter: `phases.phase_number < client.current_phase_number`. Order: `phases.phase_number ASC, processes.process_number ASC`.

### Pitfall 4: Button Visibility Logic

**What goes wrong:** "Run Squad" shows on processes in non-active phases, or shows while a job is in-flight.

**Why it happens:** D-01 and D-03 conditions are independent: must check both process status AND active phase AND no in-flight job.

**How to avoid:** Button visible when ALL three conditions true:
1. `process.status IN ('active', 'pending')`  
2. `process.phase_id === activePhase.id` (the phase with status='active')
3. `latestJob === null || latestJob.status NOT IN ('queued', 'running')`

### Pitfall 5: Zod Schema Comment Mismatch

**What goes wrong:** `src/lib/database/schema.ts` header says "Uses Zod v3 syntax. Do NOT use Zod v4 breaking changes." The installed Zod is actually v4.3.6.

**Why it happens:** Zod v4 maintains API compatibility with v3 for core patterns (`.safeParse`, `.extend`, `.object`, `.string`, `.nullable`). The comment warns against v4 **breaking changes** specifically, not against using v4 in general.

**How to avoid:** All 16 process schemas should use only the v3-compatible Zod API already used in `schema.ts`: `z.object`, `z.string`, `z.number`, `z.array`, `z.nullable`, `z.optional`, `z.enum`, `z.record`. These all work identically in v4.3.6.
[VERIFIED: tested v3-compatible patterns against v4.3.6 — all pass]

### Pitfall 6: Context Size Estimation

**What goes wrong:** Character-based truncation (32,000 chars) doesn't map cleanly to Claude's context window (which is token-based). Very long outputs might not actually hit the limit; dense outputs might hit it faster.

**Why it happens:** D-06 decision chose character count for simplicity.

**How to avoid:** Character limit is intentionally conservative (32K chars ≈ ~8K tokens for English text, well within Claude's 200K context window). Do not replace with token counting — the simplicity of character counting is the point. Just implement it faithfully.

### Pitfall 7: Worker Import Path for New Modules

**What goes wrong:** Adding `import { assembleContext } from '@/lib/squads/assembler'` to the worker fails at runtime because `tsx` runs outside the Next.js bundler context and `@/` alias is not resolved.

**Why it happens:** Already documented in `src/worker/index.ts` header: "CRITICAL: Use RELATIVE imports only."

**How to avoid:** In worker files, import new modules with relative paths: `import { parseOutput } from '../lib/squads/output-parser'`.
[CITED: src/worker/index.ts — line 15-16 comment]

---

## Code Examples

### CLI Output Structure (verified live)

```json
// Source: live test `echo "..." | claude --print --output-format json`
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 2681,
  "num_turns": 1,
  "result": "...",
  "stop_reason": "end_turn",
  "session_id": "...",
  "total_cost_usd": 0.199,
  "usage": { "input_tokens": 2, "output_tokens": 7, ... }
}
```

The `result` field is always a **string**. If Claude responds with JSON, `result` contains the JSON as a string. Parse with `JSON.parse(envelope.result)`.

### Zod Schema Pattern for Process Output (example: Process 1)

```typescript
// Source: derived from docs/agency-os-prompt.md output checklist for Process 1
// src/lib/squads/schemas/process-01.ts
import { z } from 'zod'

export const process01Schema = z.object({
  problem_definition: z.string(),        // "Problema/oportunidade claramente definido"
  data_sources: z.array(z.string()),     // "Fontes de dados mapeadas"
  competitive_analysis: z.object({       // "Analise competitiva (5 Cs)"
    clientes: z.string(),
    colaboradores: z.string(),
    companhia: z.string(),
    concorrentes: z.string(),
    contexto: z.string(),
  }),
  actionable_insights: z.array(z.string()), // "Insights acionaveis"
})

export type Process01Output = z.infer<typeof process01Schema>
```

### Schema Dispatcher

```typescript
// src/lib/squads/schemas/index.ts
import { z } from 'zod'
import { process01Schema } from './process-01'
// ... imports through process-16

const SCHEMAS: Record<number, z.ZodTypeAny> = {
  1: process01Schema,
  // ... 2-16
}

export function getProcessSchema(processNumber: number): z.ZodTypeAny | null {
  return SCHEMAS[processNumber] ?? null
}
```

### assembleContext Signature

```typescript
// src/lib/squads/assembler.ts
export type ProcessOutput = {
  processNumber: number
  processName: string
  output: string
}

export type AssembledContext = {
  briefing: string           // JSON.stringify of clients.briefing JSONB
  priorOutputs: ProcessOutput[]
  feedbackContext: string    // always '' in Phase 5; Phase 9 fills this
  truncated: boolean         // true if 32K limit was applied
  totalOutputsAvailable: number
  outputsIncluded: number
}

export async function assembleContext(
  clientId: string,
  processNumber: number
): Promise<AssembledContext>
```

### confirmSquadRun Server Action Return

```typescript
// src/lib/actions/squad.ts
// Returns assembled context and built prompt so caller can show preview BEFORE confirming
export async function assembleSquadContext(
  clientId: string,
  processId: string
): Promise<{ context: AssembledContext; prompt: string } | { error: string }>

// Called when operator clicks "Confirm & Run" in the modal
export async function confirmSquadRun(
  processId: string,
  clientId: string,
  phaseId: string,
  squadType: SquadType,
  cliCommand: string
): Promise<ActionResult>
```

Note: Two separate Server Actions are needed — one to assemble+preview (called on button click), one to commit the INSERT (called on modal confirm). This matches D-10 and D-11.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 4: Worker writes output only | Phase 5: Worker writes output + structured_output | Phase 5 | Worker `close` handler needs one more Supabase column in UPDATE |
| Phase 3: ProcessAccordionRow shows only definition | Phase 5: Shows definition + job state + trigger button | Phase 5 | Component gains `latestJob` and `clientPhaseNumber` props |
| No squad context | Phase 5: Context assembled from prior phase outputs | Phase 5 | `assembleContext()` is the new core engine function |

**Existing behavior preserved:**
- `squad_jobs.output` always written (raw, never loses data)
- `isCliError()` logic unchanged — `structured_output` parsing is additive
- Phase 4 worker core loop unchanged — Phase 5 only extends the `close` handler success branch

---

## Schema Change Detail

### Migration 00007: Add structured_output Column

```sql
-- supabase/migrations/00007_squad_structured_output.sql
-- Phase 5: Add structured output storage to squad_jobs (D-14)
ALTER TABLE squad_jobs
  ADD COLUMN IF NOT EXISTS structured_output JSONB;

-- Index for efficient "find completed jobs with structured output" queries
CREATE INDEX IF NOT EXISTS idx_squad_jobs_structured_output
  ON squad_jobs ((structured_output IS NOT NULL))
  WHERE status = 'completed';
```

The `squadJobSchema` in `src/lib/database/schema.ts` also needs `.extend({ structured_output: z.record(z.string(), z.unknown()).nullable().optional() })` — or direct addition of the field. The schema comment says it mirrors the DB table.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `buildPrompt()` accepts `AssembledContext` + `processNumber` and injects `PROCESS_DEFINITIONS[processNumber]` by importing from `src/lib/pipeline/processes.ts` | Architecture Patterns | Low — if PROCESS_DEFINITIONS can't be imported in non-RSC context, inline the relevant fields |
| A2 | The preview modal assembles context via a Server Action call (`assembleSquadContext`) before displaying; not pre-assembled at page load time | Architecture Patterns | Low — if assembled at page load, it wastes CPU for processes operator may never trigger |
| A3 | `processes.output_json` and `processes.output_markdown` columns (existing in schema) are NOT used for Phase 5 output storage — `squad_jobs.structured_output` is the target | Architecture Patterns | Medium — if the plan uses `processes.output_json`, the worker update target changes; clarify with planner |

---

## Open Questions

1. **Where does output parsing run: worker or post-completion Server Action?**
   - What we know: CONTEXT.md says "Claude's Discretion." Worker already has the raw output in the `close` handler. Server Actions can also read `squad_jobs.output` after completion.
   - What's unclear: Worker requires relative imports and can't call Server Actions. A Server Action triggered by Realtime update is possible but more complex.
   - Recommendation: Parse in the worker `close` handler (simpler, already has the output in memory, no extra round-trip). Create `src/worker/output-parser.ts` with relative import. This is the natural extension of the existing success branch.

2. **Should `processes.output_json` be updated alongside `squad_jobs.structured_output`?**
   - What we know: `processes.output_json JSONB` exists in the schema. `squad_jobs.structured_output` is the new column from D-14.
   - What's unclear: CONTEXT.md only mentions `squad_jobs.structured_output`. The processes table column may be intended for Phase 7 (document management) or Phase 6 (gate review).
   - Recommendation: Phase 5 writes only to `squad_jobs.structured_output`. Leave `processes.output_json` for Phase 6 or 7.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Claude Code CLI | Squad execution | Yes | 2.1.94 | None — required |
| Node.js | Worker runtime | Yes | 20.19.6 | None — required |
| Supabase (cloud) | DB + Realtime | Yes | cloud | None — required |
| All npm packages | Phase 5 features | Yes | (see package.json) | None needed — no new installs |

All Phase 5 dependencies are already present. No new environment setup required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run tests/unit/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SQAD-02 | `assembleContext()` collects briefing + prior outputs + empty feedback slot | unit | `npx vitest run tests/unit/assembler.test.ts -x` | Wave 0 |
| SQAD-02 | Context truncation at 32,000 chars truncates oldest-first | unit | `npx vitest run tests/unit/assembler.test.ts -x` | Wave 0 |
| SQAD-04 | `buildPrompt()` includes squad identity verbatim and process definition fields | unit | `npx vitest run tests/unit/squad-prompts.test.ts -x` | Wave 0 |
| SQAD-05/06 | `parseCliOutput()` extracts `envelope.result` and applies Zod schema | unit | `npx vitest run tests/unit/output-parser.test.ts -x` | Wave 0 |
| SQAD-05/06 | Parse failure leaves `structured_output` null, preserves raw output | unit | `npx vitest run tests/unit/output-parser.test.ts -x` | Wave 0 |
| SQAD-06 | All 16 schemas accept valid input per their output checklist shape | unit | `npx vitest run tests/unit/process-schemas.test.ts -x` | Wave 0 |
| SQAD-01 | `confirmSquadRun` Server Action inserts job with status='queued' | db integration | `npx vitest run tests/db/squad-execution.test.ts -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/unit/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/assembler.test.ts` — covers SQAD-02 (context assembly, truncation)
- [ ] `tests/unit/squad-prompts.test.ts` — covers SQAD-04 (prompt template injection)
- [ ] `tests/unit/output-parser.test.ts` — covers SQAD-05/06 (two-level JSON parse + fallback)
- [ ] `tests/unit/process-schemas.test.ts` — covers SQAD-06 (all 16 schemas accept valid shapes)
- [ ] `tests/db/squad-execution.test.ts` — covers SQAD-01 (Server Action INSERT integration)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `createClient().auth.getUser()` check at top of every Server Action — already enforced in `clients.ts` and `gates.ts` patterns |
| V3 Session Management | no | Handled by Supabase Auth middleware (Phase 1) |
| V4 Access Control | yes | Auth check + admin client for DB write; no cross-client data leakage in assembler query |
| V5 Input Validation | yes | Zod schema on all Server Action inputs (processId, clientId, phaseId must be UUIDs) |
| V6 Cryptography | no | No new crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via client briefing | Tampering | Briefing is text content passed as part of the prompt string; no shell execution of briefing text. Spawn uses array args (no shell). Validated. |
| CLI command injection via cliCommand field | Tampering | Worker uses `spawn('claude', args, { stdio: ... })` — NOT shell:true. Array args cannot inject shell commands. Existing mitigation in Phase 4 is sufficient. [CITED: src/worker/job-runner.ts T-04-01 note] |
| Cross-client context leakage | Info Disclosure | `assembleContext()` always queries `WHERE client_id = $1`. Assembler must never use an unscoped query. Validate in Server Action that the authenticated user owns the client (or is the solo operator). |
| Malformed Zod schema crashing worker | Denial of Service | `safeParse` never throws. Parse failures are caught and logged. Worker continues. Already the design intent. |
| Storing unvalidated CLI output in JSONB | Tampering | `structured_output` is only written on successful `safeParse()`. Raw output in `squad_jobs.output` is TEXT (not executable). |

---

## Sources

### Primary (HIGH confidence)
- `src/worker/job-runner.ts` — worker spawn pattern, `isCliError()`, close handler structure
- `src/lib/actions/gates.ts` — Server Action pattern for INSERT/update
- `src/lib/database/schema.ts` — Zod v3-compatible patterns, SquadJob schema
- `src/lib/database/enums.ts` — PROCESS_TO_SQUAD, SQUAD_TYPES, JOB_STATUSES
- `src/lib/pipeline/processes.ts` — PROCESS_DEFINITIONS (all 16 processes)
- `docs/agency-os-prompt.md` — Squad identities, process output checklists
- `supabase/migrations/00001_initial_schema.sql` — squad_jobs table structure
- `vitest.config.ts` + `package.json` — test infrastructure and installed versions
- Live CLI test: `echo "..." | claude --print --output-format json` — confirmed two-level JSON structure
- Live CLI test: `claude --help` — confirmed --print, --output-format, -p flags
- Live CLI: `claude --version` → 2.1.94

### Secondary (MEDIUM confidence)
- CONTEXT.md D-01 through D-16 — user-locked implementation decisions
- Existing component tree (`pipeline-accordion.tsx`, `pipeline-phase.tsx`, `process-row.tsx`) — extension points verified by reading source

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against installed package.json
- CLI flags: HIGH — verified via `claude --help` and live invocation
- Architecture: HIGH — derived from reading actual codebase, not assumptions
- Output parsing: HIGH — verified two-level JSON structure via live test
- Zod schemas: HIGH — 16 schemas derivable mechanically from `docs/agency-os-prompt.md` output checklists
- Pitfalls: HIGH — verified from codebase (import paths, migration numbers, schema version)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable stack; re-verify only if Claude CLI version changes significantly)
