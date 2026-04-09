---
phase: 06-quality-gates
created: 2026-04-09
status: ready-for-planning
---

# Phase 6: Quality Gates — Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Build the AI pre-review system for quality gates: 4 gate-specific checklists derived from
`docs/agency-os-prompt.md`, a Claude CLI adversarial reviewer that evaluates squad outputs
against those checklists, structured verdict storage with evidence citations, and operator
review UI with annotated approval/rejection.

**In scope:**
- 4 gate checklist definitions (static TypeScript, derived from agency-os-prompt.md)
- AI pre-review trigger (automatic when all phase processes reach `completed`)
- Adversarial prompt template (reviewer role distinct from generator squad role)
- Structured verdict schema: pass/fail per checklist item + evidence citations
- Gate review UI: operator sees AI verdict, evidence, makes final approve/reject
- Operator annotation on rejection: tag which specific items failed with notes
- Integration with existing gate infrastructure (approve_gate/reject_gate RPCs, GateSection)

**Out of scope:**
- Modifying the gate approve/reject RPCs (Phase 3) — they already work
- Custom checklists per client (v2)
- Multiple review rounds before operator decision (v2)
- Dashboard integration (Phase 8)
- Cost tracking for review CLI calls (v2 COST-01)

</domain>

<decisions>
## Implementation Decisions

### Gate Checklists

- **D-01:** 4 static TypeScript checklist files in `src/lib/gates/`:
  - `gate-1-checklist.ts` — "Alvo Validado?" (5 items from QUALITY GATE 1)
  - `gate-2-checklist.ts` — "Oferta + Marca OK?" (6 items from QUALITY GATE 2)
  - `gate-3-checklist.ts` — "Plano Tatico Validado?" (6 items from QUALITY GATE 3)
  - `gate-4-checklist.ts` — "Meta de Tracao Atingida?" (6 items from QUALITY GATE 4)
  Each exports `{ gateNumber, gateName, items: Array<{ id, label, description }> }`.
  Items are taken verbatim from `docs/agency-os-prompt.md` checklist sections.

- **D-02:** Checklists are visible to operator in the gate section even before AI review runs.
  GateSection shows the checklist items with pending status when gate is in `pending` state.

### AI Pre-Review Trigger

- **D-03:** AI review is triggered automatically when the operator clicks a "Run Gate Review"
  button in the gate section. The review is NOT auto-triggered when processes complete — the
  operator decides when to run the review. This keeps the operator in control and avoids
  running expensive CLI calls for incomplete work.

- **D-04:** "Run Gate Review" button appears when gate status is `pending` AND all processes
  in that phase have `status = 'completed'`. If any process is still active/pending, button
  shows a tooltip: "Complete all processes before running gate review."

### Adversarial Prompting

- **D-05:** The adversarial review prompt uses a distinct Claude persona:
  "You are an independent quality auditor evaluating marketing deliverables. Your role is to
  critically assess outputs — look for gaps, unsupported claims, missing elements, and weak
  evidence. You are NOT the team that created these outputs. Be constructively critical."

- **D-06:** The review prompt structure:
  ```
  [Adversarial Auditor Identity — D-05]
  [Gate checklist items — all items for this gate number]
  [Phase outputs — all completed squad_jobs.output for processes in this phase]
  [Instructions: For each checklist item, provide PASS/FAIL + evidence citation from outputs]
  [Output Format: JSON matching GateReviewVerdictSchema]
  ```

- **D-07:** CLI invocation same pattern as squad execution (Phase 5):
  `claude --print --output-format json -p "{reviewPrompt}"`
  The review job is a `squad_jobs` row with a special squad type = `'gate_review'`.

### Verdict Schema & Storage

- **D-08:** New `gate_reviews` table in Supabase (new migration):
  ```sql
  CREATE TABLE gate_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_id UUID NOT NULL REFERENCES quality_gates(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    verdict JSONB NOT NULL, -- GateReviewVerdictSchema
    raw_output TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

- **D-09:** `GateReviewVerdictSchema` (Zod):
  ```typescript
  {
    gate_number: number,
    overall: 'pass' | 'fail' | 'partial',
    items: Array<{
      checklist_id: string,
      label: string,
      verdict: 'pass' | 'fail',
      evidence: string, // quote or reference from actual output
      notes: string // auditor explanation
    }>,
    summary: string // overall assessment
  }
  ```

- **D-10:** Same two-level parsing as Phase 5 output parser. Use `parseCliOutput` from
  `src/worker/output-parser.ts` for the CLI envelope, then safeParse with the verdict schema.
  On parse failure, store raw output and show it to operator as fallback.

### Operator Review UI

- **D-11:** After AI review completes, the gate section expands to show:
  - Checklist items with PASS (green) / FAIL (red) badges
  - Evidence citation for each item (collapsible detail)
  - Overall verdict badge (PASS / FAIL / PARTIAL)
  - Summary text from the AI review
  - "View Raw" toggle for the unprocessed CLI output

- **D-12:** Operator approve button is always available (AI review is advisory, not blocking).
  Operator can approve even if AI says FAIL. The approve/reject actions use existing
  `approveGateAction` / `rejectGateAction` from `src/lib/actions/gates.ts`.

- **D-13:** On rejection, the existing reject dialog (selects failed processes + notes) is
  enhanced with the AI review: checklist items that failed are pre-selected as suggestions
  for which processes to rework. Operator can override by selecting/deselecting.

### Claude's Discretion

- Exact adversarial prompt wording and persona details
- Whether gate review runs as a squad_job or in a separate table
- UI layout of the verdict display (card vs inline vs expandable)
- Whether to show a summary diff between previous and current review (if re-review)
- Exact evidence citation format (direct quote vs section reference)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Agency OS Methodology
- `docs/agency-os-prompt.md` — All 4 quality gate checklists verbatim (lines 93-376).
  Gate review prompts MUST use these exact checklist items.

### Phase 3 Outputs (Gate Infrastructure)
- `src/lib/actions/gates.ts` — `approveGateAction()`, `rejectGateAction()` Server Actions
- `src/components/clients/gate-section.tsx` — GateSection component (approve/reject UI)
- `src/lib/database/schema.ts` — `quality_gates` table structure
- `supabase/migrations/00001_initial_schema.sql` — `approve_gate`, `reject_gate` RPCs

### Phase 5 Outputs (Squad Execution)
- `src/worker/output-parser.ts` — `parseCliOutput()` for CLI envelope deserialization
- `src/lib/squads/schemas/index.ts` — Pattern for Zod schema dispatching
- `src/lib/actions/squad.ts` — Pattern for Server Actions with CLI job creation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseCliOutput()` in output-parser.ts — reuse for gate review CLI parsing
- `GateSection` component — extend with AI review display, don't replace
- `approveGateAction` / `rejectGateAction` — keep as-is, gate review is pre-step
- `getProcessSchema()` pattern — replicate for `getGateChecklist(gateNumber)`
- Phase 5 `confirmSquadRun` Server Action — pattern for gate review job creation

### New Files Needed
- `src/lib/gates/gate-1-checklist.ts` through `gate-4-checklist.ts`
- `src/lib/gates/index.ts` — `getGateChecklist(gateNumber)` dispatcher
- `src/lib/gates/review-prompt.ts` — `buildReviewPrompt()` for adversarial reviewer
- `src/lib/gates/review-schema.ts` — `GateReviewVerdictSchema` Zod schema
- `src/lib/actions/gate-review.ts` — Server Action: `runGateReview(gateId, clientId)`
- `src/components/clients/gate-review-display.tsx` — AI verdict display component
- `supabase/migrations/00008_gate_reviews.sql` — gate_reviews table

### Integration Points
- GateSection → "Run Gate Review" button → runGateReview Server Action
  → squad_jobs INSERT (type='gate_review') → worker runs → parses verdict
  → gate_reviews table → GateSection re-renders with verdict display
  → Operator approves/rejects using existing actions

</code_context>

<specifics>
## Specific Ideas

- Adversarial prompt must use a DIFFERENT persona than the squad that generated outputs.
  Squad Estrategia generates; the reviewer audits. This prevents rubber-stamp approvals.
- Evidence citations should quote actual text from squad outputs so operator can verify.
- Gate review job reuses the Phase 4 worker infrastructure — just a different prompt type.
- Pre-selecting failed items in the reject dialog reduces operator work on rejections.

</specifics>

<deferred>
## Deferred Ideas

- Re-review capability (run review again after rework) — v1.1
- Custom checklist items per client — v2
- Comparison view between reviews (before/after rework) — v2
- Automatic gate approval for all-pass reviews (operator bypass) — v2
- Cost tracking for review CLI calls — v2 (COST-01)

</deferred>

---

*Phase: 06-quality-gates*
*Context gathered: 2026-04-09 via autonomous smart discuss*
