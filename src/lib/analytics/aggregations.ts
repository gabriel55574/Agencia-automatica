/**
 * Phase 14: Client-side analytics aggregation utilities.
 *
 * Pure functions for date filtering and monthly trend computation.
 * No Supabase dependency -- these operate on pre-fetched data.
 */

import { format, parseISO } from 'date-fns'
import type { DateRange, TrendPoint } from './types'

// ---------------------------------------------------------------------------
// Date range filter
// ---------------------------------------------------------------------------

/** Map date range tokens to their lookback in days. */
const RANGE_DAYS: Record<Exclude<DateRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

/**
 * Filter an array of items by a date range relative to now.
 *
 * - For '7d', '30d', '90d': keep items where `dateAccessor(item)` >= (now - N days).
 * - For 'all': return items as-is.
 * - Items where `dateAccessor` returns `null` are always excluded (except for 'all').
 *
 * @param range   The date range filter to apply.
 * @param items   Array of items to filter.
 * @param dateAccessor  Function to extract the ISO date string (or null) from each item.
 * @returns Filtered array preserving original order.
 */
export function filterByDateRange<T>(
  range: DateRange,
  items: T[],
  dateAccessor: (item: T) => string | null
): T[] {
  if (range === 'all') return items

  const now = new Date()
  const days = RANGE_DAYS[range]
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return items.filter((item) => {
    const dateStr = dateAccessor(item)
    if (dateStr === null) return false
    const itemDate = new Date(dateStr)
    return itemDate >= cutoff
  })
}

// ---------------------------------------------------------------------------
// Monthly trend aggregation
// ---------------------------------------------------------------------------

/**
 * Aggregate phase duration and gate approval data into monthly trend points.
 *
 * Groups phases by month (from `completed_at`) computing average `duration_days`.
 * Groups gates by month (from `evaluated_at`) computing first-pass approval rate.
 * Merges both into a sorted `TrendPoint[]` (ascending by month).
 *
 * @param phases  Raw phase completion rows with `completed_at` and `duration_days`.
 * @param gates   Raw gate evaluation rows with `evaluated_at` and `first_pass`.
 * @returns Sorted array of monthly trend data points.
 */
export function aggregateMonthlyTrends(
  phases: Array<{ completed_at: string; duration_days: number }>,
  gates: Array<{ evaluated_at: string; first_pass: boolean }>
): TrendPoint[] {
  // Collect all unique months from both datasets
  const monthSet = new Set<string>()

  // Phase data grouped by month: month -> durations[]
  const phaseDurations = new Map<string, number[]>()
  for (const p of phases) {
    const date = parseISO(p.completed_at)
    const month = format(date, 'yyyy-MM')
    monthSet.add(month)
    const existing = phaseDurations.get(month) ?? []
    existing.push(p.duration_days)
    phaseDurations.set(month, existing)
  }

  // Gate data grouped by month: month -> { total, firstPass }
  const gateStats = new Map<string, { total: number; firstPass: number }>()
  for (const g of gates) {
    const date = parseISO(g.evaluated_at)
    const month = format(date, 'yyyy-MM')
    monthSet.add(month)
    const existing = gateStats.get(month) ?? { total: 0, firstPass: 0 }
    existing.total += 1
    if (g.first_pass) existing.firstPass += 1
    gateStats.set(month, existing)
  }

  // Build and sort trend points
  const months = Array.from(monthSet).sort()

  return months.map((month) => {
    const durations = phaseDurations.get(month)
    const gate = gateStats.get(month)

    const avgDuration = durations
      ? Math.round((durations.reduce((sum, d) => sum + d, 0) / durations.length) * 100) / 100
      : null

    const approvalRate = gate
      ? Math.round((gate.firstPass / gate.total) * 10000) / 100
      : null

    // Parse month string back to get abbreviated month label
    const label = format(parseISO(`${month}-01`), 'MMM')

    return {
      month,
      label,
      avg_phase_duration: avgDuration,
      gate_approval_rate: approvalRate,
    }
  })
}
