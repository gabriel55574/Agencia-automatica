/**
 * Agency OS: Phase sequence enforcement trigger integration tests
 *
 * These tests require `supabase start` to be running.
 * Run: supabase start && npm test
 *
 * Critical FOUN-03 tests: verifies that the enforce_phase_sequence() trigger
 * prevents non-sequential phase activation at the database level.
 *
 * The trigger lives in: supabase/migrations/00002_phase_enforcement.sql
 * Key behavior:
 *   - Phase 1 can ALWAYS be activated (no prerequisite)
 *   - Phase N can only be activated if phase N-1 is 'completed'
 *   - This fires on both INSERT and UPDATE to prevent any bypass path
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { testClient, cleanTestData } from '../setup'
import { PHASE_NAMES, type PhaseNumber } from '@/lib/database/enums'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Creates a test client in the database and returns its ID. */
async function createTestClient(suffix = ''): Promise<string> {
  const { data, error } = await testClient
    .from('clients')
    .insert({ name: `Trigger Test Client${suffix}`, company: `Test Co${suffix}` })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create test client: ${error?.message}`)
  return data.id
}

/**
 * Creates all 5 phases for a client, all with status 'pending'.
 * Returns a map of phase_number -> phase UUID.
 */
async function createPendingPhases(clientId: string): Promise<Record<PhaseNumber, string>> {
  const phases: { client_id: string; phase_number: number; name: string; status: 'pending' }[] = []
  for (let i = 1; i <= 5; i++) {
    phases.push({
      client_id: clientId,
      phase_number: i,
      name: PHASE_NAMES[i as PhaseNumber],
      status: 'pending',
    })
  }

  const { data, error } = await testClient.from('phases').insert(phases).select()
  if (error || !data) throw new Error(`Failed to create phases: ${error?.message}`)

  const map = {} as Record<PhaseNumber, string>
  for (const phase of data) {
    map[phase.phase_number as PhaseNumber] = phase.id
  }
  return map
}

/** Activates a phase (UPDATE status to 'active'). Returns the Supabase error or null. */
async function activatePhase(phaseId: string) {
  return testClient
    .from('phases')
    .update({ status: 'active' })
    .eq('id', phaseId)
    .select()
}

/** Marks a phase as completed (UPDATE status to 'completed'). */
async function completePhase(phaseId: string) {
  const { error } = await testClient
    .from('phases')
    .update({ status: 'completed' })
    .eq('id', phaseId)
  if (error) throw new Error(`Failed to complete phase: ${error.message}`)
}

// ----------------------------------------------------------------
// Tests
// ----------------------------------------------------------------

describe('Phase Sequence Enforcement Trigger (FOUN-03)', () => {
  let clientId: string
  let phaseIds: Record<PhaseNumber, string>

  beforeEach(async () => {
    clientId = await createTestClient()
    phaseIds = await createPendingPhases(clientId)
  })

  afterEach(async () => {
    await cleanTestData()
  })

  // ----------------------------------------------------------------
  // Test 1: Phase 1 can always be activated
  // ----------------------------------------------------------------
  it('Phase 1 can be activated for a new client (no prerequisites)', async () => {
    const { data, error } = await activatePhase(phaseIds[1])

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data![0].status).toBe('active')
  })

  // ----------------------------------------------------------------
  // Test 2: Phase 2 is blocked when Phase 1 is not completed
  // ----------------------------------------------------------------
  it('Phase 2 CANNOT be activated before Phase 1 is completed', async () => {
    // Phase 1 is still 'pending' -- trigger must reject activating phase 2
    const { error } = await activatePhase(phaseIds[2])

    expect(error).not.toBeNull()
    // The trigger raises: 'Cannot activate phase N for client X: phase N-1 is not completed'
    expect(error!.message).toMatch(/Cannot activate phase/i)
  })

  // ----------------------------------------------------------------
  // Test 3: Phase 2 CAN be activated after Phase 1 is completed
  // ----------------------------------------------------------------
  it('Phase 2 CAN be activated after Phase 1 is completed', async () => {
    // Activate then complete Phase 1
    await activatePhase(phaseIds[1])
    await completePhase(phaseIds[1])

    // Now activate Phase 2 -- should succeed
    const { data, error } = await activatePhase(phaseIds[2])

    expect(error).toBeNull()
    expect(data![0].status).toBe('active')
  })

  // ----------------------------------------------------------------
  // Test 4: Phase 3 cannot skip Phase 2 (even if Phase 1 is completed)
  // ----------------------------------------------------------------
  it('Phase 3 CANNOT be activated when Phase 2 is still pending', async () => {
    // Complete Phase 1 but leave Phase 2 as 'pending'
    await activatePhase(phaseIds[1])
    await completePhase(phaseIds[1])

    // Try to activate Phase 3 directly -- trigger must reject
    const { error } = await activatePhase(phaseIds[3])

    expect(error).not.toBeNull()
    expect(error!.message).toMatch(/Cannot activate phase/i)
  })

  // ----------------------------------------------------------------
  // Test 5: Full sequential progression through all 5 phases
  // ----------------------------------------------------------------
  it('Sequential progression works correctly through all 5 phases', async () => {
    for (let i = 1; i <= 4; i++) {
      const n = i as PhaseNumber
      // Activate phase
      const { error: activateError } = await activatePhase(phaseIds[n])
      expect(activateError, `Phase ${n} should activate without error`).toBeNull()

      // Complete phase
      await completePhase(phaseIds[n])
    }

    // Activate Phase 5 -- the final phase
    const { data, error } = await activatePhase(phaseIds[5])
    expect(error).toBeNull()
    expect(data![0].status).toBe('active')
  })

  // ----------------------------------------------------------------
  // Test 6: Different clients have independent pipelines
  // ----------------------------------------------------------------
  it('Two clients have independent phase pipelines', async () => {
    // Create a second client with its own phases
    const clientBId = await createTestClient(' B')
    const phaseBIds = await createPendingPhases(clientBId)

    // Complete Phase 1 for Client A only
    await activatePhase(phaseIds[1])
    await completePhase(phaseIds[1])

    // Client A: should be able to activate Phase 2
    const { error: clientAError } = await activatePhase(phaseIds[2])
    expect(clientAError).toBeNull()

    // Client B: Phase 1 still 'pending' -- activating Phase 2 should fail
    const { error: clientBError } = await activatePhase(phaseBIds[2])
    expect(clientBError).not.toBeNull()
    expect(clientBError!.message).toMatch(/Cannot activate phase/i)
  })
})
