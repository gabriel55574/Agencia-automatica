import { describe, it, expect } from 'vitest'

/**
 * Test the stuck client threshold logic extracted from digest.ts
 * We replicate the threshold constants and test the detection formula.
 */
const STUCK_THRESHOLDS: Record<number, number> = {
  1: 14,
  2: 21,
  3: 14,
  4: 7,
  5: 30,
}

function isStuck(phaseNumber: number, startedAt: Date, now: Date): boolean {
  const diffDays = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24))
  const threshold = STUCK_THRESHOLDS[phaseNumber] || 14
  return diffDays > threshold
}

describe('stuck client detection', () => {
  const now = new Date('2026-04-09T12:00:00Z')

  it('detects stuck client in phase 1 after 14 days', () => {
    const startedAt = new Date('2026-03-25T00:00:00Z') // 15 days ago
    expect(isStuck(1, startedAt, now)).toBe(true)
  })

  it('does not flag client in phase 1 within 14 days', () => {
    const startedAt = new Date('2026-03-28T00:00:00Z') // 12 days ago
    expect(isStuck(1, startedAt, now)).toBe(false)
  })

  it('detects stuck client in phase 2 after 21 days', () => {
    const startedAt = new Date('2026-03-18T00:00:00Z') // 22 days ago
    expect(isStuck(2, startedAt, now)).toBe(true)
  })

  it('does not flag client in phase 2 within 21 days', () => {
    const startedAt = new Date('2026-03-22T00:00:00Z') // 18 days ago
    expect(isStuck(2, startedAt, now)).toBe(false)
  })

  it('detects stuck client in phase 4 after 7 days (shortest threshold)', () => {
    const startedAt = new Date('2026-04-01T00:00:00Z') // 8 days ago
    expect(isStuck(4, startedAt, now)).toBe(true)
  })

  it('does not flag client in phase 4 within 7 days', () => {
    const startedAt = new Date('2026-04-03T00:00:00Z') // 6 days ago
    expect(isStuck(4, startedAt, now)).toBe(false)
  })

  it('detects stuck client in phase 5 after 30 days (longest threshold)', () => {
    const startedAt = new Date('2026-03-09T00:00:00Z') // 31 days ago
    expect(isStuck(5, startedAt, now)).toBe(true)
  })

  it('uses default threshold of 14 for unknown phase numbers', () => {
    const startedAt = new Date('2026-03-25T00:00:00Z') // 15 days ago
    expect(isStuck(99, startedAt, now)).toBe(true)
  })
})

describe('DigestData shape validation', () => {
  it('STUCK_THRESHOLDS covers all 5 phases', () => {
    expect(Object.keys(STUCK_THRESHOLDS)).toHaveLength(5)
    expect(STUCK_THRESHOLDS[1]).toBeDefined()
    expect(STUCK_THRESHOLDS[2]).toBeDefined()
    expect(STUCK_THRESHOLDS[3]).toBeDefined()
    expect(STUCK_THRESHOLDS[4]).toBeDefined()
    expect(STUCK_THRESHOLDS[5]).toBeDefined()
  })

  it('all thresholds are positive integers', () => {
    for (const threshold of Object.values(STUCK_THRESHOLDS)) {
      expect(threshold).toBeGreaterThan(0)
      expect(Number.isInteger(threshold)).toBe(true)
    }
  })
})
