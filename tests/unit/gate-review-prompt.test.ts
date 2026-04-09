/**
 * Tests for buildReviewPrompt adversarial review prompt builder.
 *
 * Verifies:
 * - Adversarial persona is included
 * - Gate checklist items are embedded
 * - Phase outputs are included
 * - JSON output format instructions are present
 * - Invalid gate numbers throw errors
 */

import { describe, it, expect } from 'vitest'
import { buildReviewPrompt } from '@/lib/gates/review-prompt'

const samplePhaseOutputs = [
  {
    processName: 'Pesquisa de Mercado',
    processNumber: 1,
    output: 'Market research results with competitive analysis data.',
  },
  {
    processName: 'Segmentacao e Persona',
    processNumber: 2,
    output: 'Segmentation results with persona definitions.',
  },
]

describe('buildReviewPrompt', () => {
  it('returns string containing "independent quality auditor"', () => {
    const prompt = buildReviewPrompt(1, samplePhaseOutputs)
    expect(prompt).toContain('independent quality auditor')
  })

  it('returns string containing all Gate 1 checklist item labels', () => {
    const prompt = buildReviewPrompt(1, samplePhaseOutputs)
    expect(prompt).toContain('Persona principal definida com dados')
    expect(prompt).toContain('Segmento passa no teste de atratividade')
    expect(prompt).toContain('Segmento passa no teste de compatibilidade')
    expect(prompt).toContain('Insights geram acoes claras')
    expect(prompt).toContain('Cliente aprovou o perfil de publico-alvo')
  })

  it('returns string containing all Gate 2 checklist item labels', () => {
    const prompt = buildReviewPrompt(2, samplePhaseOutputs)
    expect(prompt).toContain('Posicionamento usa atributos factuais')
    expect(prompt).toContain('Oferta passa na Value Equation de Hormozi')
    expect(prompt).toContain('Preco descolado da comoditizacao')
    expect(prompt).toContain('Garantia de risco incluida')
    expect(prompt).toContain('Mantra da marca definido em 3-5 palavras')
    expect(prompt).toContain('Cliente aprovou posicionamento + oferta + preco')
  })

  it('returns string containing phase output content', () => {
    const prompt = buildReviewPrompt(1, samplePhaseOutputs)
    expect(prompt).toContain('Market research results with competitive analysis data.')
    expect(prompt).toContain('Segmentation results with persona definitions.')
  })

  it('returns string containing JSON output format instructions', () => {
    const prompt = buildReviewPrompt(1, samplePhaseOutputs)
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('gate_number')
    expect(prompt).toContain('overall')
    expect(prompt).toContain('checklist_id')
    expect(prompt).toContain('verdict')
    expect(prompt).toContain('evidence')
  })

  it('throws for invalid gate number 0', () => {
    expect(() => buildReviewPrompt(0, samplePhaseOutputs)).toThrow(
      'No checklist found for gate 0'
    )
  })

  it('throws for invalid gate number 5', () => {
    expect(() => buildReviewPrompt(5, samplePhaseOutputs)).toThrow(
      'No checklist found for gate 5'
    )
  })

  it('includes process names in output sections', () => {
    const prompt = buildReviewPrompt(1, samplePhaseOutputs)
    expect(prompt).toContain('Pesquisa de Mercado')
    expect(prompt).toContain('Segmentacao e Persona')
  })

  it('includes evaluation instructions about citing evidence', () => {
    const prompt = buildReviewPrompt(1, samplePhaseOutputs)
    expect(prompt).toContain('evidence')
    expect(prompt.toLowerCase()).toContain('checklist item')
  })

  it('works with empty phase outputs array', () => {
    const prompt = buildReviewPrompt(1, [])
    expect(prompt).toContain('independent quality auditor')
    expect(prompt).toContain('Persona principal definida com dados')
  })
})
