import { describe, it, expect, beforeEach } from 'vitest'
import { testClient, cleanTestData } from '../setup'

describe('Client DB operations (CLNT-01 through CLNT-04)', () => {
  beforeEach(async () => {
    await cleanTestData()
  })

  // ---- CLNT-01: Atomic creation via RPC ----

  it('CLNT-01: create_client_with_phases RPC creates 1 client + 5 phase rows', async () => {
    const { data: clientId, error } = await testClient.rpc('create_client_with_phases', {
      p_name: 'Test Client',
      p_company: 'Test Co',
      p_briefing: { niche: 'SaaS', target_audience: 'CTOs', additional_context: null },
    })

    expect(error).toBeNull()
    expect(clientId).toBeTruthy()

    // Verify 1 client row
    const { data: client } = await testClient
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    expect(client).toBeTruthy()
    expect(client!.name).toBe('Test Client')
    expect(client!.company).toBe('Test Co')
    expect(client!.current_phase_number).toBe(1)
    expect(client!.status).toBe('active')

    // Verify 5 phase rows
    const { data: phases } = await testClient
      .from('phases')
      .select('*')
      .eq('client_id', clientId)
      .order('phase_number')
    expect(phases).toHaveLength(5)

    // Verify 16 process rows
    const { data: processes } = await testClient
      .from('processes')
      .select('*')
      .eq('client_id', clientId)
      .order('process_number')
    expect(processes).toHaveLength(16)
    expect(processes![0].process_number).toBe(1)
    expect(processes![15].process_number).toBe(16)

    // Verify 4 quality_gate rows
    const { data: gates } = await testClient
      .from('quality_gates')
      .select('*')
      .eq('client_id', clientId)
      .order('gate_number')
    expect(gates).toHaveLength(4)
    expect(gates![0].gate_number).toBe(1)
    expect(gates![0].status).toBe('pending')
  })

  it('CLNT-01: Phase 1 is active with started_at; phases 2-5 are pending with null started_at', async () => {
    const { data: clientId } = await testClient.rpc('create_client_with_phases', {
      p_name: 'Phase Status Test',
      p_company: 'Test Co',
      p_briefing: null,
    })

    const { data: phases } = await testClient
      .from('phases')
      .select('phase_number, status, started_at, name')
      .eq('client_id', clientId)
      .order('phase_number')

    expect(phases![0].phase_number).toBe(1)
    expect(phases![0].status).toBe('active')
    expect(phases![0].started_at).not.toBeNull()
    expect(phases![0].name).toBe('Diagnostico')

    for (let i = 1; i < 5; i++) {
      expect(phases![i].status).toBe('pending')
      expect(phases![i].started_at).toBeNull()
    }

    expect(phases![1].name).toBe('Engenharia de Valor')
    expect(phases![2].name).toBe('Go-to-Market')
    expect(phases![3].name).toBe('Tracao e Vendas')
    expect(phases![4].name).toBe('Retencao e Escala')
  })

  it('CLNT-01: briefing column stores the correct JSON shape', async () => {
    const briefing = { niche: 'Retail', target_audience: 'SMBs', additional_context: 'Focus on loyalty' }
    const { data: clientId } = await testClient.rpc('create_client_with_phases', {
      p_name: 'Briefing Test',
      p_company: 'BriefCo',
      p_briefing: briefing,
    })

    const { data: client } = await testClient
      .from('clients')
      .select('briefing')
      .eq('id', clientId)
      .single()

    expect(client!.briefing).toEqual(briefing)
  })

  // ---- CLNT-02: Read operations ----

  it('CLNT-02: fetching client by ID returns the client row', async () => {
    const { data: clientId } = await testClient.rpc('create_client_with_phases', {
      p_name: 'Read Test',
      p_company: 'ReadCo',
      p_briefing: null,
    })

    const { data: client, error } = await testClient
      .from('clients')
      .select('id, name, company, status, current_phase_number')
      .eq('id', clientId)
      .single()

    expect(error).toBeNull()
    expect(client!.id).toBe(clientId)
    expect(client!.name).toBe('Read Test')
  })

  it('CLNT-02: fetching phases by client_id returns exactly 5 rows in order', async () => {
    const { data: clientId } = await testClient.rpc('create_client_with_phases', {
      p_name: 'Phases Test',
      p_company: 'PhaseCo',
      p_briefing: null,
    })

    const { data: phases, error } = await testClient
      .from('phases')
      .select('phase_number, status, name')
      .eq('client_id', clientId)
      .order('phase_number', { ascending: true })

    expect(error).toBeNull()
    expect(phases).toHaveLength(5)
    expect(phases!.map(p => p.phase_number)).toEqual([1, 2, 3, 4, 5])
  })

  // ---- CLNT-03: Edit without touching pipeline ----

  it('CLNT-03: updating name/company/briefing does NOT change current_phase_number', async () => {
    const { data: clientId } = await testClient.rpc('create_client_with_phases', {
      p_name: 'Original Name',
      p_company: 'Original Co',
      p_briefing: { niche: 'Original', target_audience: 'Original audience', additional_context: null },
    })

    const { error: updateError } = await testClient
      .from('clients')
      .update({
        name: 'Updated Name',
        company: 'Updated Co',
        briefing: { niche: 'Updated', target_audience: 'New audience', additional_context: 'new context' },
      })
      .eq('id', clientId)

    expect(updateError).toBeNull()

    const { data: updated } = await testClient
      .from('clients')
      .select('name, company, briefing, current_phase_number')
      .eq('id', clientId)
      .single()

    expect(updated!.name).toBe('Updated Name')
    expect(updated!.company).toBe('Updated Co')
    expect(updated!.current_phase_number).toBe(1)  // MUST still be 1
  })

  // ---- CLNT-04: Archive / restore ----

  it('CLNT-04: archiving sets status to archived, row is preserved', async () => {
    const { data: clientId } = await testClient.rpc('create_client_with_phases', {
      p_name: 'Archive Test',
      p_company: 'ArchiveCo',
      p_briefing: null,
    })

    const { error: archiveError } = await testClient
      .from('clients')
      .update({ status: 'archived' })
      .eq('id', clientId)

    expect(archiveError).toBeNull()

    const { data: client } = await testClient
      .from('clients')
      .select('id, status')
      .eq('id', clientId)
      .single()

    expect(client!.status).toBe('archived')
    expect(client!.id).toBe(clientId)  // row preserved
  })

  it('CLNT-04: restoring sets status back to active', async () => {
    const { data: clientId } = await testClient.rpc('create_client_with_phases', {
      p_name: 'Restore Test',
      p_company: 'RestoreCo',
      p_briefing: null,
    })

    await testClient.from('clients').update({ status: 'archived' }).eq('id', clientId)
    await testClient.from('clients').update({ status: 'active' }).eq('id', clientId)

    const { data: client } = await testClient
      .from('clients')
      .select('status')
      .eq('id', clientId)
      .single()

    expect(client!.status).toBe('active')
  })
})
