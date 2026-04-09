/**
 * Gate 3 Checklist: Plano Tatico Validado?
 *
 * Quality Gate between Phase 3 (Go-to-Market) and Phase 4 (Tracao e Vendas).
 * Items taken verbatim from docs/agency-os-prompt.md Quality Gate 3 section.
 */

import type { GateChecklist } from './index'

export const gate3Checklist: GateChecklist = {
  gateNumber: 3,
  gateName: 'Plano Tatico Validado?',
  items: [
    {
      id: 'gate-3-item-1',
      label: 'Meta G-STIC tem foco + benchmark quantitativo + temporal?',
      description:
        'A meta deve ter foco claro, benchmark numerico e prazo definido',
    },
    {
      id: 'gate-3-item-2',
      label: '7 Ts todos preenchidos?',
      description:
        'Produto, Servico, Marca, Preco, Incentivos, Comunicacao e Distribuicao devem estar detalhados',
    },
    {
      id: 'gate-3-item-3',
      label: 'Canais nao geram conflitos verticais/horizontais?',
      description:
        'Os canais de distribuicao selecionados nao conflitam entre si',
    },
    {
      id: 'gate-3-item-4',
      label: 'Logistica garante o que o marketing promete?',
      description:
        'A cadeia logistica suporta as promessas feitas nas campanhas',
    },
    {
      id: 'gate-3-item-5',
      label: 'Cronograma de implementacao aprovado?',
      description:
        'O cronograma de implementacao foi revisado e aprovado',
    },
    {
      id: 'gate-3-item-6',
      label: 'Orcamento alocado e aprovado pelo cliente?',
      description:
        'O orcamento foi definido e aprovado pelo operador',
    },
  ],
}
