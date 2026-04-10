# Phase 17: Phase Colors & Breadcrumbs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 17-phase-colors-breadcrumbs
**Areas discussed:** Paleta de cores das fases, Onde aplicar as cores, Breadcrumbs visual, Hierarquia de navegacao

---

## Paleta de Cores das Fases

| Option | Description | Selected |
|--------|-------------|----------|
| Semanticas by squad | Cores associadas ao tipo de trabalho: Azul/Roxo/Laranja/Verde/Teal | X |
| Gradiente quente-frio | Progressao visual vermelho a azul | |
| Voce decide | Claude escolhe a paleta | |

**User's choice:** Semanticas by squad
**Notes:** Blue (#3B82F6), Violet (#8B5CF6), Amber (#F59E0B), Green (#22C55E), Teal (#14B8A6). Each with base, light (bg), dark (text) variants.

---

## Onde Aplicar as Cores

| Option | Description | Selected |
|--------|-------------|----------|
| Sutis | Cores em bordas/barras, badges, headers. Nao em backgrounds grandes. | X |
| Proeminentes | Cores em backgrounds maiores — header colorido, fundo accordion. | |
| Voce decide | Claude define a intensidade | |

**User's choice:** Sutis
**Notes:** Kanban: barra de cor no header. Accordion: barra lateral. Badges: light bg + dark text. Nenhum background grande colorido.

---

## Breadcrumbs Visual

| Option | Description | Selected |
|--------|-------------|----------|
| Chevron simples | Separador ChevronRight (Lucide), gray links, pagina atual em text-primary | X |
| Slash separador | Separador / entre itens. Mais minimalista. | |
| Voce decide | Claude escolhe o estilo | |

**User's choice:** Chevron simples
**Notes:** ChevronRight 14px, links em gray-300 com hover lime-dark, pagina atual sem link em font-medium.

---

## Hierarquia de Navegacao

| Option | Description | Selected |
|--------|-------------|----------|
| Apenas paginas de detalhe | Breadcrumbs so em /clients/[id], /edit, /outputs. Raiz sem breadcrumb. | X |
| Todas as paginas | Breadcrumbs em todas, incluindo raiz. | |
| Voce decide | Claude define baseado na arquitetura de rotas. | |

**User's choice:** Apenas paginas de detalhe
**Notes:** Root pages (/, /clients, /costs, /analytics, /templates) sem breadcrumb. Detail pages: Clientes > {name}, Clientes > {name} > Editar, Clientes > {name} > Outputs.

---

## Claude's Discretion

- Tailwind class mapping for phase color variants
- CSS custom properties vs Tailwind theme for phase colors
- Breadcrumb component implementation (server vs client)
- Hover animation on breadcrumb links

## Deferred Ideas

None — discussion stayed within phase scope
