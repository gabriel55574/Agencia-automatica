# Phase 19: UX Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 19-ux-polish
**Areas discussed:** Skeleton screens, Empty states, Tabs no client profile, Toast feedback

---

## Skeleton Screens

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js loading.tsx | Um loading.tsx por rota com skeleton especifico. Streaming automatico via Suspense. | X |
| Skeleton generico | Um unico skeleton generico reutilizado em todas as rotas. | |
| Voce decide | Claude escolhe a abordagem. | |

**User's choice:** Next.js loading.tsx por rota
**Notes:** 6 loading.tsx files (dashboard, clients, client profile, analytics, costs, templates). animate-pulse, bg-gray-100 on white.

---

## Empty States

| Option | Description | Selected |
|--------|-------------|----------|
| Lucide icon grande + texto + CTA | Icon 48px gray-300, texto descritivo PT-BR, botao CTA primario (Electric Lime). | X |
| SVG ilustracoes custom | Ilustracoes vetoriais desenhadas para cada empty state. | |
| Voce decide | Claude define o estilo. | |

**User's choice:** Lucide icon grande + texto + CTA
**Notes:** Reusable EmptyState component. Icon + title + description + action button. 6 empty states needed (clients, outputs, templates, costs, analytics, dashboard).

---

## Tabs no Client Profile

| Option | Description | Selected |
|--------|-------------|----------|
| 3 tabs client-side | Pipeline / Outputs / Briefing. Troca sem navegacao. URL nao muda. shadcn Tabs. | X |
| 3 tabs com URL | Cada tab muda URL (?tab=outputs). Permite link direto. | |
| Voce decide | Claude define a abordagem. | |

**User's choice:** 3 tabs client-side
**Notes:** Pipeline (default), Outputs (move from /outputs subpage), Briefing (show briefing data + edit button). No URL change.

---

## Toast Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Completar cobertura | Adicionar toasts onde faltam: criar/editar/arquivar/deletar cliente + erros validacao. | X |
| Voce decide | Claude identifica e adiciona. | |

**User's choice:** Completar cobertura
**Notes:** 8 components already have toasts. Missing: create client, edit client, archive/restore, delete, form validation errors. Sonner default style with semantic colors.

---

## Claude's Discretion

- Skeleton shapes per route
- Shared skeleton components vs inline
- /clients/[id]/outputs route handling after tab migration
- Exact empty state icon per page
- Additional toast edge cases

## Deferred Ideas

None — discussion stayed within phase scope
