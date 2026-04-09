/**
 * Agency OS: Daily digest data fetcher
 *
 * Queries Supabase for the data needed to compose the daily digest email.
 * Runs in the worker process context using the admin client.
 * Similar queries to fetchDashboardData but optimized for the digest format.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { PHASE_NAMES, type PhaseNumber } from '../database/enums'
import type { DigestData, DigestClientPhase, DigestStuckClient } from './types'

/** Days in phase before a client is considered "stuck" (same as dashboard) */
const STUCK_THRESHOLDS: Record<number, number> = {
  1: 14,
  2: 21,
  3: 14,
  4: 7,
  5: 30,
}

/**
 * Fetch all data needed for the daily digest email (NOTF-03).
 *
 * @param supabase - Admin Supabase client (service role)
 * @returns DigestData ready to pass to dailyDigestTemplate
 */
export async function fetchDigestData(supabase: SupabaseClient): Promise<DigestData> {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  // Run all queries in parallel
  const [clientsResult, phasesResult, gatesResult, yesterdayJobsResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, company, current_phase_number, status')
      .eq('status', 'active'),
    supabase
      .from('phases')
      .select('id, client_id, phase_number, status, started_at'),
    supabase
      .from('quality_gates')
      .select('id, client_id, status'),
    supabase
      .from('squad_jobs')
      .select('id')
      .eq('status', 'completed')
      .gte('completed_at', yesterday.toISOString())
      .lt('completed_at', todayStart.toISOString()),
  ])

  const clients = clientsResult.data ?? []
  const phases = phasesResult.data ?? []
  const gates = gatesResult.data ?? []
  const yesterdayJobs = yesterdayJobsResult.data ?? []

  // Clients by phase
  const phaseCountMap = new Map<number, number>()
  for (const client of clients) {
    const pn = client.current_phase_number
    phaseCountMap.set(pn, (phaseCountMap.get(pn) || 0) + 1)
  }

  const clients_by_phase: DigestClientPhase[] = ([1, 2, 3, 4, 5] as PhaseNumber[]).map((num) => ({
    phase_number: num,
    phase_name: PHASE_NAMES[num],
    count: phaseCountMap.get(num) || 0,
  }))

  // Pending approvals
  const pending_approvals = gates.filter(
    (g) => g.status === 'pending' || g.status === 'evaluating'
  ).length

  // Failed gates
  const failed_gates = gates.filter((g) => g.status === 'rejected').length

  // Stuck clients
  const stuck_clients: DigestStuckClient[] = []
  for (const client of clients) {
    const currentPhase = phases.find(
      (p) => p.client_id === client.id && p.phase_number === client.current_phase_number
    )
    if (!currentPhase?.started_at) continue

    const startedAt = new Date(currentPhase.started_at)
    const diffDays = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24))
    const threshold = STUCK_THRESHOLDS[client.current_phase_number] || 14

    if (diffDays > threshold) {
      stuck_clients.push({
        name: client.name,
        company: client.company,
        phase: PHASE_NAMES[client.current_phase_number as PhaseNumber] || `Phase ${client.current_phase_number}`,
        days_stuck: diffDays,
      })
    }
  }

  // Sort stuck clients by days_stuck descending
  stuck_clients.sort((a, b) => b.days_stuck - a.days_stuck)

  // Format date
  const dateStr = now.toISOString().split('T')[0]

  return {
    date: dateStr,
    clients_by_phase,
    pending_approvals,
    failed_gates,
    stuck_clients,
    yesterday_completed_runs: yesterdayJobs.length,
    total_active_clients: clients.length,
  }
}
