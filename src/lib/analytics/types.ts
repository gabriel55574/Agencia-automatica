/**
 * Phase 14: Analytics data layer type definitions.
 *
 * All types consumed by the analytics UI (Plan 02) and produced by
 * the query / aggregation functions in this module.
 */

import type { PhaseNumber } from '@/lib/database/enums'

// ---------------------------------------------------------------------------
// Date range filter
// ---------------------------------------------------------------------------

/** Supported date range filter values for analytics views. */
export type DateRange = '7d' | '30d' | '90d' | 'all'

// ---------------------------------------------------------------------------
// Phase duration metrics (ANLY-01)
// ---------------------------------------------------------------------------

/** Average time spent in a single phase across all completed clients. */
export interface PhaseDuration {
  phase_number: PhaseNumber
  phase_name: string
  avg_days: number
  completed_count: number
}

// ---------------------------------------------------------------------------
// Gate approval rate metrics (ANLY-02)
// ---------------------------------------------------------------------------

/** First-pass gate approval rate for a single quality gate (1-4). */
export interface GateApprovalRate {
  gate_number: number
  phase_name: string
  first_pass_count: number
  total_evaluated: number
  /** Percentage 0-100 */
  rate: number
}

// ---------------------------------------------------------------------------
// Client lifecycle metrics (ANLY-03)
// ---------------------------------------------------------------------------

/** A client who completed the full pipeline (Phase 5). */
export interface CompletedClient {
  client_id: string
  client_name: string
  duration_days: number
  completed_at: string
}

/** Aggregate lifecycle metric across all completed clients. */
export interface LifecycleMetric {
  avg_days: number
  completed_clients: CompletedClient[]
}

// ---------------------------------------------------------------------------
// Trend data (ANLY-04)
// ---------------------------------------------------------------------------

/**
 * A single month data point for trend charts.
 * `month` is "YYYY-MM", `label` is abbreviated month name ("Jan", "Feb", etc.).
 */
export interface TrendPoint {
  month: string
  label: string
  avg_phase_duration: number | null
  gate_approval_rate: number | null
}

// ---------------------------------------------------------------------------
// Composite analytics response
// ---------------------------------------------------------------------------

/**
 * Complete analytics data returned by `fetchAnalyticsData`.
 *
 * `trend_data` carries raw rows so the client can re-aggregate
 * after applying a date range filter.
 */
export interface AnalyticsData {
  phase_durations: PhaseDuration[]
  gate_approval_rates: GateApprovalRate[]
  lifecycle: LifecycleMetric
  trend_data: {
    phases: Array<{
      phase_number: number
      completed_at: string
      duration_days: number
    }>
    gates: Array<{
      gate_number: number
      evaluated_at: string
      first_pass: boolean
    }>
  }
}
