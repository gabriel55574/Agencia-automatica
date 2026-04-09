/**
 * Unit tests for src/lib/squads/assembler.ts
 *
 * Tests the assembleContext function which collects client briefing + prior
 * phase outputs and applies 32K character truncation oldest-first.
 *
 * Uses a mock Supabase client injected via the optional parameter.
 */

import { describe, it, expect, vi } from 'vitest'
import { assembleContext } from '../../src/lib/squads/assembler'
import type { AssembledContext } from '../../src/lib/squads/assembler'

// ============================================================
// Mock Supabase client builder
// ============================================================

type QueryResult = { data: unknown; error: null } | { data: null; error: { message: string } }

/**
 * Creates a mock Supabase client that responds to queries from both
 * assembleContext and extractFeedbackContext (called internally):
 *
 * assembleContext queries:
 * 1. clients table: .from('clients').select('briefing, current_phase_number').eq(...).single()
 * 2. squad_jobs table: complex join query with .lt() and double .order()
 *
 * extractFeedbackContext queries (via shared supabase client):
 * 3. clients table: .from('clients').select('cycle_number').eq(...).single()
 * (short-circuits with cycle_number=1, so no further squad_jobs queries needed)
 */
function createMockSupabase(options: {
  clientData?: { briefing: Record<string, unknown>; current_phase_number: number } | null
  clientError?: string | null
  jobsData?: Array<{
    output: string
    processes: { process_number: number; name: string }
    phases: { phase_number: number }
  }>
  jobsError?: string | null
}) {
  const { clientData = null, clientError = null, jobsData = [], jobsError = null } = options

  // Track clients query call count to differentiate assembler vs feedback queries
  let clientsCallCount = 0

  // Build the mock chain for the assembler's clients query
  function buildAssemblerClientChain() {
    const clientSingleMock = vi.fn(() =>
      clientError
        ? { data: null, error: { message: clientError } }
        : { data: clientData, error: null }
    )
    const clientEqMock = vi.fn(() => ({ single: clientSingleMock }))
    const clientSelectMock = vi.fn(() => ({ eq: clientEqMock }))
    return { select: clientSelectMock }
  }

  // Build the mock chain for extractFeedbackContext's clients query
  // Always returns cycle_number=1 so feedback extraction short-circuits
  function buildFeedbackClientChain() {
    const singleMock = vi.fn(() => ({
      data: { cycle_number: 1 },
      error: null,
    }))
    const eqMock = vi.fn(() => ({ single: singleMock }))
    const selectMock = vi.fn(() => ({ eq: eqMock }))
    return { select: selectMock }
  }

  // Build the mock chain for the squad_jobs query (assembler only)
  const jobsOrderMock = vi.fn(() =>
    jobsError
      ? { data: null, error: { message: jobsError } }
      : { data: jobsData, error: null }
  )
  const jobsOrder2Mock = vi.fn(() => ({ order: jobsOrderMock }))
  const jobsLtMock = vi.fn(() => ({ order: jobsOrder2Mock }))
  const jobsNotMock = vi.fn(() => ({ lt: jobsLtMock }))
  const jobsEqMock = vi.fn(() => ({ not: jobsNotMock }))
  const jobsEq2Mock = vi.fn(() => ({ eq: jobsEqMock }))
  const jobsSelectMock = vi.fn(() => ({ eq: jobsEq2Mock }))

  const fromMock = vi.fn((table: string) => {
    if (table === 'clients') {
      clientsCallCount++
      // First call is from assembleContext, second from extractFeedbackContext
      if (clientsCallCount === 1) {
        return buildAssemblerClientChain()
      }
      return buildFeedbackClientChain()
    }
    if (table === 'squad_jobs') {
      return { select: jobsSelectMock }
    }
    return { select: vi.fn() }
  })

  return { from: fromMock } as unknown as Parameters<typeof assembleContext>[2]
}

// ============================================================
// Test fixtures
// ============================================================

const TEST_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440001'

const DEFAULT_BRIEFING = {
  niche: 'SaaS B2B',
  target_audience: 'PMEs de tecnologia',
  additional_context: 'Empresa com 2 anos de mercado',
}

// ============================================================
// Tests
// ============================================================

describe('assembleContext', () => {
  it('returns briefing with empty priorOutputs when client has no prior completed jobs', async () => {
    const mockClient = createMockSupabase({
      clientData: { briefing: DEFAULT_BRIEFING, current_phase_number: 1 },
      jobsData: [],
    })

    const result = await assembleContext(TEST_CLIENT_ID, 1, mockClient)

    expect(result.briefing).toBe(JSON.stringify(DEFAULT_BRIEFING))
    expect(result.priorOutputs).toEqual([])
    expect(result.feedbackContext).toBe('')
    expect(result.truncated).toBe(false)
    expect(result.totalOutputsAvailable).toBe(0)
    expect(result.outputsIncluded).toBe(0)
  })

  it('returns priorOutputs ordered by phase_number ASC then process_number ASC', async () => {
    const mockClient = createMockSupabase({
      clientData: { briefing: DEFAULT_BRIEFING, current_phase_number: 3 },
      jobsData: [
        {
          output: 'phase 1 process 1 output',
          processes: { process_number: 1, name: 'Pesquisa de Mercado' },
          phases: { phase_number: 1 },
        },
        {
          output: 'phase 1 process 2 output',
          processes: { process_number: 2, name: 'Segmentacao' },
          phases: { phase_number: 1 },
        },
        {
          output: 'phase 2 process 3 output',
          processes: { process_number: 3, name: 'Posicionamento' },
          phases: { phase_number: 2 },
        },
      ],
    })

    const result = await assembleContext(TEST_CLIENT_ID, 7, mockClient)

    expect(result.priorOutputs).toHaveLength(3)
    expect(result.priorOutputs[0].processNumber).toBe(1)
    expect(result.priorOutputs[0].phaseNumber).toBe(1)
    expect(result.priorOutputs[1].processNumber).toBe(2)
    expect(result.priorOutputs[1].phaseNumber).toBe(1)
    expect(result.priorOutputs[2].processNumber).toBe(3)
    expect(result.priorOutputs[2].phaseNumber).toBe(2)
    expect(result.totalOutputsAvailable).toBe(3)
    expect(result.outputsIncluded).toBe(3)
  })

  it('truncates oldest outputs when total context exceeds 32,000 chars', async () => {
    // Create outputs that exceed 32K chars total
    const largeOutput = 'x'.repeat(15_000) // 15K chars each
    const mockClient = createMockSupabase({
      clientData: { briefing: DEFAULT_BRIEFING, current_phase_number: 4 },
      jobsData: [
        {
          output: largeOutput,
          processes: { process_number: 1, name: 'Pesquisa de Mercado' },
          phases: { phase_number: 1 },
        },
        {
          output: largeOutput,
          processes: { process_number: 2, name: 'Segmentacao' },
          phases: { phase_number: 1 },
        },
        {
          output: largeOutput,
          processes: { process_number: 3, name: 'Posicionamento' },
          phases: { phase_number: 2 },
        },
      ],
    })

    const result = await assembleContext(TEST_CLIENT_ID, 12, mockClient)

    expect(result.truncated).toBe(true)
    expect(result.totalOutputsAvailable).toBe(3)
    expect(result.outputsIncluded).toBeLessThan(3)

    // Verify total chars are within limit
    const totalChars =
      JSON.stringify(DEFAULT_BRIEFING).length +
      result.priorOutputs.reduce((sum, o) => sum + o.output.length, 0)
    expect(totalChars).toBeLessThanOrEqual(32_000)
  })

  it('feedbackContext is empty string for cycle 1 clients', async () => {
    const mockClient = createMockSupabase({
      clientData: { briefing: DEFAULT_BRIEFING, current_phase_number: 2 },
      jobsData: [],
    })

    const result = await assembleContext(TEST_CLIENT_ID, 3, mockClient)
    expect(result.feedbackContext).toBe('')
  })

  it('throws when client is not found', async () => {
    const mockClient = createMockSupabase({
      clientError: 'Client not found',
    })

    await expect(assembleContext(TEST_CLIENT_ID, 1, mockClient)).rejects.toThrow(
      'Client not found'
    )
  })

  it('handles client with null briefing gracefully', async () => {
    const mockClient = createMockSupabase({
      clientData: { briefing: null as unknown as Record<string, unknown>, current_phase_number: 1 },
      jobsData: [],
    })

    const result = await assembleContext(TEST_CLIENT_ID, 1, mockClient)
    expect(result.briefing).toBe('')
    expect(result.priorOutputs).toEqual([])
  })
})
