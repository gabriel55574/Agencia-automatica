/**
 * Gate 4 Checklist: Meta de Tracao Atingida?
 *
 * Quality Gate between Phase 4 (Tracao e Vendas) and Phase 5 (Retencao e Escala).
 * Items taken verbatim from docs/agency-os-prompt.md Quality Gate 4 section.
 */

import type { GateChecklist } from './index'

export const gate4Checklist: GateChecklist = {
  gateNumber: 4,
  gateName: 'Meta de Tracao Atingida?',
  items: [
    {
      id: 'gate-4-item-1',
      label: 'Canal principal identificado com dados reais?',
      description:
        'O canal de tracao principal foi identificado com base em testes reais, nao suposicoes',
    },
    {
      id: 'gate-4-item-2',
      label: 'CAC < LTV?',
      description:
        'O custo de aquisicao de cliente e menor que o valor do tempo de vida do cliente',
    },
    {
      id: 'gate-4-item-3',
      label: 'Testes custaram <$1.000 cada?',
      description:
        'Cada teste de canal foi executado dentro do orcamento de $1.000',
    },
    {
      id: 'gate-4-item-4',
      label: 'Leads estao sendo classificados (A/B/C)?',
      description:
        'Os leads gerados estao classificados em categorias A, B e C',
    },
    {
      id: 'gate-4-item-5',
      label: 'Funil 5 As funcionando (Awareness > Appeal > Ask > Act > Advocate)?',
      description:
        'O funil de vendas esta operando em todas as 5 etapas',
    },
    {
      id: 'gate-4-item-6',
      label: 'Meta do Caminho Critico sendo atingida?',
      description:
        'A meta definida no caminho critico esta sendo alcancada',
    },
  ],
}
