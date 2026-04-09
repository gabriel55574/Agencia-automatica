/**
 * Gate 2 Checklist: Oferta + Marca OK?
 *
 * Quality Gate between Phase 2 (Engenharia de Valor) and Phase 3 (Go-to-Market).
 * Items taken verbatim from docs/agency-os-prompt.md Quality Gate 2 section.
 */

import type { GateChecklist } from './index'

export const gate2Checklist: GateChecklist = {
  gateNumber: 2,
  gateName: 'Oferta + Marca OK?',
  items: [
    {
      id: 'gate-2-item-1',
      label: 'Posicionamento usa atributos factuais (nao subjetivos)?',
      description:
        'O posicionamento deve ser baseado em diferenciais factuais e verificaveis',
    },
    {
      id: 'gate-2-item-2',
      label: 'Oferta passa na Value Equation de Hormozi?',
      description:
        'A oferta maximiza (Sonho + Probabilidade) / minimiza (Tempo + Esforco)',
    },
    {
      id: 'gate-2-item-3',
      label: 'Preco descolado da comoditizacao?',
      description:
        'O preco esta baseado em valor percebido, nao em custo ou concorrencia direta',
    },
    {
      id: 'gate-2-item-4',
      label: 'Garantia de risco incluida?',
      description:
        'A oferta inclui uma garantia de reversao de risco para o cliente',
    },
    {
      id: 'gate-2-item-5',
      label: 'Mantra da marca definido em 3-5 palavras?',
      description:
        'A marca possui um mantra conciso que captura sua essencia',
    },
    {
      id: 'gate-2-item-6',
      label: 'Cliente aprovou posicionamento + oferta + preco?',
      description:
        'O operador validou o posicionamento, oferta e estrutura de preco',
    },
  ],
}
