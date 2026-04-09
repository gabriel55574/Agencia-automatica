/**
 * Phase 14: Unit tests for analytics date filtering and trend aggregation.
 *
 * Tests filterByDateRange and aggregateMonthlyTrends from aggregations.ts.
 * Uses vi.useFakeTimers for deterministic date-based filtering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { filterByDateRange, aggregateMonthlyTrends } from '@/lib/analytics/aggregations'
import { GATE_RATE_THRESHOLDS, getGateRateStatus } from '@/lib/analytics/constants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('GATE_RATE_THRESHOLDS', () => {
  it('has healthy = 80 and moderate = 50', () => {
    expect(GATE_RATE_THRESHOLDS.healthy).toBe(80)
    expect(GATE_RATE_THRESHOLDS.moderate).toBe(50)
  })
})

describe('getGateRateStatus', () => {
  it('returns healthy for rate >= 80', () => {
    expect(getGateRateStatus(80)).toBe('healthy')
    expect(getGateRateStatus(100)).toBe('healthy')
  })

  it('returns moderate for rate >= 50 and < 80', () => {
    expect(getGateRateStatus(50)).toBe('moderate')
    expect(getGateRateStatus(79)).toBe('moderate')
  })

  it('returns poor for rate < 50', () => {
    expect(getGateRateStatus(0)).toBe('poor')
    expect(getGateRateStatus(49)).toBe('poor')
  })
})

// ---------------------------------------------------------------------------
// filterByDateRange
// ---------------------------------------------------------------------------

describe('filterByDateRange', () => {
  const NOW = new Date('2026-03-15T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  interface TestItem {
    id: number
    date: string | null
  }

  const accessor = (item: TestItem) => item.date

  const items: TestItem[] = [
    { id: 1, date: '2026-03-14T00:00:00Z' }, // 1 day ago
    { id: 2, date: '2026-03-10T00:00:00Z' }, // 5 days ago
    { id: 3, date: '2026-03-01T00:00:00Z' }, // 14 days ago
    { id: 4, date: '2026-02-15T00:00:00Z' }, // 28 days ago
    { id: 5, date: '2026-01-01T00:00:00Z' }, // ~73 days ago
    { id: 6, date: '2025-06-01T00:00:00Z' }, // ~287 days ago
  ]

  it('returns only items from last 7 days for range "7d"', () => {
    const result = filterByDateRange('7d', items, accessor)
    expect(result.map((i) => i.id)).toEqual([1, 2])
  })

  it('returns only items from last 30 days for range "30d"', () => {
    const result = filterByDateRange('30d', items, accessor)
    expect(result.map((i) => i.id)).toEqual([1, 2, 3, 4])
  })

  it('returns only items from last 90 days for range "90d"', () => {
    const result = filterByDateRange('90d', items, accessor)
    expect(result.map((i) => i.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('returns all items unchanged for range "all"', () => {
    const result = filterByDateRange('all', items, accessor)
    expect(result).toEqual(items)
  })

  it('returns empty array for empty input', () => {
    const result = filterByDateRange('7d', [], accessor)
    expect(result).toEqual([])
  })

  it('excludes items with null date when accessor returns null', () => {
    const itemsWithNull: TestItem[] = [
      { id: 1, date: '2026-03-14T00:00:00Z' },
      { id: 2, date: null },
      { id: 3, date: '2026-03-10T00:00:00Z' },
    ]
    const result = filterByDateRange('7d', itemsWithNull, accessor)
    expect(result.map((i) => i.id)).toEqual([1, 3])
  })
})

// ---------------------------------------------------------------------------
// aggregateMonthlyTrends
// ---------------------------------------------------------------------------

describe('aggregateMonthlyTrends', () => {
  it('groups phase duration data by month and returns sorted TrendPoint[]', () => {
    const phases = [
      { completed_at: '2026-01-10T00:00:00Z', duration_days: 10 },
      { completed_at: '2026-01-20T00:00:00Z', duration_days: 20 },
      { completed_at: '2026-02-05T00:00:00Z', duration_days: 15 },
    ]
    const gates: Array<{ evaluated_at: string; first_pass: boolean }> = []

    const result = aggregateMonthlyTrends(phases, gates)

    expect(result).toHaveLength(2)
    expect(result[0].month).toBe('2026-01')
    expect(result[0].label).toBe('Jan')
    expect(result[0].avg_phase_duration).toBe(15) // (10 + 20) / 2
    expect(result[0].gate_approval_rate).toBeNull()

    expect(result[1].month).toBe('2026-02')
    expect(result[1].label).toBe('Feb')
    expect(result[1].avg_phase_duration).toBe(15)
    expect(result[1].gate_approval_rate).toBeNull()
  })

  it('groups gate approval data by month and returns sorted TrendPoint[]', () => {
    const phases: Array<{ completed_at: string; duration_days: number }> = []
    const gates = [
      { evaluated_at: '2026-01-05T00:00:00Z', first_pass: true },
      { evaluated_at: '2026-01-15T00:00:00Z', first_pass: false },
      { evaluated_at: '2026-01-25T00:00:00Z', first_pass: true },
      { evaluated_at: '2026-02-10T00:00:00Z', first_pass: false },
    ]

    const result = aggregateMonthlyTrends(phases, gates)

    expect(result).toHaveLength(2)
    expect(result[0].month).toBe('2026-01')
    // 2 first_pass out of 3 = 66.67 rounded to 2 decimals
    expect(result[0].gate_approval_rate).toBeCloseTo(66.67, 1)
    expect(result[0].avg_phase_duration).toBeNull()

    expect(result[1].month).toBe('2026-02')
    expect(result[1].gate_approval_rate).toBe(0) // 0 of 1
    expect(result[1].avg_phase_duration).toBeNull()
  })

  it('returns empty array for empty input', () => {
    const result = aggregateMonthlyTrends([], [])
    expect(result).toEqual([])
  })

  it('returns array of length 1 for single month', () => {
    const phases = [{ completed_at: '2026-03-15T00:00:00Z', duration_days: 7 }]
    const gates = [{ evaluated_at: '2026-03-20T00:00:00Z', first_pass: true }]

    const result = aggregateMonthlyTrends(phases, gates)

    expect(result).toHaveLength(1)
    expect(result[0].month).toBe('2026-03')
    expect(result[0].label).toBe('Mar')
    expect(result[0].avg_phase_duration).toBe(7)
    expect(result[0].gate_approval_rate).toBe(100)
  })

  it('merges phase and gate data into same month TrendPoints', () => {
    const phases = [
      { completed_at: '2026-01-10T00:00:00Z', duration_days: 12 },
    ]
    const gates = [
      { evaluated_at: '2026-01-15T00:00:00Z', first_pass: true },
      { evaluated_at: '2026-01-20T00:00:00Z', first_pass: true },
    ]

    const result = aggregateMonthlyTrends(phases, gates)

    expect(result).toHaveLength(1)
    expect(result[0].avg_phase_duration).toBe(12)
    expect(result[0].gate_approval_rate).toBe(100)
  })
})
