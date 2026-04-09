/**
 * Phase 14: Unit tests for analytics query aggregation functions.
 *
 * Tests computePhaseDurations, computeGateApprovalRates, and computeLifecycleMetrics.
 * Uses plain mock data objects -- NO Supabase mocking.
 */

import { describe, it, expect } from 'vitest'
import {
  computePhaseDurations,
  computeGateApprovalRates,
  computeLifecycleMetrics,
  buildTrendRawData,
} from '@/lib/analytics/queries'

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

function makePhaseRow(overrides: Partial<{
  id: string
  client_id: string
  phase_number: number
  status: string
  started_at: string | null
  completed_at: string | null
}> = {}) {
  return {
    id: overrides.id ?? 'phase-1',
    client_id: overrides.client_id ?? 'client-1',
    phase_number: overrides.phase_number ?? 1,
    status: overrides.status ?? 'completed',
    started_at: 'started_at' in overrides ? overrides.started_at! : '2026-01-01T00:00:00Z',
    completed_at: 'completed_at' in overrides ? overrides.completed_at! : '2026-01-11T00:00:00Z',
  }
}

function makeGateRow(overrides: Partial<{
  id: string
  client_id: string
  gate_number: number
  status: string
  phase_id: string
  reviewed_at: string | null
  updated_at: string
}> = {}) {
  return {
    id: overrides.id ?? 'gate-1',
    client_id: overrides.client_id ?? 'client-1',
    gate_number: overrides.gate_number ?? 1,
    status: overrides.status ?? 'approved',
    phase_id: overrides.phase_id ?? 'phase-1',
    reviewed_at: overrides.reviewed_at ?? '2026-01-12T00:00:00Z',
    updated_at: overrides.updated_at ?? '2026-01-12T00:00:00Z',
  }
}

function makeReviewRow(overrides: Partial<{
  id: string
  gate_id: string
  status: string
  created_at: string
}> = {}) {
  return {
    id: overrides.id ?? 'review-1',
    gate_id: overrides.gate_id ?? 'gate-1',
    status: overrides.status ?? 'completed',
    created_at: overrides.created_at ?? '2026-01-12T00:00:00Z',
  }
}

function makeClientRow(overrides: Partial<{
  id: string
  name: string
  created_at: string
  status: string
}> = {}) {
  return {
    id: overrides.id ?? 'client-1',
    name: overrides.name ?? 'Test Client',
    created_at: overrides.created_at ?? '2026-01-01T00:00:00Z',
    status: overrides.status ?? 'active',
  }
}

// ---------------------------------------------------------------------------
// computePhaseDurations
// ---------------------------------------------------------------------------

describe('computePhaseDurations', () => {
  it('returns avg days per phase for completed phases with started_at and completed_at', () => {
    const phases = [
      makePhaseRow({
        id: 'p1a', client_id: 'c1', phase_number: 1,
        status: 'completed', started_at: '2026-01-01T00:00:00Z', completed_at: '2026-01-11T00:00:00Z',
      }),
      makePhaseRow({
        id: 'p1b', client_id: 'c2', phase_number: 1,
        status: 'completed', started_at: '2026-02-01T00:00:00Z', completed_at: '2026-02-21T00:00:00Z',
      }),
    ]

    const result = computePhaseDurations(phases)
    const phase1 = result.find((r) => r.phase_number === 1)!

    // (10 + 20) / 2 = 15
    expect(phase1.avg_days).toBe(15)
    expect(phase1.completed_count).toBe(2)
    expect(phase1.phase_name).toBe('Diagnostico')
  })

  it('excludes phases where started_at or completed_at is null', () => {
    const phases = [
      makePhaseRow({
        id: 'p1', phase_number: 1,
        status: 'completed', started_at: null, completed_at: '2026-01-11T00:00:00Z',
      }),
      makePhaseRow({
        id: 'p2', phase_number: 1,
        status: 'completed', started_at: '2026-01-01T00:00:00Z', completed_at: null,
      }),
      makePhaseRow({
        id: 'p3', phase_number: 1,
        status: 'completed', started_at: '2026-01-01T00:00:00Z', completed_at: '2026-01-06T00:00:00Z',
      }),
    ]

    const result = computePhaseDurations(phases)
    const phase1 = result.find((r) => r.phase_number === 1)!

    expect(phase1.completed_count).toBe(1)
    expect(phase1.avg_days).toBe(5)
  })

  it('returns entries for all 5 phases with 0 avg if no data', () => {
    const result = computePhaseDurations([])
    expect(result).toHaveLength(5)

    for (const entry of result) {
      expect(entry.avg_days).toBe(0)
      expect(entry.completed_count).toBe(0)
    }

    expect(result[0].phase_number).toBe(1)
    expect(result[4].phase_number).toBe(5)
  })

  it('excludes non-completed phases', () => {
    const phases = [
      makePhaseRow({
        id: 'p1', phase_number: 2,
        status: 'active', started_at: '2026-01-01T00:00:00Z', completed_at: '2026-01-11T00:00:00Z',
      }),
    ]

    const result = computePhaseDurations(phases)
    const phase2 = result.find((r) => r.phase_number === 2)!

    expect(phase2.avg_days).toBe(0)
    expect(phase2.completed_count).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computeGateApprovalRates
// ---------------------------------------------------------------------------

describe('computeGateApprovalRates', () => {
  it('counts gates with exactly 1 review and approved status as first-pass', () => {
    const gates = [
      makeGateRow({ id: 'g1', gate_number: 1, status: 'approved' }),
      makeGateRow({ id: 'g2', gate_number: 1, status: 'approved' }),
    ]
    const reviews = [
      makeReviewRow({ id: 'r1', gate_id: 'g1' }), // 1 review -> first pass
      makeReviewRow({ id: 'r2', gate_id: 'g2' }),
      makeReviewRow({ id: 'r3', gate_id: 'g2' }), // 2 reviews -> not first pass
    ]

    const result = computeGateApprovalRates(gates, reviews)
    const gate1 = result.find((r) => r.gate_number === 1)!

    // 1 first-pass out of 2 evaluated = 50%
    expect(gate1.first_pass_count).toBe(1)
    expect(gate1.total_evaluated).toBe(2)
    expect(gate1.rate).toBe(50)
  })

  it('returns entries for all 4 gates with 0 rate if no data', () => {
    const result = computeGateApprovalRates([], [])
    expect(result).toHaveLength(4)

    for (const entry of result) {
      expect(entry.rate).toBe(0)
      expect(entry.first_pass_count).toBe(0)
      expect(entry.total_evaluated).toBe(0)
    }

    expect(result[0].gate_number).toBe(1)
    expect(result[3].gate_number).toBe(4)
  })

  it('does not count pending gates as evaluated', () => {
    const gates = [
      makeGateRow({ id: 'g1', gate_number: 2, status: 'pending' }),
      makeGateRow({ id: 'g2', gate_number: 2, status: 'approved' }),
    ]
    const reviews = [
      makeReviewRow({ id: 'r1', gate_id: 'g2' }),
    ]

    const result = computeGateApprovalRates(gates, reviews)
    const gate2 = result.find((r) => r.gate_number === 2)!

    expect(gate2.total_evaluated).toBe(1)
    expect(gate2.first_pass_count).toBe(1)
    expect(gate2.rate).toBe(100)
  })

  it('counts rejected gates as evaluated but not first-pass', () => {
    const gates = [
      makeGateRow({ id: 'g1', gate_number: 3, status: 'rejected' }),
    ]
    const reviews = [
      makeReviewRow({ id: 'r1', gate_id: 'g1' }),
    ]

    const result = computeGateApprovalRates(gates, reviews)
    const gate3 = result.find((r) => r.gate_number === 3)!

    expect(gate3.total_evaluated).toBe(1)
    expect(gate3.first_pass_count).toBe(0)
    expect(gate3.rate).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computeLifecycleMetrics
// ---------------------------------------------------------------------------

describe('computeLifecycleMetrics', () => {
  it('calculates duration from client.created_at to Phase 5 completed_at', () => {
    const clients = [
      makeClientRow({ id: 'c1', name: 'Client A', created_at: '2026-01-01T00:00:00Z' }),
    ]
    const phases = [
      makePhaseRow({
        id: 'p5', client_id: 'c1', phase_number: 5,
        status: 'completed', completed_at: '2026-04-01T00:00:00Z',
      }),
    ]

    const result = computeLifecycleMetrics(clients, phases)

    expect(result.completed_clients).toHaveLength(1)
    expect(result.completed_clients[0].client_id).toBe('c1')
    expect(result.completed_clients[0].client_name).toBe('Client A')
    // Jan 1 to Apr 1 = 90 days
    expect(result.completed_clients[0].duration_days).toBe(90)
    expect(result.avg_days).toBe(90)
  })

  it('excludes clients without a completed Phase 5', () => {
    const clients = [
      makeClientRow({ id: 'c1', name: 'Client A', created_at: '2026-01-01T00:00:00Z' }),
      makeClientRow({ id: 'c2', name: 'Client B', created_at: '2026-01-01T00:00:00Z' }),
    ]
    const phases = [
      // c1 has Phase 5 but status is 'active'
      makePhaseRow({
        id: 'p5a', client_id: 'c1', phase_number: 5,
        status: 'active', completed_at: null,
      }),
      // c2 has no Phase 5 row at all
      makePhaseRow({
        id: 'p3', client_id: 'c2', phase_number: 3,
        status: 'completed', completed_at: '2026-02-01T00:00:00Z',
      }),
    ]

    const result = computeLifecycleMetrics(clients, phases)

    expect(result.completed_clients).toHaveLength(0)
    expect(result.avg_days).toBe(0)
  })

  it('returns avg_days = 0 and empty clients when no completions', () => {
    const result = computeLifecycleMetrics([], [])

    expect(result.avg_days).toBe(0)
    expect(result.completed_clients).toEqual([])
  })

  it('calculates correct average with multiple completed clients', () => {
    const clients = [
      makeClientRow({ id: 'c1', name: 'A', created_at: '2026-01-01T00:00:00Z' }),
      makeClientRow({ id: 'c2', name: 'B', created_at: '2026-01-01T00:00:00Z' }),
    ]
    const phases = [
      makePhaseRow({
        id: 'p5a', client_id: 'c1', phase_number: 5,
        status: 'completed', completed_at: '2026-02-10T00:00:00Z', // 40 days
      }),
      makePhaseRow({
        id: 'p5b', client_id: 'c2', phase_number: 5,
        status: 'completed', completed_at: '2026-03-02T00:00:00Z', // 60 days
      }),
    ]

    const result = computeLifecycleMetrics(clients, phases)

    expect(result.completed_clients).toHaveLength(2)
    expect(result.avg_days).toBe(50) // (40 + 60) / 2
  })
})

// ---------------------------------------------------------------------------
// buildTrendRawData
// ---------------------------------------------------------------------------

describe('buildTrendRawData', () => {
  it('builds phase trend rows from completed phases with durations', () => {
    const phases = [
      makePhaseRow({
        id: 'p1', phase_number: 2, status: 'completed',
        started_at: '2026-01-01T00:00:00Z', completed_at: '2026-01-11T00:00:00Z',
      }),
    ]

    const result = buildTrendRawData(phases, [], [])

    expect(result.phases).toHaveLength(1)
    expect(result.phases[0].phase_number).toBe(2)
    expect(result.phases[0].duration_days).toBe(10)
    expect(result.phases[0].completed_at).toBe('2026-01-11T00:00:00Z')
  })

  it('builds gate trend rows with first_pass flag', () => {
    const gates = [
      makeGateRow({ id: 'g1', gate_number: 1, status: 'approved' }),
      makeGateRow({ id: 'g2', gate_number: 2, status: 'rejected' }),
    ]
    const reviews = [
      makeReviewRow({ id: 'r1', gate_id: 'g1' }), // 1 review, approved -> first pass
      makeReviewRow({ id: 'r2', gate_id: 'g2' }), // 1 review, but rejected -> not first pass
    ]

    const result = buildTrendRawData([], gates, reviews)

    expect(result.gates).toHaveLength(2)
    const g1 = result.gates.find((g) => g.gate_number === 1)!
    const g2 = result.gates.find((g) => g.gate_number === 2)!

    expect(g1.first_pass).toBe(true)
    expect(g2.first_pass).toBe(false)
  })

  it('returns empty arrays for empty inputs', () => {
    const result = buildTrendRawData([], [], [])
    expect(result.phases).toEqual([])
    expect(result.gates).toEqual([])
  })
})
