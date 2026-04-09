---
phase: 05-squad-execution-context
created: 2026-04-09
status: ready-for-planning
---

# Phase 5: Squad Execution & Context — Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the squad trigger UI, context assembly engine, prompt preview flow, and structured
output parsing/storage. This phase closes the "operator clicks button → Claude runs → output
stored" loop.

**In scope:**
- "Run Squad" button on process rows (trigger UI)
- Context assembler (client briefing + prior phase outputs)
- Prompt preview modal (read-only, operator confirms before run)
- Prompt templates per squad (4 static TypeScript files)
- Output parser with per-process Zod schemas (16 schemas, raw fallback)
- Output display inline in process row expansion (latest run)

**Out of scope:**
- Quality gate AI pre-review (Phase 6)
- Document PDF export (Phase 7)
- Kanban dashboard (Phase 8)
- Feedback loop data injection (Phase 9 — assembler reserves a slot but leaves it empty)
- Re-run completed processes (deferred v1.1)
- Prompt editing before trigger (deferred v2)

</domain>

<decisions>
## Implementation Decisions

### Squad Trigger Button

- **D-01:** "Run Squad" button appears on process rows where `process.status IN ('active', 'pending')`
  AND the process belongs to the client's currently active phase. Completed processes show
  `[View Output]` only — no re-run button in Phase 5.

- **D-02:** Button label: `▶ Run Squad`. Squad is auto-selected from `PROCESS_TO_SQUAD` mapping
  in `src/lib/database/enums.ts` — operator never chooses the squad manually. Tooltip shows
  the squad name (e.g., "Run Squad Estrategia").

- **D-03:** While a job is running for a process, the row shows Phase 4's `[running]` badge
  and `[View Progress ►]` button. "Run Squad" is hidden while a job is in-flight — prevents
  duplicate job creation.

### Context Assembly

- **D-04:** Context assembler collects three things:
  1. **Client briefing** (`clients.briefing`) — always included
  2. **Prior phase outputs** — all `squad_jobs.output` where `status='completed'` and the
     process belongs to a phase with number < current client phase number, ordered by
     phase then process number
  3. **Feedback loop slot** — empty string placeholder; Phase 9 fills it

  Same-phase prior process outputs are excluded to avoid noise from partially-complete phases.

- **D-05:** Context assembly is a server-side pure function:
  `assembleContext(clientId: string, processNumber: number): Promise<AssembledContext>`
  Returns `{ briefing: string, priorOutputs: ProcessOutput[], feedbackContext: string }`.
  Lives in `src/lib/squads/assembler.ts`.

- **D-06:** If total assembled context exceeds **32,000 characters**, prior phase outputs are
  truncated oldest-first (keep most recent phases). Preview modal shows a yellow warning banner:
  "Context was truncated. Showing N of M prior outputs."

### Prompt Templates

- **D-07:** Four static TypeScript template files in `src/lib/squads/`:
  - `estrategia.ts` — Phases 1-2 (processes 1-8)
  - `planejamento.ts` — Phase 3 (processes 9-11)
  - `growth.ts` — Phase 4 (processes 12-14)
  - `crm.ts` — Phase 5 (processes 15-16)

  Each exports `buildPrompt(context: AssembledContext, processNumber: number): string`.
  Consistent with PROCESS_DEFINITIONS pattern from Phase 3.

- **D-08:** Prompt structure (all squads follow this shape):
  ```
  [Squad Identity + Role — from docs/agency-os-prompt.md verbatim]
  [Agency OS Methodology Brief]
  [Client Context]
    - Briefing: {briefing}
    - Prior Phase Outputs: {priorOutputs joined by \n---\n}
  [Process Instructions]
    - Process: {processName}
    - Required Inputs: {from PROCESS_DEFINITIONS}
    - Execution Steps: {from PROCESS_DEFINITIONS}
    - Output Checklist: {from PROCESS_DEFINITIONS}
  [Output Format — structured JSON matching the process schema]
  ```

  Squad identity sections must be taken verbatim from `docs/agency-os-prompt.md` so Claude
  runs in full squad mode.

- **D-09:** CLI invocation (worker executes this):
  `claude --print --output-format json -p "{assembledPrompt}"`
  The full assembled prompt is stored in `squad_jobs.cli_command` — visible for debugging.
  Phase 5 writes the INSERT to `squad_jobs`; Phase 4 worker runs it unchanged.

### Prompt Preview Modal

- **D-10:** "Run Squad" click → opens **read-only modal** before creating the job:
  - Squad name and process name
  - Context summary: briefing truncated to 300 chars, prior outputs listed by process name only
  - Full prompt text in a scrollable `<pre>` block
  - Yellow warning banner if 32K truncation was applied
  - "Confirm & Run" button + "Cancel" button

- **D-11:** "Confirm & Run" is a Server Action that INSERTs into `squad_jobs` with
  `status='queued'` and the assembled CLI command string. Worker picks it up via Realtime.
  "Cancel" closes the modal with no side effects.

### Output Parsing

- **D-12:** 16 Zod schemas in `src/lib/squads/schemas/`:
  `process-01.ts` through `process-16.ts`. Schema structure derived from each process's
  output checklist in `docs/agency-os-prompt.md`. Planner may share a base Zod type where
  schemas have identical structure.

- **D-13:** Parse flow (runs in worker after CLI process completes):
  1. Worker writes raw CLI output to `squad_jobs.output`
  2. Worker attempts `processSchema.safeParse(JSON.parse(output))`
  3. Parse success → write to `squad_jobs.structured_output` (new JSONB column)
  4. Parse failure → log to `squad_jobs.error_log`, leave `structured_output` null
  5. Raw output ALWAYS preserved in `squad_jobs.output` regardless of parse result

- **D-14:** DB schema change: add `structured_output JSONB` column to `squad_jobs`.
  New migration file required.

### Output Display on Profile

- **D-15:** After job completes, the process row expansion in the accordion shows:
  - `structured_output` present → rendered structured view (process-type-appropriate:
    bullet insights, summary text, recommendation cards — planner's discretion on rendering)
  - `structured_output` null → raw output in scrollable `<pre>` block
  - "View Raw" toggle always available to show unprocessed CLI text

- **D-16:** Multiple runs: show **latest completed run** by default. Run history deferred to
  Phase 7 (document management). Phase 5 only needs to surface the most recent output.

### Claude's Discretion

- Exact Zod schema structure per process — planner designs from `docs/agency-os-prompt.md`
  output checklists; no user preference locked
- Whether output parsing runs in worker vs. post-completion Server Action
- Whether `buildPrompt()` imports from PROCESS_DEFINITIONS or reads relevant fields inline
- Exact truncation behavior (character count vs token estimate)
- Structured output rendering approach per process type

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Agency OS Methodology
- `docs/agency-os-prompt.md` — Squad roles, all 16 process definitions, output checklists.
  Squad prompt templates MUST open with the squad identity verbatim from this document.

### Phase 3 Outputs
- `src/lib/pipeline/processes.ts` — PROCESS_DEFINITIONS (inputs, steps, output checklists)
  for all 16 processes — feed directly into prompt template injection
- `src/lib/database/enums.ts` — `PROCESS_TO_SQUAD` (auto-squad selection), `SQUAD_TYPES`
- Accordion component in `src/components/pipeline/` — Phase 5 extends these process rows

### Phase 4 Outputs
- `src/worker/index.ts` — Worker entry point; Phase 5 adds post-completion parse step here
- `.planning/phases/04-cli-orchestrator-job-queue/04-CONTEXT.md` — Worker architecture,
  spawn pattern, progress modal. Phase 5 writes to this queue, doesn't change the worker core.

### Database
- `supabase/migrations/00001_initial_schema.sql` — `squad_jobs` table. Phase 5 adds
  `structured_output JSONB` via new migration.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PROCESS_TO_SQUAD` in enums.ts — maps process number → squad (no UI squad selection needed)
- `PROCESS_DEFINITIONS` in processes.ts — inject directly into prompt templates
- Phase 4 worker: handles spawn + progress streaming. Phase 5 just INSERTs the job.
- Phase 3 accordion process rows: Phase 5 adds trigger button + output display to existing rows.
- `claim_next_job()` RPC: Phase 5 writes INSERT; worker claims it atomically.

### New Files Needed
- `src/lib/squads/assembler.ts` — `assembleContext()` function
- `src/lib/squads/estrategia.ts` — Squad Estrategia prompt template
- `src/lib/squads/planejamento.ts` — Squad Planejamento prompt template
- `src/lib/squads/growth.ts` — Squad Growth prompt template
- `src/lib/squads/crm.ts` — Squad CRM prompt template
- `src/lib/squads/schemas/process-01.ts` ... `process-16.ts` — Per-process Zod schemas
- `src/components/squad/PromptPreviewModal.tsx` — Read-only preview modal
- `src/components/squad/RunSquadButton.tsx` — Trigger button component
- `src/app/actions/squad.ts` — Server Action: `confirmSquadRun(processId, clientId)`
- `supabase/migrations/00005_squad_structured_output.sql` — Adds `structured_output JSONB`

### Integration Points
- Process row → RunSquadButton → assembleContext() → PromptPreviewModal
  → confirmSquadRun() Server Action → squad_jobs INSERT → worker picks up
  → stores output + parse → page revalidates → process row shows output
- Output query: `squad_jobs WHERE process_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1`

</code_context>

<specifics>
## Specific Ideas

- Squad prompt templates must open with the Agency OS squad identity from `docs/agency-os-prompt.md`
  so Claude runs in full squad mode, not as a generic assistant.
- `--print` flag outputs to stdout on CLI completion; `--output-format json` wraps the final
  response. Worker already captures stdout via Phase 4 progress batching.
- "Confirm & Run" follows the same Server Action + revalidatePath pattern as Phase 2/3
  approve/reject gate actions.
- Truncation warning in preview modal: yellow banner — "Context was truncated. Showing N of M
  prior outputs (oldest removed)."

</specifics>

<deferred>
## Deferred Ideas

- Prompt editing in preview modal — v2 (adds prompt versioning complexity)
- Re-run a completed process — v1.1 (Phase 5 focuses on forward flow only)
- Run history side sheet — Phase 7 (document management) may pick this up
- Per-process token budget alerts (COST-01-03) — v2 requirements
- Feedback loop context injection — Phase 9 fills the reserved assembler slot

</deferred>

---

*Phase: 05-squad-execution-context*
*Context gathered: 2026-04-09*
