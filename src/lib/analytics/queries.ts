/**
 * Phase 14: Server-side Supabase analytics queries.
 *
 * Main entry point: `fetchAnalyticsData()` runs parallel queries then
 * delegates to pure compute functions for aggregation.
 *
 * The pure compute functions (computePhaseDurations, computeGateApprovalRates,
 * computeLifecycleMetrics, buildTrendRawData) are exported for unit testing.
 */

import { createClient } from '@/lib/supabase/server'
import { PHASE_NAMES, type PhaseNumber } from '@/lib/database/enums'
import type { AnalyticsData, PhaseDuration, GateApprovalRate, LifecycleMetric } from './types'

// ---------------------------------------------------------------------------
// Internal row types (match exact select() column sets)
// ---------------------------------------------------------------------------

interface PhaseRow {
  id: string
  client_id: string
  phase_number: number
  status: string
  started_at: string | null
  completed_at: string | null
}

interface GateRow {
  id: string
  client_id: string
  gate_number: number
  status: string
  phase_id: string
  reviewed_at: string | null
  updated_at: string
}

interface ReviewRow {
  id: string
  gate_id: string
  status: string
  created_at: string
}

interface ClientRow {
  id: string
  name: string
  created_at: string
  status: string
}

// ---------------------------------------------------------------------------
// Main query function
// ---------------------------------------------------------------------------

/**
 * Fetch all analytics data from Supabase via parallel queries,
 * then aggregate in TypeScript.
 */
export async function fetchAnalyticsData(): Promise<AnalyticsData> {
  const supabase = await createClient()

  const [phasesResult, gatesResult, reviewsResult, clientsResult] = await Promise.all([
    supabase.from('phases').select('id, client_id, phase_number, status, started_at, completed_at'),
    supabase.from('quality_gates').select('id, client_id, gate_number, status, phase_id, reviewed_at, updated_at'),
    supabase.from('gate_reviews').select('id, gate_id, status, created_at'),
    supabase.from('clients').select('id, name, created_at, status'),
  ])

  const phases = (phasesResult.data ?? []) as PhaseRow[]
  const gates = (gatesResult.data ?? []) as GateRow[]
  const reviews = (reviewsResult.data ?? []) as ReviewRow[]
  const clients = (clientsResult.data ?? []) as ClientRow[]

  return {
    phase_durations: computePhaseDurations(phases),
    gate_approval_rates: computeGateApprovalRates(gates, reviews),
    lifecycle: computeLifecycleMetrics(clients, phases),
    trend_data: buildTrendRawData(phases, gates, reviews),
  }
}

// ---------------------------------------------------------------------------
// Pure compute functions (exported for unit testing)
// ---------------------------------------------------------------------------

/** Milliseconds in one day. */
const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Compute average days spent in each phase (1-5) for completed phases.
 *
 * Only phases with status='completed' AND non-null started_at/completed_at
 * are counted. Returns all 5 phases with 0 avg / 0 count when no data exists.
 */
export function computePhaseDurations(phases: PhaseRow[]): PhaseDuration[] {
  // Group completed phases by phase_number
  const byPhase = new Map<number, number[]>()

  for (const phase of phases) {
    if (phase.status !== 'completed') continue
    if (!phase.started_at || !phase.completed_at) continue

    const started = new Date(phase.started_at).getTime()
    const completed = new Date(phase.completed_at).getTime()
    const days = Math.round((completed - started) / MS_PER_DAY)

    const existing = byPhase.get(phase.phase_number) ?? []
    existing.push(days)
    byPhase.set(phase.phase_number, existing)
  }

  // Build results for all 5 phases
  return ([1, 2, 3, 4, 5] as PhaseNumber[]).map((num) => {
    const durations = byPhase.get(num) ?? []
    const avg = durations.length > 0
      ? Math.round((durations.reduce((sum, d) => sum + d, 0) / durations.length) * 100) / 100
      : 0

    return {
      phase_number: num,
      phase_name: PHASE_NAMES[num],
      avg_days: avg,
      completed_count: durations.length,
    }
  })
}

/**
 * Compute first-pass approval rate for each quality gate (1-4).
 *
 * A gate is "evaluated" if its status is not 'pending'.
 * A gate "passed first try" if it has exactly 1 review AND status='approved'.
 * Returns all 4 gates with 0 rate / 0 counts when no data exists.
 */
export function computeGateApprovalRates(
  gates: GateRow[],
  reviews: ReviewRow[]
): GateApprovalRate[] {
  // Build review count per gate_id
  const reviewCounts = new Map<string, number>()
  for (const review of reviews) {
    reviewCounts.set(review.gate_id, (reviewCounts.get(review.gate_id) ?? 0) + 1)
  }

  // Group evaluated gates by gate_number
  const byGate = new Map<number, { total: number; firstPass: number }>()

  for (const gate of gates) {
    if (gate.status === 'pending') continue // not evaluated

    const gateNum = gate.gate_number
    const stats = byGate.get(gateNum) ?? { total: 0, firstPass: 0 }
    stats.total += 1

    // First-pass: exactly 1 review AND status is 'approved'
    const numReviews = reviewCounts.get(gate.id) ?? 0
    if (numReviews === 1 && gate.status === 'approved') {
      stats.firstPass += 1
    }

    byGate.set(gateNum, stats)
  }

  // Phase names for gates 1-4 (gate N sits after phase N)
  const gatePhaseNames: Record<number, string> = {
    1: PHASE_NAMES[1],
    2: PHASE_NAMES[2],
    3: PHASE_NAMES[3],
    4: PHASE_NAMES[4],
  }

  return [1, 2, 3, 4].map((num) => {
    const stats = byGate.get(num) ?? { total: 0, firstPass: 0 }
    const rate = stats.total > 0
      ? Math.round((stats.firstPass / stats.total) * 10000) / 100
      : 0

    return {
      gate_number: num,
      phase_name: gatePhaseNames[num],
      first_pass_count: stats.firstPass,
      total_evaluated: stats.total,
      rate,
    }
  })
}

/**
 * Compute lifecycle metrics: average time from client creation to Phase 5 completion.
 *
 * Only clients with a completed Phase 5 (status='completed', non-null completed_at)
 * are included. Returns avg_days=0 and empty list when no completions exist.
 */
export function computeLifecycleMetrics(
  clients: ClientRow[],
  phases: PhaseRow[]
): LifecycleMetric {
  // Find completed Phase 5 rows
  const phase5Map = new Map<string, PhaseRow>()
  for (const phase of phases) {
    if (phase.phase_number === 5 && phase.status === 'completed' && phase.completed_at) {
      phase5Map.set(phase.client_id, phase)
    }
  }

  const completedClients = clients
    .filter((client) => phase5Map.has(client.id))
    .map((client) => {
      const phase5 = phase5Map.get(client.id)!
      const created = new Date(client.created_at).getTime()
      const completed = new Date(phase5.completed_at!).getTime()
      const durationDays = Math.round((completed - created) / MS_PER_DAY)

      return {
        client_id: client.id,
        client_name: client.name,
        duration_days: durationDays,
        completed_at: phase5.completed_at!,
      }
    })
    .sort((a, b) => a.completed_at.localeCompare(b.completed_at))

  const avgDays = completedClients.length > 0
    ? Math.round(
        (completedClients.reduce((sum, c) => sum + c.duration_days, 0) / completedClients.length) * 100
      ) / 100
    : 0

  return {
    avg_days: avgDays,
    completed_clients: completedClients,
  }
}

/**
 * Build raw trend data rows for client-side aggregation.
 *
 * Produces pre-computed arrays that `aggregateMonthlyTrends` can consume
 * after the client applies a date range filter.
 */
export function buildTrendRawData(
  phases: PhaseRow[],
  gates: GateRow[],
  reviews: ReviewRow[]
): AnalyticsData['trend_data'] {
  // Build review count per gate_id
  const reviewCounts = new Map<string, number>()
  for (const review of reviews) {
    reviewCounts.set(review.gate_id, (reviewCounts.get(review.gate_id) ?? 0) + 1)
  }

  // Phase trend rows: completed phases with duration
  const phaseTrends = phases
    .filter((p) => p.status === 'completed' && p.started_at && p.completed_at)
    .map((p) => {
      const started = new Date(p.started_at!).getTime()
      const completed = new Date(p.completed_at!).getTime()
      const durationDays = Math.round((completed - started) / MS_PER_DAY)

      return {
        phase_number: p.phase_number,
        completed_at: p.completed_at!,
        duration_days: durationDays,
      }
    })

  // Gate trend rows: evaluated gates with first_pass flag
  const gateTrends = gates
    .filter((g) => g.status !== 'pending')
    .map((g) => {
      const numReviews = reviewCounts.get(g.id) ?? 0
      const firstPass = numReviews === 1 && g.status === 'approved'
      // Use reviewed_at if available, otherwise updated_at as evaluation timestamp
      const evaluatedAt = g.reviewed_at ?? g.updated_at

      return {
        gate_number: g.gate_number,
        evaluated_at: evaluatedAt,
        first_pass: firstPass,
      }
    })

  return {
    phases: phaseTrends,
    gates: gateTrends,
  }
}
