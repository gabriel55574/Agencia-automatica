# Phase 15: Templates - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous smart discuss)

<domain>
## Phase Boundary

Operator can capture and reuse successful work patterns to accelerate onboarding and improve consistency across similar clients.

Requirements: TMPL-01, TMPL-02, TMPL-03
- TMPL-01: Operator can save a successful squad output as a named template for reuse
- TMPL-02: Operator can clone a client configuration to quickly onboard similar clients
- TMPL-03: When triggering a squad run, operator can optionally select a template as reference context

</domain>

<decisions>
## Implementation Decisions

### Template Storage
- New table: templates (id, name, description, process_number, content JSONB, source_client_id, source_job_id, created_at)
- Templates store the structured_output JSON from a successful squad run
- Templates are global (not per-client) — the whole point is cross-client reuse

### Save as Template (TMPL-01)
- "Save as Template" button on StructuredOutputView (existing component in Phase 5/7)
- Opens dialog: name (required), description (optional), auto-fills process_number from source
- Server Action: createTemplateAction inserts into templates table
- Only available on completed runs with structured_output (not raw-only)

### Clone Client (TMPL-02)
- "Clone Client" button on client profile page (next to archive button area)
- Opens dialog: new client name (required), new company (required)
- Copies briefing fields from source client
- Does NOT copy pipeline state, squad runs, or gate reviews — starts fresh at Phase 1
- Uses create_client_with_phases RPC with cloned briefing data

### Template in Squad Prompt (TMPL-03)
- In PromptPreviewModal: add optional "Reference Template" selector
- Dropdown lists templates filtered by the current process_number
- If template selected, its content is appended to the assembled context as a "Reference Output" section
- Template content counts against the 32K truncation budget in assembler.ts
- Template selection is optional — null by default

### Claude's Discretion
- Template management page (list, delete, edit name/description) — suggest simple /templates route
- Whether to show template count badge on processes that have templates available
- Exact placement of "Save as Template" button in the output viewer

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/squad/StructuredOutputView.tsx` — add Save as Template button
- `src/components/squad/PromptPreviewModal.tsx` — add template selector
- `src/lib/squads/assembler.ts` — extend context assembly to include template
- `src/lib/actions/clients.ts` — createClientAction pattern for clone
- create_client_with_phases RPC for atomic client creation

### Integration Points
- New templates table (migration)
- StructuredOutputView — Save as Template button
- PromptPreviewModal — template selector dropdown
- assembler.ts — template context injection
- Client profile page — Clone Client button
- New /templates management route

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond ROADMAP success criteria.

</specifics>

<deferred>
## Deferred Ideas

- Template categories/tags for organization
- Template versioning (track revisions)
- Shared template marketplace across Agency OS instances

</deferred>
