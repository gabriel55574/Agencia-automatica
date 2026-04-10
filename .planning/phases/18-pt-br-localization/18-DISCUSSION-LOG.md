# Phase 18: PT-BR Localization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 18-pt-br-localization
**Areas discussed:** Termos tecnicos, Escopo da traducao, Organizacao das strings

---

## Termos Tecnicos

| Option | Description | Selected |
|--------|-------------|----------|
| Termos de negocio mantidos | Dashboard, Go-to-Market, Squad, Pipeline, Output, Template, CRM, NPS, CLV, Feedback, Briefing, Status, PDF ficam em ingles | X |
| Traduzir tudo | Traduzir absolutamente tudo incluindo termos tecnicos | |
| Voce decide | Claude define baseado no mercado BR | |

**User's choice:** Termos de negocio mantidos em ingles
**Notes:** Standard practice in Brazilian marketing/tech. These terms are commonly used in English even in PT-BR contexts.

---

## Escopo da Traducao

| Option | Description | Selected |
|--------|-------------|----------|
| UI + emails | Componentes de UI (~45), templates de email. Nao traduzir console logs, comentarios, erros tecnicos. | X |
| Apenas UI visivel | So componentes de UI. Emails ficam em ingles. | |
| Tudo (UI + emails + erros) | Traduzir inclusive mensagens de erro visiveis e emails. | |

**User's choice:** UI + emails
**Notes:** Email notification templates (Resend) are user-facing and should be in PT-BR. Technical errors (console, Sentry) stay in English for debugging.

---

## Organizacao das Strings

| Option | Description | Selected |
|--------|-------------|----------|
| Inline hardcode | Traduzir diretamente nos componentes. Sem arquivo central. | X |
| Constantes centrais | Arquivo src/lib/i18n/strings.ts com todas as strings. | |
| Voce decide | Claude escolhe a abordagem | |

**User's choice:** Inline hardcode
**Notes:** Consistent with Out of Scope decision (no i18n framework). Simple, no indirection. Each component has its strings directly in JSX.

---

## Claude's Discretion

- Exact Portuguese phrasing for complex messages
- Order of component translation
- Batch strategy (by route vs by component type)

## Deferred Ideas

None — discussion stayed within phase scope
