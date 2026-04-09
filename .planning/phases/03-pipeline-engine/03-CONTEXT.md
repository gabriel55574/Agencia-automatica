---
phase: 03-pipeline-engine
created: 2026-04-08
status: complete
---

# Phase 3: Pipeline Engine — Context

## Phase Goal

Each client has an independent pipeline with gate-controlled phase transitions, process-level rework routing, race condition protection, and fully defined process inputs/outputs.

## Canonical Refs

- `docs/agency-os-prompt.md` — Source of truth for all 16 process definitions (names, inputs, execution steps, output checklists, quality gate checklists). **Researcher and planner must read this file.** Sub-processes (3.1, 3.2, 4.1, 7.1, 13.1, 13.2, 14.1, 14.2) are execution steps within main processes, not separate DB rows.
- `supabase/migrations/00001_initial_schema.sql` — Full schema: processes table has `process_number 1-16`, `status IN ('pending','active','completed','failed')`
- `supabase/migrations/00002_phase_enforcement.sql` — Phase sequence trigger (already enforces phase N requires N-1 complete)
- `src/lib/database/enums.ts` — PROCESS_TO_PHASE and PROCESS_TO_SQUAD mappings for all 16 processes
- `.planning/phases/02-client-management/02-CONTEXT.md` — Prior decisions (single scrollable profile, cards layout, pipeline timeline already in profile)

---

## Decisions Locked

### Pipeline Section on Client Profile — Expandable Accordion

The Phase 2 profile already has a basic 5-phase timeline. Phase 3 replaces/extends it with an expandable accordion:

- Each phase row is clickable — click to expand/collapse its processes
- **Active phase auto-expands** on page load
- Collapsed by default for non-active phases
- Per-process row shows: **process name + status badge** only (pending / active / completed / failed / needs rework)
- Clicking a process row **expands inline** with definition details: process name, responsible squad, required inputs, expected outputs, output checklist
- No navigation away from profile — all detail stays on the same scrollable page

**Why accordion:** Keeps the page clean for an operator scanning 15+ clients. Active phase is immediately visible without clicking.

**Implication for planner:** The Phase 2 pipeline timeline component needs to be replaced or significantly extended. This is a React client component (expandable state). Process definition data comes from the static TypeScript config, not the DB — no API call needed for the definition panel.

---

### Gate Advancement Flow — Manual Gate in Active Phase Section

**Phase 3 builds the complete gate UI shell.** Phase 6 adds AI pre-review content above the same buttons.

Gate controls live **inside the active phase section**, below the process list:

```
Phase 1 — Diagnostico [ACTIVE] ▼
  ├─ Process 1: Pesquisa de Mercado   [completed]
  └─ Process 2: Segmentacao           [completed]

Gate 1 — [PENDING]
  [Approve Gate]  [Reject Gate]
```

**Approve Gate flow:**
- Button appears when gate status is `pending` or `rejected`
- Clicking opens confirmation dialog: "Approve Gate 1? This will advance [Client Name] to Phase 2."
- On confirm: gate.status → `approved`, gate.operator_decision → `approved`, phase transitions to `completed`, next phase activates
- Race condition protection: DB-level phase enforcement trigger already prevents concurrent activation

**Reject Gate flow:**
- Clicking "Reject Gate" opens a dialog with:
  - Checkboxes for each process in the phase (multi-select)
  - "Which process(es) need revision?" — operator selects 1 or more
  - Optional free-text notes field
  - "Confirm Rejection" button
- On confirm: gate.status → `rejected`, gate.operator_decision → `rejected`, gate.operator_notes stores the text, selected process(es).status → `failed`
- Phase remains `active` — it does NOT regress

**Why manual gate in Phase 3:** Phase 6 adds AI checklist review above these buttons. Phase 3 builds the structural container. Same UX, same buttons — Phase 6 just adds content above them.

**Implication for planner:** Server Actions needed for `approveGate(gateId)` and `rejectGate(gateId, failedProcessIds[], notes)`. Both must use row-level locking to prevent race conditions (SELECT FOR UPDATE on the gate row before updating).

---

### Process Definitions Source — Static TypeScript Config

All 16 process definitions (names, squad assignment, required inputs, execution steps, output checklists) live in a **single static TypeScript file**: `src/lib/pipeline/processes.ts`.

**Structure:**
```typescript
// src/lib/pipeline/processes.ts
export const PROCESS_DEFINITIONS: Record<number, ProcessDefinition> = {
  1: {
    name: 'Pesquisa de Mercado e Insights',
    phase: 1,
    squad: 'estrategia',
    inputs: ['briefing.niche', 'briefing.target_audience'],
    steps: ['Definir problema de marketing...', ...],
    checklist: ['Problema/oportunidade claramente definido', ...]
  },
  // ... 2-16
}
```

**Source for content:** `docs/agency-os-prompt.md` contains all inputs, execution steps, and output checklists for all 16 processes (plus sub-processes as steps). The researcher should read this file and produce the complete `processes.ts` content.

**Sub-processes mapping:**
- 3.1 (Vaca Roxa), 3.2 (StoryBrand) → steps within Process 3
- 4.1 (Cagan Validation) → steps within Process 4
- 7.1 (Content Strategy) → steps within Process 7
- 13.1 (Email Nurturing/Chaperon), 13.2 (Dream 100) → steps within Process 13
- 14.1 (Growth Hacking Loop), 14.2 (CRO) → steps within Process 14

**No DB queries for definitions** — only DB rows for per-client process instance state (status, started_at, completed_at, etc.).

---

### Process Row Initialization — At Client Creation

All 16 process rows are created when a new client is created.

The `create_client_with_phases` RPC (Phase 2) must be **extended** in Phase 3 to also insert 16 process rows across the 5 phase rows. All process rows start with `status: 'pending'`.

**Mapping (from enums.ts `PROCESS_TO_PHASE`):**
- Phase 1: processes 1-2
- Phase 2: processes 3-6
- Phase 3: processes 7-11
- Phase 4: processes 12-15
- Phase 5: process 16

Process rows need: `process_number`, `name` (from PROCESS_DEFINITIONS), `squad` (from PROCESS_TO_SQUAD), `phase_id` (FK to correct phase row), `client_id`, `status: 'pending'`.

**Implication for planner:** This requires a DB migration or update to the existing RPC, plus updating the Server Action that calls it. Alternatively, a new migration adding a helper function `initialize_client_processes(client_id)` called after client creation.

---

### Rework Routing Display — Badge on Failed Process

When a gate is rejected and processes are marked `failed`:

- The process status badge changes to **`needs rework`** (maps to `status: 'failed'` in DB)
- Badge is visually distinct (red/destructive color, not just grey "failed")
- The active phase auto-expands (already the default behavior) so the operator sees the failed process immediately on page load
- No separate "rework view" — the profile page IS the rework view

**DB state after rejection:**
- `quality_gates.status` → `rejected`
- `quality_gates.operator_decision` → `rejected`
- `quality_gates.operator_notes` → operator's text notes
- `processes.status` → `failed` for each selected process
- Phase status remains `active` — no regression

**Gate re-approval flow:** After operator addresses the rework, they can re-click "Approve Gate" (gate is still visible in rejected state). The gate can transition: `rejected` → `approved`.

**Implication for planner:** The badge display needs to handle both `failed` (gate-rejected rework) and eventual `completed` state. The gate section always shows even after rejection — it's not hidden until approved.

---

### Race Condition Protection — Already in DB

`claim_next_job()` function (migration 00002) uses `FOR UPDATE SKIP LOCKED` for job queue.

Phase transition race conditions are handled by the phase enforcement trigger (migration 00002) — attempting to activate phase N while N-1 is not completed raises a PostgreSQL exception.

For gate approval Server Actions: use Supabase admin client with a transaction to SELECT FOR UPDATE the gate row before updating. This prevents two simultaneous approval clicks from double-processing.

**No additional DB work needed for race conditions** — enforcement is already at the DB level.

---

## Routes Added in Phase 3

Phase 2 established `/clients`, `/clients/new`, `/clients/[id]`, `/clients/[id]/edit`.

Phase 3 adds no new routes. All pipeline interactions happen on the existing `/clients/[id]` profile page via:
- Expanding the pipeline accordion (client-side state, no route change)
- Approve/Reject gate (Server Actions, no route change)
- Viewing process definitions (inline expansion, no route change)

---

## Out of Scope for This Phase

- AI gate pre-review and structured checklists (Phase 6)
- Squad execution trigger (Phase 5)
- Real output display in process rows (Phase 7)
- XState integration — pipeline state machine lives in DB for now (may be revisited in Phase 5)
- Job queue worker (Phase 4)

---

## Requirements Covered

| Requirement | Decision |
|-------------|----------|
| PIPE-01 | Independent pipeline state per client — display via accordion on profile |
| PIPE-02 | Gate-controlled transition — Approve Gate button guarded by gate.status |
| PIPE-03 | Rework routing to specific process — reject dialog with process selector, process.status → failed |
| PIPE-04 | Race condition protection — SELECT FOR UPDATE in Server Actions + existing DB trigger |
| PIPE-05 | 16 process definitions viewable — static config + inline expansion in accordion |
