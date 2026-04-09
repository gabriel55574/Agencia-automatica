import { testClient, cleanTestData } from '../setup'

export { cleanTestData }

export async function createTestClientWithProcesses() {
  const { data: clientId, error } = await testClient.rpc('create_client_with_phases', {
    p_name: 'Pipeline Test Client',
    p_company: 'Test Co',
    p_briefing: { niche: 'SaaS', target_audience: 'CTOs', additional_context: null },
  })
  if (error || !clientId) throw new Error('Failed to create test client: ' + error?.message)

  const [{ data: phases }, { data: processes }, { data: gates }] = await Promise.all([
    testClient.from('phases').select('*').eq('client_id', clientId).order('phase_number'),
    testClient.from('processes').select('*').eq('client_id', clientId).order('process_number'),
    testClient.from('quality_gates').select('*').eq('client_id', clientId).order('gate_number'),
  ])

  return { clientId: clientId as string, phases: phases ?? [], processes: processes ?? [], gates: gates ?? [] }
}
