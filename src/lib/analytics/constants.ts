/**
 * Phase 14: Analytics constants.
 *
 * Threshold values for gate approval rate color coding
 * and utility to classify a rate into a status category.
 */

export const GATE_RATE_THRESHOLDS = { healthy: 80, moderate: 50 } as const

export type GateRateStatus = 'healthy' | 'moderate' | 'poor'

/**
 * Classify a gate approval rate (0-100) into a health status.
 *
 * - healthy: >= 80%
 * - moderate: >= 50%
 * - poor: < 50%
 */
export function getGateRateStatus(rate: number): GateRateStatus {
  if (rate >= GATE_RATE_THRESHOLDS.healthy) return 'healthy'
  if (rate >= GATE_RATE_THRESHOLDS.moderate) return 'moderate'
  return 'poor'
}
