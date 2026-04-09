import { createClient } from '@/lib/supabase/server'
import { PHASE_NAMES, type PhaseNumber } from '@/lib/database/enums'
import { BOTTLENECK_THRESHOLDS } from './constants'
import type { DashboardClient, DashboardData, PhaseColumn } from './types'

/**
 * Fetch all data needed for the Kanban dashboard.
 *
 * Performs 5 parallel queries (clients, phases, processes, quality_gates, squad_jobs),
 * then enriches each client with derived fields and groups them into phase columns.
 */
export async function fetchDashboardData(showArchived: boolean): Promise<DashboardData> {
  const supabase = await createClient()

  // Build clients query — filter by status unless showing archived
  const clientsQuery = supabase
    .from('clients')
    .select('id, name, company, current_phase_number, status, updated_at, created_at')
    .order('updated_at', { ascending: false })

  if (!showArchived) {
    clientsQuery.eq('status', 'active')
  }

  // Run all queries in parallel
  const [clientsResult, phasesResult, processesResult, gatesResult, jobsResult] =
    await Promise.all([
      clientsQuery,
      supabase.from('phases').select('id, client_id, phase_number, status, started_at'),
      supabase.from('processes').select('id, client_id, process_number, status, phase_id'),
      supabase.from('quality_gates').select('id, client_id, gate_number, status, phase_id'),
      supabase
        .from('squad_jobs')
        .select('id, client_id, status')
        .in('status', ['queued', 'running']),
    ])

  const clients = clientsResult.data ?? []
  const phases = phasesResult.data ?? []
  const processes = processesResult.data ?? []
  const gates = gatesResult.data ?? []
  const runningJobs = jobsResult.data ?? []

  // Build lookup maps for efficient enrichment
  const runningJobClientIds = new Set(runningJobs.map((j) => j.client_id))

  // Enrich each client
  const now = new Date()
  const enrichedClients: DashboardClient[] = clients.map((client) => {
    const phaseNumber = client.current_phase_number as PhaseNumber

    // Find the phase row matching client's current phase
    const currentPhase = phases.find(
      (p) => p.client_id === client.id && p.phase_number === phaseNumber
    )

    // Find highest active/completed process in the current phase
    const phaseProcesses = processes.filter(
      (p) =>
        p.client_id === client.id &&
        currentPhase &&
        p.phase_id === currentPhase.id &&
        (p.status === 'active' || p.status === 'completed')
    )
    const highestProcess =
      phaseProcesses.length > 0
        ? Math.max(...phaseProcesses.map((p) => p.process_number))
        : null

    // Find gate for the current phase
    const currentGate = gates.find(
      (g) => g.client_id === client.id && currentPhase && g.phase_id === currentPhase.id
    )

    return {
      id: client.id,
      name: client.name,
      company: client.company,
      current_phase_number: phaseNumber,
      status: client.status as 'active' | 'archived',
      updated_at: client.updated_at,
      created_at: client.created_at,
      current_process_number: highestProcess,
      gate_status: (currentGate?.status as DashboardClient['gate_status']) ?? null,
      has_running_job: runningJobClientIds.has(client.id),
      phase_started_at: currentPhase?.started_at ?? null,
    }
  })

  // Build 5 phase columns
  const columns: PhaseColumn[] = ([1, 2, 3, 4, 5] as PhaseNumber[]).map((num) => ({
    phase_number: num,
    phase_name: PHASE_NAMES[num],
    clients: enrichedClients.filter((c) => c.current_phase_number === num),
  }))

  // Calculate stuck clients (phase_started_at older than threshold)
  const stuckClients = enrichedClients.filter((client) => {
    if (!client.phase_started_at) return false
    const startedAt = new Date(client.phase_started_at)
    const thresholdDays = BOTTLENECK_THRESHOLDS[client.current_phase_number]
    const diffMs = now.getTime() - startedAt.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays > thresholdDays
  })

  return { columns, stuckClients }
}
