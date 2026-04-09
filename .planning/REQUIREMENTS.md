# Requirements: Agency OS v1.2

**Defined:** 2026-04-09
**Core Value:** One person manages 15+ clients at agency quality by combining a standardized marketing process with AI-powered squad automation

## v1.2 Requirements

Requirements for UI/UX Overhaul milestone. Each maps to roadmap phases.

### Localizacao

- [ ] **LOC-01**: Operador ve toda a interface em PT-BR (labels, botoes, mensagens, placeholders, empty states)
- [ ] **LOC-02**: Nomes das 5 fases do pipeline exibidos em PT-BR (Diagnostico, Engenharia de Valor, Go-to-Market, Tracao e Vendas, Retencao e Escala)

### Navegacao

- [ ] **NAV-01**: Operador navega entre todas as secoes via sidebar persistente (Dashboard, Clientes, Custos, Analytics, Templates)
- [ ] **NAV-02**: Operador ve breadcrumbs em paginas de detalhe mostrando hierarquia (ex: Dashboard > Clientes > Joao Silva > Editar)

### Visual

- [ ] **VIS-01**: Cada fase do pipeline tem cor distinta aplicada no Kanban, accordion de pipeline, e badges de status
- [ ] **VIS-02**: App tem identidade visual definida (cor primaria, accent, area de logo no sidebar/header)
- [ ] **VIS-03**: Empty states exibem ilustracao/icone relevante e CTA claro orientando o operador

### UX/Feedback

- [ ] **UX-01**: Operador ve skeleton screens enquanto dados carregam em todas as rotas do dashboard
- [ ] **UX-02**: Operador recebe toast de confirmacao apos acoes (criar cliente, editar, deletar, arquivar, salvar template)
- [ ] **UX-03**: Client profile organizado em tabs (Pipeline / Outputs / Briefing) em vez de scroll longo

## Future Requirements

Deferred to v1.3+. Tracked but not in current roadmap.

### Navegacao Avancada

- **NAV-03**: Busca global de clientes via Cmd+K ou campo de busca
- **NAV-04**: Keyboard shortcuts para acoes frequentes (novo cliente, navegar entre secoes)

### Visual Avancado

- **VIS-04**: Dark mode completo em todos os componentes
- **VIS-05**: Animacoes de transicao entre paginas e estados

### Mobile

- **MOB-01**: Layout responsivo otimizado para tablet
- **MOB-02**: Bottom navigation em telas mobile

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dark mode | Complexidade visual alta, priorizar light mode polido primeiro |
| Mobile-first redesign | Web desktop e o uso primario do operador solo |
| Keyboard shortcuts | Nice-to-have, nao critico para v1.2 |
| Drag-and-drop Kanban | Phase transitions devem passar por quality gates |
| Custom theming | Um operador, um tema — sem necessidade de customizacao |
| Internacionalizacao (i18n framework) | Apenas PT-BR necessario, hardcode strings |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOC-01 | Phase 18 | Pending |
| LOC-02 | Phase 18 | Pending |
| NAV-01 | Phase 16 | Pending |
| NAV-02 | Phase 17 | Pending |
| VIS-01 | Phase 17 | Pending |
| VIS-02 | Phase 16 | Pending |
| VIS-03 | Phase 19 | Pending |
| UX-01 | Phase 19 | Pending |
| UX-02 | Phase 19 | Pending |
| UX-03 | Phase 19 | Pending |

**Coverage:**
- v1.2 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-09 after roadmap creation*
