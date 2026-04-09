---
phase: 09-feedback-loop
created: 2026-04-09
status: ready-for-planning
---

# Phase 9: Feedback Loop — Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Close the learning loop: fill the reserved `feedbackContext` slot in the Phase 5 context
assembler with Phase 5 (Retencao) outputs, surface specific retention insights during
Phase 1 re-execution, and track feedback loop cycles per client.

**In scope:**
- Fill `feedbackContext` in `assembleContext()` with Phase 5 squad outputs
- Extract and highlight NPS, churn, CLV data from Phase 5 structured outputs
- Track loop cycle number per client (`loop_cycle` column on clients table)
- Display loop cycle on client profile page
- Auto-increment loop cycle when client pipeline resets to Phase 1
- Feedback context included in prompt preview modal

**Out of scope:**
- Automated pipeline restart (operator manually triggers re-run)
- Cross-client learning (insights from client A inform client B)
- Historical trend analysis across cycles (v2)
- Custom feedback data extraction rules (v2)

</domain>

<decisions>
## Implementation Decisions

### Feedback Context Assembly

- **D-01:** The `assembleContext()` function in `src/lib/squads/assembler.ts` already has
  a `feedbackContext: string` placeholder that returns empty string. Phase 9 fills this
  with Phase 5 outputs when the client is on cycle 2+.

- **D-02:** Feedback context query: `squad_jobs WHERE client_id = ? AND process_id IN
  (processes belonging to phase 5) AND status = 'completed'` from the PREVIOUS cycle.
  Use `clients.loop_cycle` to determine which cycle's outputs to fetch.

- **D-03:** Feedback context format in the prompt:
  ```
  [FEEDBACK FROM PREVIOUS CYCLE]
  Cycle: {N-1}
  
  NPS Insights: {extracted from process 16 output}
  Churn Patterns: {extracted from process 16 output}
  CLV Metrics: {extracted from process 16 output}
  
  Full Retention Outputs:
  {raw Phase 5 outputs from previous cycle}
  ```

### Insight Extraction

- **D-04:** Extract NPS, churn, and CLV data from `structured_output` of process 16
  (CRM, Lealdade e CLV). Use the process-16 Zod schema fields directly — no new
  extraction logic needed if the schema has these fields.

- **D-05:** If `structured_output` is null (parse failed), fall back to including the
  raw `output` text with a note: "Structured extraction unavailable — raw output included."

### Loop Cycle Tracking

- **D-06:** New migration: `ALTER TABLE clients ADD COLUMN loop_cycle INTEGER NOT NULL DEFAULT 1`.
  Tracks which iteration of the pipeline the client is on.

- **D-07:** When operator approves the final gate (Gate 4) and the client completes
  Phase 5, the system does NOT auto-restart. To start a new cycle, the operator uses
  the existing pipeline reset mechanism. On reset, `loop_cycle` increments by 1.

- **D-08:** Add a "Reset Pipeline (New Cycle)" button on the client profile page.
  This creates a new Server Action that:
  1. Increments `clients.loop_cycle`
  2. Resets `clients.current_phase_number` to 1
  3. Creates new phase/process/gate rows for the new cycle
  4. Preserves all previous cycle data (squad_jobs, gate_reviews remain)

### Client Profile Display

- **D-09:** Client profile shows "Cycle {N}" badge next to the client name.
  Cycle 1 = first pass (no badge or "Cycle 1" subtle). Cycle 2+ = prominent badge.

- **D-10:** When on cycle 2+, the feedback section in prompt preview modal shows
  the extracted insights with a "From Cycle {N-1}" label.

### Claude's Discretion

- Exact formatting of feedback context in the prompt
- Whether to show a summary or full Phase 5 outputs in feedback
- Pipeline reset confirmation dialog UX
- Whether loop_cycle is shown as a badge or inline text

</decisions>

<canonical_refs>
## Canonical References

### Phase 5 Outputs
- `src/lib/squads/assembler.ts` — `assembleContext()` with feedbackContext slot
- `src/lib/squads/schemas/process-16.ts` — Process 16 Zod schema (CLV, NPS fields)
- `src/components/squad/PromptPreviewModal.tsx` — Shows assembled prompt including feedback

### Phase 3 Outputs
- `src/lib/actions/gates.ts` — Gate approval actions (triggers for cycle completion)
- `supabase/migrations/00001_initial_schema.sql` — clients, phases, processes tables

### Database
- `src/lib/database/types.ts` — Client type (needs loop_cycle field)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `assembleContext()` — already structured with feedbackContext slot
- Process 16 schema — may already have CLV/NPS fields
- Client profile page — add cycle badge and reset button
- Server Action pattern from phases 2-6

### New Files Needed
- `supabase/migrations/00009_feedback_loop.sql` — loop_cycle column
- `src/lib/squads/feedback.ts` — `extractFeedbackContext(clientId)` function
- `src/lib/actions/pipeline-reset.ts` — `resetPipelineAction()` Server Action
- `src/components/clients/CycleBadge.tsx` — Loop cycle display component

</code_context>

<specifics>
## Specific Ideas

- The feedback loop is what makes Agency OS a learning system, not just a pipeline runner
- Phase 5's process 16 (CRM, Lealdade e CLV) is the primary source of feedback data
- Previous cycle outputs should be preserved — never deleted on pipeline reset
- The assembler's empty feedbackContext slot was designed for exactly this purpose

</specifics>

<deferred>
## Deferred Ideas

- Cross-client learning (aggregate insights across clients) — v2
- Automated pipeline restart after Phase 5 completion — v2
- Cycle comparison dashboard (how did KPIs change across cycles) — v2
- Custom feedback extraction rules per client — v2

</deferred>

---

*Phase: 09-feedback-loop*
*Context gathered: 2026-04-09 via autonomous smart discuss*
