/**
 * Gate 1 Checklist: Alvo Validado?
 *
 * Quality Gate between Phase 1 (Diagnostico) and Phase 2 (Engenharia de Valor).
 * Items taken verbatim from docs/agency-os-prompt.md Quality Gate 1 section.
 */

import type { GateChecklist } from './index'

export const gate1Checklist: GateChecklist = {
  gateNumber: 1,
  gateName: 'Alvo Validado?',
  items: [
    {
      id: 'gate-1-item-1',
      label: 'Persona principal definida com dados, nao achismo?',
      description:
        'A persona deve ser baseada em dados reais de pesquisa, nao suposicoes',
    },
    {
      id: 'gate-1-item-2',
      label: 'Segmento passa no teste de atratividade?',
      description:
        'O segmento selecionado tem potencial financeiro demonstrado',
    },
    {
      id: 'gate-1-item-3',
      label: 'Segmento passa no teste de compatibilidade?',
      description:
        'A empresa tem capacidade de criar valor superior para este segmento',
    },
    {
      id: 'gate-1-item-4',
      label: 'Insights geram acoes claras (nao apenas informacoes)?',
      description:
        'Os insights do diagnostico devem ser acionaveis, nao meramente informativos',
    },
    {
      id: 'gate-1-item-5',
      label: 'Cliente aprovou o perfil de publico-alvo?',
      description:
        'O operador validou que o perfil de publico-alvo esta correto',
    },
  ],
}
