---
phase: 02-client-management
created: 2026-04-08
status: complete
---

# Phase 2: Client Management — Context

## Phase Goal

Operator can onboard new clients, view their full context, edit their information, and archive inactive clients.

## Decisions Locked

### Briefing Format — Hybrid

Core structured fields + free-text overflow:

| Field | Type | Required |
|-------|------|----------|
| Name | text | yes |
| Company | text | yes |
| Niche | text | yes |
| Target Audience | text | yes |
| Additional Context | textarea (markdown) | no |

**Why hybrid:** Structured fields feed directly into squad prompt assembly (Phase 5) without parsing. Free text handles everything else the operator wants to capture that doesn't fit a category.

**Implication for planner:** `briefing` column in DB stores this as JSON with keys: `niche`, `target_audience`, `additional_context`. The intake form maps to these keys. Zod schema validates shape at API boundary.

---

### Client List View — Cards

Card grid layout. Each card shows:
- Client name
- Company
- Current phase (number + name, e.g., "Phase 1 — Diagnostico")
- Status badge (Active / Archived)
- Last activity (relative time, e.g., "5h ago")

Active clients shown by default. Archived clients hidden.

**Show archived toggle** at top of list reveals archived clients (greyed out appearance). Archived clients are restorable from UI.

**Why cards:** Operator preference. More visual than a table for this use case.

---

### Profile Page — Single Scrollable Page

All client information on one page. No tabs. Structure:

1. **Header** — Client name, company, status badge, [Edit] and [Archive] action buttons
2. **Briefing section** — Shows structured fields + additional context in read mode. Inline edit on click or via dedicated Edit button.
3. **Pipeline timeline** — All 5 phases listed with current status (ACTIVE, PENDING, COMPLETED). Shows started_at / completed_at where available. Phase 2 onwards are PENDING at intake time.
4. **Outputs section** — Empty state at Phase 2 (no squad outputs yet). Placeholder text: "Outputs will appear here as squads complete processes."

**Why single page:** Simpler navigation for the operator. Everything about a client visible without switching tabs.

---

### Archive UX — Hidden by Default + Toggle + Restorable

- Active client list hides archived by default
- "Show archived" toggle at top reveals archived clients with greyed-out appearance
- Archiving requires confirmation dialog: "Archive [Client Name]? They'll be hidden from active views."
- Archived clients can be restored: clicking into an archived client profile shows a "Restore client" button
- Archive = `status: 'archived'` in DB, all data preserved

---

### Phase Auto-Initialization on Client Creation

When a new client is created:
1. Insert client row with `current_phase_number: 1`, `status: 'active'`
2. Auto-create all 5 phase rows with `status: 'pending'`
3. Set Phase 1 to `status: 'active'`, `started_at: NOW()`

**Why:** Profile page needs all 5 phases to render the full timeline. Doing it at creation time avoids conditional rendering.

**Implementation note:** This should happen in a single Server Action using the admin Supabase client (bypasses RLS) in a transaction-like sequential insert. Phase rows: `phase_number` 1–5, `name` from `PHASE_NAMES` enum, `status: 'pending'` except phase 1 which is `active`.

---

## Routes

| Route | Purpose |
|-------|---------|
| `/clients` | Client list (cards) with new client button + show archived toggle |
| `/clients/new` | New client intake form |
| `/clients/[id]` | Client profile — single scrollable page |
| `/clients/[id]/edit` | Edit client name, company, briefing |

---

## Out of Scope for This Phase

- Phase transitions / advancing clients (Phase 3)
- Squad execution trigger (Phase 5)
- Real output display (Phase 7)
- Search / filtering beyond active/archived toggle (v2)
- Drag-and-drop (explicitly out of scope per REQUIREMENTS.md)

---

## Requirements Covered

| Requirement | Description | Decision |
|-------------|-------------|----------|
| CLNT-01 | Register client with name, company, briefing | Hybrid form, auto-initialize 5 phases |
| CLNT-02 | View profile: current phase, history, outputs | Single-page profile with pipeline timeline |
| CLNT-03 | Edit client info and briefing | Edit route, doesn't change pipeline state |
| CLNT-04 | Archive/deactivate client | Soft archive, toggle visibility, restorable |
