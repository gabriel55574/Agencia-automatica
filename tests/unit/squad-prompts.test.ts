/**
 * Unit tests for the 4 squad prompt templates.
 *
 * Tests that each squad's buildPrompt function:
 * - Returns a string containing the correct squad identity agents
 * - Includes the process name from PROCESS_DEFINITIONS
 * - Includes checklist items from PROCESS_DEFINITIONS
 * - Includes the briefing text from context
 * - Includes prior outputs from context
 * - Throws for out-of-range process numbers
 * - Includes schema field names in the output format section
 */

import { describe, it, expect } from 'vitest'
import { PROCESS_DEFINITIONS } from '@/lib/pipeline/processes'
import type { AssembledContext } from '@/lib/squads/assembler'
import { buildPrompt as buildEstrategiaPrompt } from '@/lib/squads/estrategia'
import { buildPrompt as buildPlanejamentoPrompt } from '@/lib/squads/planejamento'
import { buildPrompt as buildGrowthPrompt } from '@/lib/squads/growth'
import { buildPrompt as buildCrmPrompt } from '@/lib/squads/crm'

// Shared mock context for all tests
const mockContext: AssembledContext = {
  briefing: 'Test briefing content for unit testing squad prompts',
  priorOutputs: [
    {
      processNumber: 1,
      processName: 'Pesquisa de Mercado e Insights',
      phaseNumber: 1,
      output: 'Prior output from process 1 for testing',
    },
  ],
  feedbackContext: '',
  truncated: false,
  totalOutputsAvailable: 1,
  outputsIncluded: 1,
}

// ============================================================
// Squad Estrategia (Processes 1-6)
// ============================================================
describe('Squad Estrategia - buildPrompt', () => {
  it('contains squad identity agents', () => {
    const prompt = buildEstrategiaPrompt(mockContext, 1)
    expect(prompt).toContain('Pesquisador de Mercado')
    expect(prompt).toContain('Analista de Segmentacao')
    expect(prompt).toContain('Especialista em Posicionamento')
    expect(prompt).toContain('Arquiteto de Ofertas')
  })

  it('contains process name from PROCESS_DEFINITIONS', () => {
    const prompt = buildEstrategiaPrompt(mockContext, 1)
    expect(prompt).toContain(PROCESS_DEFINITIONS[1].name)
  })

  it('contains all checklist items from PROCESS_DEFINITIONS', () => {
    const prompt = buildEstrategiaPrompt(mockContext, 1)
    for (const item of PROCESS_DEFINITIONS[1].checklist) {
      expect(prompt).toContain(item)
    }
  })

  it('contains schema field name for output format (process 1)', () => {
    const prompt = buildEstrategiaPrompt(mockContext, 1)
    expect(prompt).toContain('problem_definition')
  })

  it('contains briefing text from context', () => {
    const prompt = buildEstrategiaPrompt(mockContext, 1)
    expect(prompt).toContain('Test briefing content for unit testing squad prompts')
  })

  it('contains prior outputs from context', () => {
    const prompt = buildEstrategiaPrompt(mockContext, 1)
    expect(prompt).toContain('Prior output from process 1 for testing')
  })

  it('throws for out-of-range process number', () => {
    expect(() => buildEstrategiaPrompt(mockContext, 7)).toThrow()
    expect(() => buildEstrategiaPrompt(mockContext, 0)).toThrow()
    expect(() => buildEstrategiaPrompt(mockContext, 16)).toThrow()
  })

  it('works for all valid process numbers (1-6)', () => {
    for (const pn of [1, 2, 3, 4, 5, 6]) {
      const prompt = buildEstrategiaPrompt(mockContext, pn)
      expect(prompt).toContain(PROCESS_DEFINITIONS[pn].name)
    }
  })
})

// ============================================================
// Squad Planejamento (Processes 7-11)
// ============================================================
describe('Squad Planejamento - buildPrompt', () => {
  it('contains squad identity agents', () => {
    const prompt = buildPlanejamentoPrompt(mockContext, 7)
    expect(prompt).toContain('Planejador G-STIC')
    expect(prompt).toContain('Arquiteto de Canais')
    expect(prompt).toContain('Especialista em Logistica')
  })

  it('contains process name from PROCESS_DEFINITIONS', () => {
    const prompt = buildPlanejamentoPrompt(mockContext, 7)
    expect(prompt).toContain(PROCESS_DEFINITIONS[7].name)
  })

  it('contains all checklist items from PROCESS_DEFINITIONS', () => {
    const prompt = buildPlanejamentoPrompt(mockContext, 7)
    for (const item of PROCESS_DEFINITIONS[7].checklist) {
      expect(prompt).toContain(item)
    }
  })

  it('contains schema field name for output format (process 7)', () => {
    const prompt = buildPlanejamentoPrompt(mockContext, 7)
    expect(prompt).toContain('goal')
    expect(prompt).toContain('tactics_7t')
  })

  it('throws for out-of-range process number', () => {
    expect(() => buildPlanejamentoPrompt(mockContext, 6)).toThrow()
    expect(() => buildPlanejamentoPrompt(mockContext, 12)).toThrow()
  })

  it('works for all valid process numbers (7-11)', () => {
    for (const pn of [7, 8, 9, 10, 11]) {
      const prompt = buildPlanejamentoPrompt(mockContext, pn)
      expect(prompt).toContain(PROCESS_DEFINITIONS[pn].name)
    }
  })
})

// ============================================================
// Squad Growth (Processes 12-15)
// ============================================================
describe('Squad Growth - buildPrompt', () => {
  it('contains squad identity agents', () => {
    const prompt = buildGrowthPrompt(mockContext, 12)
    expect(prompt).toContain('Diretor Criativo')
    expect(prompt).toContain('Gestor de Midia')
    expect(prompt).toContain('Growth Hacker (Bullseye)')
    expect(prompt).toContain('Closer de Vendas')
  })

  it('contains process name from PROCESS_DEFINITIONS', () => {
    const prompt = buildGrowthPrompt(mockContext, 12)
    expect(prompt).toContain(PROCESS_DEFINITIONS[12].name)
  })

  it('contains all checklist items from PROCESS_DEFINITIONS', () => {
    const prompt = buildGrowthPrompt(mockContext, 12)
    for (const item of PROCESS_DEFINITIONS[12].checklist) {
      expect(prompt).toContain(item)
    }
  })

  it('contains schema field name for output format (process 12)', () => {
    const prompt = buildGrowthPrompt(mockContext, 12)
    expect(prompt).toContain('channel_copies')
  })

  it('throws for out-of-range process number', () => {
    expect(() => buildGrowthPrompt(mockContext, 11)).toThrow()
    expect(() => buildGrowthPrompt(mockContext, 16)).toThrow()
  })

  it('works for all valid process numbers (12-15)', () => {
    for (const pn of [12, 13, 14, 15]) {
      const prompt = buildGrowthPrompt(mockContext, pn)
      expect(prompt).toContain(PROCESS_DEFINITIONS[pn].name)
    }
  })
})

// ============================================================
// Squad CRM (Process 16)
// ============================================================
describe('Squad CRM - buildPrompt', () => {
  it('contains squad identity agents', () => {
    const prompt = buildCrmPrompt(mockContext, 16)
    expect(prompt).toContain('Analista de CLV')
    expect(prompt).toContain('Gestor de Retencao')
    expect(prompt).toContain('Especialista em Automacao')
  })

  it('contains process name from PROCESS_DEFINITIONS', () => {
    const prompt = buildCrmPrompt(mockContext, 16)
    expect(prompt).toContain(PROCESS_DEFINITIONS[16].name)
  })

  it('contains all checklist items from PROCESS_DEFINITIONS', () => {
    const prompt = buildCrmPrompt(mockContext, 16)
    for (const item of PROCESS_DEFINITIONS[16].checklist) {
      expect(prompt).toContain(item)
    }
  })

  it('contains schema field name for output format (process 16)', () => {
    const prompt = buildCrmPrompt(mockContext, 16)
    expect(prompt).toContain('clv_by_segment')
  })

  it('throws for out-of-range process number', () => {
    expect(() => buildCrmPrompt(mockContext, 15)).toThrow()
    expect(() => buildCrmPrompt(mockContext, 1)).toThrow()
  })
})
