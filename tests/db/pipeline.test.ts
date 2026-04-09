import { describe, it, expect, beforeEach } from 'vitest'
import { testClient } from '../setup'
import { createTestClientWithProcesses, cleanTestData } from './helpers'

beforeEach(async () => { await cleanTestData() })

describe('PIPE-01: Independent pipeline state per client', () => {
  it('two clients created separately have independent phase rows and statuses', async () => {
    const clientA = await createTestClientWithProcesses()
    const clientB = await createTestClientWithProcesses()

    expect(clientA.clientId).not.toBe(clientB.clientId)
    expect(clientA.phases).toHaveLength(5)
    expect(clientB.phases).toHaveLength(5)

    // Phase IDs are independent — no shared rows
    const phaseIdsA = new Set(clientA.phases.map(p => p.id))
    const phaseIdsB = new Set(clientB.phases.map(p => p.id))
    for (const id of phaseIdsA) {
      expect(phaseIdsB.has(id)).toBe(false)
    }
  })

  it('process rows are isolated by client_id — no cross-contamination', async () => {
    const clientA = await createTestClientWithProcesses()
    const clientB = await createTestClientWithProcesses()

    expect(clientA.processes).toHaveLength(16)
    expect(clientB.processes).toHaveLength(16)

    // All of clientA's processes belong to clientA only
    for (const proc of clientA.processes) {
      expect(proc.client_id).toBe(clientA.clientId)
    }
    // All of clientB's processes belong to clientB only
    for (const proc of clientB.processes) {
      expect(proc.client_id).toBe(clientB.clientId)
    }
  })
})

describe('PIPE-02: Gate-controlled transition (approve_gate RPC)', () => {
  it('approve_gate advances phase: gate.status=approved, current phase completed, next phase active', async () => {
    const { clientId, phases, gates } = await createTestClientWithProcesses()
    const gate1 = gates[0]

    expect(gate1.gate_number).toBe(1)
    expect(gate1.status).toBe('pending')

    const { error } = await testClient.rpc('approve_gate', {
      p_gate_id: gate1.id,
      p_client_id: clientId,
    })
    expect(error).toBeNull()

    // Gate is now approved
    const { data: updatedGate } = await testClient
      .from('quality_gates').select('*').eq('id', gate1.id).single()
    expect(updatedGate!.status).toBe('approved')
    expect(updatedGate!.operator_decision).toBe('approved')

    // Phase 1 is completed
    const { data: phase1 } = await testClient
      .from('phases').select('*').eq('id', phases[0].id).single()
    expect(phase1!.status).toBe('completed')
    expect(phase1!.completed_at).not.toBeNull()

    // Phase 2 is now active
    const { data: phase2 } = await testClient
      .from('phases').select('*').eq('id', phases[1].id).single()
    expect(phase2!.status).toBe('active')
    expect(phase2!.started_at).not.toBeNull()

    // clients.current_phase_number incremented to 2
    const { data: client } = await testClient
      .from('clients').select('current_phase_number').eq('id', clientId).single()
    expect(client!.current_phase_number).toBe(2)
  })

  it('approve_gate on already-approved gate raises exception', async () => {
    const { clientId, gates } = await createTestClientWithProcesses()
    const gate1 = gates[0]

    // First approval succeeds
    await testClient.rpc('approve_gate', { p_gate_id: gate1.id, p_client_id: clientId })

    // Second approval must error
    const { error } = await testClient.rpc('approve_gate', {
      p_gate_id: gate1.id,
      p_client_id: clientId,
    })
    expect(error).not.toBeNull()
  })
})

describe('PIPE-03: Gate rejection routes to specific failed processes', () => {
  it('reject_gate sets gate.status=rejected and marks only selected processes as failed', async () => {
    const { clientId, gates, processes } = await createTestClientWithProcesses()
    const gate1 = gates[0]
    const phase1Processes = processes.filter(p => p.phase_id === gate1.phase_id)

    const failedProcess = phase1Processes[0]
    const untouchedProcess = phase1Processes[1]

    const { error } = await testClient.rpc('reject_gate', {
      p_gate_id: gate1.id,
      p_client_id: clientId,
      p_failed_process_ids: [failedProcess.id],
      p_notes: 'needs work',
    })
    expect(error).toBeNull()

    // Gate is rejected
    const { data: updatedGate } = await testClient
      .from('quality_gates').select('*').eq('id', gate1.id).single()
    expect(updatedGate!.status).toBe('rejected')
    expect(updatedGate!.operator_decision).toBe('rejected')
    expect(updatedGate!.operator_notes).toBe('needs work')

    // Selected process is failed
    const { data: failedRow } = await testClient
      .from('processes').select('status').eq('id', failedProcess.id).single()
    expect(failedRow!.status).toBe('failed')

    // Untouched process remains pending
    const { data: untouchedRow } = await testClient
      .from('processes').select('status').eq('id', untouchedProcess.id).single()
    expect(untouchedRow!.status).toBe('pending')
  })

  it('phase remains active after rejection (no regression)', async () => {
    const { clientId, phases, gates } = await createTestClientWithProcesses()
    const gate1 = gates[0]
    const phase1Processes = (await testClient
      .from('processes').select('id').eq('phase_id', gate1.phase_id)).data ?? []

    await testClient.rpc('reject_gate', {
      p_gate_id: gate1.id,
      p_client_id: clientId,
      p_failed_process_ids: [phase1Processes[0].id],
      p_notes: null,
    })

    // Phase 1 must still be active
    const { data: phase1 } = await testClient
      .from('phases').select('status').eq('id', phases[0].id).single()
    expect(phase1!.status).toBe('active')
  })

  it('gate can be re-approved after rejection (rejected -> approved)', async () => {
    const { clientId, gates, processes } = await createTestClientWithProcesses()
    const gate1 = gates[0]
    const phase1Processes = processes.filter(p => p.phase_id === gate1.phase_id)

    // Reject first
    await testClient.rpc('reject_gate', {
      p_gate_id: gate1.id,
      p_client_id: clientId,
      p_failed_process_ids: [phase1Processes[0].id],
      p_notes: null,
    })

    // Then approve
    const { error } = await testClient.rpc('approve_gate', {
      p_gate_id: gate1.id,
      p_client_id: clientId,
    })
    expect(error).toBeNull()

    const { data: updatedGate } = await testClient
      .from('quality_gates').select('status').eq('id', gate1.id).single()
    expect(updatedGate!.status).toBe('approved')
  })
})

describe('PIPE-04: Race condition protection', () => {
  it('concurrent approve_gate calls do not result in duplicate phase transitions', async () => {
    const { clientId, gates } = await createTestClientWithProcesses()
    const gate1 = gates[0]

    // Fire two approve_gate calls concurrently
    const [result1, result2] = await Promise.all([
      testClient.rpc('approve_gate', { p_gate_id: gate1.id, p_client_id: clientId }),
      testClient.rpc('approve_gate', { p_gate_id: gate1.id, p_client_id: clientId }),
    ])

    const errors = [result1.error, result2.error].filter(Boolean)
    const successes = [result1.error, result2.error].filter(e => e === null)

    // Exactly one must succeed and one must error (FOR UPDATE prevents double-processing)
    expect(successes).toHaveLength(1)
    expect(errors).toHaveLength(1)

    // Gate has exactly one reviewed_at timestamp (not duplicated)
    const { data: updatedGate } = await testClient
      .from('quality_gates').select('status, reviewed_at').eq('id', gate1.id).single()
    expect(updatedGate!.status).toBe('approved')
    expect(updatedGate!.reviewed_at).not.toBeNull()
  })
})
