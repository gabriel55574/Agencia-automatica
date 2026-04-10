# Phase 18: PT-BR Localization - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Translate all user-facing UI text across ~45 components and email notification templates to Brazilian Portuguese. Zero English text visible to the operator. Delivers requirements LOC-01 (all UI in PT-BR) and LOC-02 (pipeline phase names in PT-BR).

</domain>

<decisions>
## Implementation Decisions

### Technical Terms — Keep in English
- **D-01:** The following business/technical terms remain in English (standard in Brazilian marketing/tech industry):
  - Dashboard, Go-to-Market, Squad, Pipeline, Output, Template, CRM, NPS, CLV, Feedback, Briefing, Status, PDF
- **D-02:** All other UI text is translated to PT-BR. Key translations:
  - Clients → Clientes, Costs → Custos, Analytics → Análise
  - Create → Criar, Edit → Editar, Delete → Excluir, Archive → Arquivar
  - Save → Salvar, Cancel → Cancelar, Search → Buscar
  - Active → Ativo, Pending → Pendente, Completed → Concluído, Failed → Falhou
  - Approve → Aprovar, Reject → Rejeitar, Running → Executando, Queued → Na fila
  - New Client → Novo Cliente, No clients → Nenhum cliente
  - Sign Out → Sair (already done in Phase 16)

### Translation Scope
- **D-03:** Translate: UI components (~45 files), empty states, placeholders, buttons, labels, table headers, tooltips, descriptions, toast/feedback messages, email notification templates (Resend)
- **D-04:** Do NOT translate: console.log/console.error messages, code comments, variable/function names, internal technical error messages, Sentry error strings

### String Organization
- **D-05:** Inline hardcode — translate strings directly in each component's JSX/TSX. No centralized strings file, no lookup table, no i18n framework. This is consistent with the Out of Scope decision to not use an i18n framework.
- **D-06:** `PHASE_NAMES` in `src/lib/database/enums.ts` already contains PT-BR names — LOC-02 is largely satisfied. Verify all 5 names render correctly everywhere during translation pass.

### Claude's Discretion
- Exact Portuguese phrasing for complex UI messages (error descriptions, help text, empty state descriptions)
- Order of component translation (suggested: start with layout/navigation, then pages, then modals/dialogs)
- Whether to batch translate by page route or by component type

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Dependencies
- `.planning/phases/16-brand-identity-sidebar-layout/16-CONTEXT.md` — Sidebar labels (D-08 item order: Dashboard, Clientes, Custos, Analytics, Templates), "Sair" already PT-BR
- `.planning/phases/17-phase-colors-breadcrumbs/17-CONTEXT.md` — Breadcrumb labels (Clientes > {name} > Editar), already PT-BR in context

### Existing PT-BR Constants
- `src/lib/database/enums.ts` — PHASE_NAMES already in PT-BR (Diagnostico, Engenharia de Valor, Go-to-Market, Tracao e Vendas, Retencao e Escala)

### Email Templates
- `src/lib/notifications/templates.ts` — Email notification templates that need translation
- `src/lib/notifications/digest.ts` — Daily digest email content

### Requirements
- `.planning/REQUIREMENTS.md` — LOC-01 (all UI in PT-BR), LOC-02 (phase names in PT-BR)

</canonical_refs>

<code_context>
## Existing Code Insights

### Translation Surface
- ~87 files contain English strings (617 occurrences found via grep)
- UI components: ~45 files in `src/components/` and `src/app/`
- Email templates: `src/lib/notifications/templates.ts`, `digest.ts`
- Action responses: `src/lib/actions/*.ts` (user-facing error/success messages)

### Already PT-BR
- `PHASE_NAMES` in `src/lib/database/enums.ts` — 5 phase names
- `lang="pt-BR"` in `src/app/layout.tsx` — HTML lang attribute already set
- "Sair" in dashboard layout (Phase 16 will implement)

### Key Component Groups to Translate
- **Dashboard:** KanbanBoard, KanbanColumn, KanbanClientCard, BottleneckAlert, ActionPanel, CostSummaryWidget
- **Clients:** client-form, client-card, client-grid, archive-dialog, clone-client-dialog, reset-pipeline-dialog, pipeline-accordion, pipeline-phase, process-row, gate-section, gate-review-display
- **Documents:** OutputViewer, OutputPdfTemplate, PdfDownloadSection, RunHistoryList, outputs-browser
- **Squad:** RunSquadButton, PromptPreviewModal, StructuredOutputView
- **Costs:** CostBreakdownTable, MonthSelector, BudgetSettingDialog
- **Analytics:** AnalyticsDashboard, DateRangeFilter, PhasePerformanceChart, GateApprovalChart, LifecycleMetrics, TrendChart
- **Templates:** template-list
- **Auth:** login page, login actions
- **Layout:** NavLinks (replaced in Phase 16)

### Integration Points
- Every `.tsx` file with user-facing strings
- `src/lib/notifications/templates.ts` — email HTML templates
- `src/lib/pipeline/processes.ts` — process definitions (names, descriptions)

</code_context>

<specifics>
## Specific Ideas

- The app already has `lang="pt-BR"` set in the root layout — good foundation
- Phase names are already PT-BR in `enums.ts` — no change needed there
- Email templates use HTML strings — translate the text content, keep the HTML structure
- Process definitions in `processes.ts` may have English names/descriptions that the operator sees — these should be translated

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-pt-br-localization*
*Context gathered: 2026-04-09*
