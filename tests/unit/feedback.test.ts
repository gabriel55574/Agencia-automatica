/**
 * Unit tests for src/lib/squads/feedback.ts
 *
 * Tests the extractFeedbackContext function which pulls Phase 5 (Retencao)
 * outputs from a client's previous cycle and formats them as structured
 * feedback context for Phase 1 re-execution.
 *
 * Uses a mock Supabase client injected via the optional parameter.
 */

import { describe, it, expect, vi } from 'vitest'
import { extractFeedbackContext } from '../../src/lib/squads/feedback'

// ============================================================
// Mock Supabase client builder
// ============================================================

/**
 * Creates a mock Supabase client that responds to the queries
 * extractFeedbackContext makes:
 * 1. clients table: .from('clients').select('cycle_number').eq('id', clientId).single()
 * 2. squad_jobs table (process 16): join query with .eq + .limit(1).single()
 * 3. squad_jobs table (all Phase 5): broader join query
 */
function createMockSupabase(options: {
  cycleNumber?: number
  clientError?: string | null
  process16Job?: {
    output: string
    structured_output: Record<string, unknown> | null
    processes: { process_number: number; name: string }
    phases: { phase_number: number }
  } | null
  process16Error?: string | null
  phase5Jobs?: Array<{
    output: string
    processes: { process_number: number; name: string }
    phases: { phase_number: number }
  }>
  phase5Error?: string | null
}) {
  const {
    cycleNumber = 1,
    clientError = null,
    process16Job = null,
    process16Error = null,
    phase5Jobs = [],
    phase5Error = null,
  } = options

  // Track call count to from('squad_jobs') to differentiate first (process 16) vs second (all Phase 5) call
  let squadJobsCallCount = 0

  // Build client query chain
  const clientSingleMock = vi.fn(() =>
    clientError
      ? { data: null, error: { message: clientError } }
      : { data: { cycle_number: cycleNumber }, error: null }
  )
  const clientEqMock = vi.fn(() => ({ single: clientSingleMock }))
  const clientSelectMock = vi.fn(() => ({ eq: clientEqMock }))

  // Build process-16 specific query chain (first squad_jobs call)
  // .from('squad_jobs').select(...).eq('client_id').eq('status','completed')
  //   .not('output','is',null).eq('phases.phase_number',5).eq('processes.process_number',16)
  //   .order('created_at',{ascending:false}).limit(1).maybeSingle()
  function buildProcess16Chain() {
    const p16MaybeSingleMock = vi.fn(() =>
      process16Error
        ? { data: null, error: { message: process16Error } }
        : { data: process16Job, error: null }
    )
    const p16LimitMock = vi.fn(() => ({ maybeSingle: p16MaybeSingleMock }))
    const p16OrderMock = vi.fn(() => ({ limit: p16LimitMock }))
    const p16Eq5Mock = vi.fn(() => ({ order: p16OrderMock }))
    const p16Eq4Mock = vi.fn(() => ({ eq: p16Eq5Mock }))
    const p16NotMock = vi.fn(() => ({ eq: p16Eq4Mock }))
    const p16Eq3Mock = vi.fn(() => ({ not: p16NotMock }))
    const p16Eq2Mock = vi.fn(() => ({ eq: p16Eq3Mock }))
    const p16SelectMock = vi.fn(() => ({ eq: p16Eq2Mock }))
    return { select: p16SelectMock }
  }

  // Build all Phase 5 jobs query chain (second squad_jobs call)
  // .from('squad_jobs').select(...).eq('client_id').eq('status','completed')
  //   .not('output','is',null).eq('phases.phase_number',5)
  //   .order('processes(process_number)',{ascending:true})
  function buildPhase5Chain() {
    const p5OrderMock = vi.fn(() =>
      phase5Error
        ? { data: null, error: { message: phase5Error } }
        : { data: phase5Jobs, error: null }
    )
    const p5Eq4Mock = vi.fn(() => ({ order: p5OrderMock }))
    const p5NotMock = vi.fn(() => ({ eq: p5Eq4Mock }))
    const p5Eq3Mock = vi.fn(() => ({ not: p5NotMock }))
    const p5Eq2Mock = vi.fn(() => ({ eq: p5Eq3Mock }))
    const p5SelectMock = vi.fn(() => ({ eq: p5Eq2Mock }))
    return { select: p5SelectMock }
  }

  const fromMock = vi.fn((table: string) => {
    if (table === 'clients') {
      return { select: clientSelectMock }
    }
    if (table === 'squad_jobs') {
      squadJobsCallCount++
      if (squadJobsCallCount === 1) {
        return buildProcess16Chain()
      }
      return buildPhase5Chain()
    }
    return { select: vi.fn() }
  })

  return { from: fromMock } as unknown as Parameters<typeof extractFeedbackContext>[1]
}

// ============================================================
// Test fixtures
// ============================================================

const TEST_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440001'

const VALID_PROCESS_16_STRUCTURED = {
  clv_by_segment: {
    premium: 'R$5.000/ano',
    standard: 'R$2.000/ano',
  },
  nps_analysis: {
    promoters: '45% dos clientes recomendam ativamente',
    detractors: '12% insatisfeitos com suporte',
    passives: '43% neutros, oportunidade de conversao',
  },
  email_automations: ['Onboarding sequence', 'Churn prevention'],
  loyalty_program: 'Programa de pontos com cashback',
  retention_vs_acquisition: 'Retencao 3x mais barato que aquisicao',
  referral_program: 'Indicacao com desconto de 20%',
}

// ============================================================
// Tests
// ============================================================

describe('extractFeedbackContext', () => {
  it('returns empty string for cycle_number=1 clients (no previous cycle)', async () => {
    const mock = createMockSupabase({ cycleNumber: 1 })
    const result = await extractFeedbackContext(TEST_CLIENT_ID, mock)
    expect(result).toBe('')
  })

  it('returns formatted feedback with NPS/CLV/churn data when cycle_number>=2 and structured_output exists', async () => {
    const mock = createMockSupabase({
      cycleNumber: 2,
      process16Job: {
        output: 'Raw process 16 output text',
        structured_output: VALID_PROCESS_16_STRUCTURED,
        processes: { process_number: 16, name: 'CRM, Lealdade e CLV' },
        phases: { phase_number: 5 },
      },
      phase5Jobs: [
        {
          output: 'Process 16 full output',
          processes: { process_number: 16, name: 'CRM, Lealdade e CLV' },
          phases: { phase_number: 5 },
        },
      ],
    })

    const result = await extractFeedbackContext(TEST_CLIENT_ID, mock)

    expect(result).toContain('[FEEDBACK FROM PREVIOUS CYCLE]')
    expect(result).toContain('Cycle: 1')
    expect(result).toContain('NPS Insights:')
    expect(result).toContain('45% dos clientes recomendam ativamente')
    expect(result).toContain('12% insatisfeitos com suporte')
    expect(result).toContain('43% neutros, oportunidade de conversao')
    expect(result).toContain('CLV Metrics:')
    expect(result).toContain('premium')
    expect(result).toContain('Retention vs Acquisition:')
    expect(result).toContain('Retencao 3x mais barato que aquisicao')
    expect(result).toContain('Full Retention Outputs:')
  })

  it('falls back to raw output with note when structured_output is null', async () => {
    const mock = createMockSupabase({
      cycleNumber: 3,
      process16Job: {
        output: 'Raw CRM analysis output from Claude',
        structured_output: null,
        processes: { process_number: 16, name: 'CRM, Lealdade e CLV' },
        phases: { phase_number: 5 },
      },
      phase5Jobs: [
        {
          output: 'Raw CRM analysis output from Claude',
          processes: { process_number: 16, name: 'CRM, Lealdade e CLV' },
          phases: { phase_number: 5 },
        },
      ],
    })

    const result = await extractFeedbackContext(TEST_CLIENT_ID, mock)

    expect(result).toContain('[FEEDBACK FROM PREVIOUS CYCLE]')
    expect(result).toContain('Cycle: 2')
    expect(result).toContain('Structured extraction unavailable')
    expect(result).toContain('Raw CRM analysis output from Claude')
  })

  it('includes all Phase 5 completed job outputs in Full Retention Outputs section', async () => {
    const mock = createMockSupabase({
      cycleNumber: 2,
      process16Job: {
        output: 'Process 16 output',
        structured_output: VALID_PROCESS_16_STRUCTURED,
        processes: { process_number: 16, name: 'CRM, Lealdade e CLV' },
        phases: { phase_number: 5 },
      },
      phase5Jobs: [
        {
          output: 'Process 16 output',
          processes: { process_number: 16, name: 'CRM, Lealdade e CLV' },
          phases: { phase_number: 5 },
        },
      ],
    })

    const result = await extractFeedbackContext(TEST_CLIENT_ID, mock)

    expect(result).toContain('Full Retention Outputs:')
    expect(result).toContain('Process 16 output')
  })

  it('returns empty string with note when no Phase 5 jobs exist for previous cycle', async () => {
    const mock = createMockSupabase({
      cycleNumber: 2,
      process16Job: null,
      phase5Jobs: [],
    })

    const result = await extractFeedbackContext(TEST_CLIENT_ID, mock)

    // Should return empty string since there are no Phase 5 jobs to extract from
    expect(result).toBe('')
  })
})
