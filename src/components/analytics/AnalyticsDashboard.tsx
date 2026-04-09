'use client'

import { useState, useMemo } from 'react'
import { PHASE_NAMES, type PhaseNumber } from '@/lib/database/enums'
import { filterByDateRange, aggregateMonthlyTrends } from '@/lib/analytics/aggregations'
import type {
  AnalyticsData,
  DateRange,
  PhaseDuration,
  GateApprovalRate,
  LifecycleMetric,
  TrendPoint,
} from '@/lib/analytics/types'
import { DateRangeFilter } from './DateRangeFilter'
import { PhasePerformanceChart } from './PhasePerformanceChart'
import { GateApprovalChart } from './GateApprovalChart'
import { LifecycleMetrics } from './LifecycleMetrics'
import { TrendChart } from './TrendChart'

interface AnalyticsDashboardProps {
  data: AnalyticsData
}

interface FilteredData {
  phaseDurations: PhaseDuration[]
  gateRates: GateApprovalRate[]
  lifecycle: LifecycleMetric
  trends: TrendPoint[]
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const [range, setRange] = useState<DateRange>('30d')

  const filtered = useMemo<FilteredData>(() => {
    // Filter raw trend data by date range
    const filteredPhases = filterByDateRange(
      range,
      data.trend_data.phases,
      (p) => p.completed_at
    )
    const filteredGates = filterByDateRange(
      range,
      data.trend_data.gates,
      (g) => g.evaluated_at
    )
    const filteredClients = filterByDateRange(
      range,
      data.lifecycle.completed_clients,
      (c) => c.completed_at
    )

    // Recompute phase durations from filtered raw phases
    const phaseGroups = new Map<number, number[]>()
    for (const p of filteredPhases) {
      const existing = phaseGroups.get(p.phase_number) ?? []
      existing.push(p.duration_days)
      phaseGroups.set(p.phase_number, existing)
    }

    const phaseDurations: PhaseDuration[] = ([1, 2, 3, 4, 5] as PhaseNumber[]).map((num) => {
      const durations = phaseGroups.get(num) ?? []
      const avg =
        durations.length > 0
          ? Math.round(
              (durations.reduce((sum, d) => sum + d, 0) / durations.length) * 100
            ) / 100
          : 0

      return {
        phase_number: num,
        phase_name: PHASE_NAMES[num],
        avg_days: avg,
        completed_count: durations.length,
      }
    })

    // Recompute gate rates from filtered raw gates
    const gateGroups = new Map<number, { total: number; firstPass: number }>()
    for (const g of filteredGates) {
      const stats = gateGroups.get(g.gate_number) ?? { total: 0, firstPass: 0 }
      stats.total += 1
      if (g.first_pass) stats.firstPass += 1
      gateGroups.set(g.gate_number, stats)
    }

    const gatePhaseNames: Record<number, string> = {
      1: PHASE_NAMES[1],
      2: PHASE_NAMES[2],
      3: PHASE_NAMES[3],
      4: PHASE_NAMES[4],
    }

    const gateRates: GateApprovalRate[] = [1, 2, 3, 4].map((num) => {
      const stats = gateGroups.get(num) ?? { total: 0, firstPass: 0 }
      const rate =
        stats.total > 0
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

    // Recompute lifecycle from filtered clients
    const avgDays =
      filteredClients.length > 0
        ? Math.round(
            (filteredClients.reduce((sum, c) => sum + c.duration_days, 0) /
              filteredClients.length) *
              100
          ) / 100
        : 0

    const lifecycle: LifecycleMetric = {
      avg_days: avgDays,
      completed_clients: filteredClients,
    }

    // Compute trends from filtered data
    const trends = aggregateMonthlyTrends(filteredPhases, filteredGates)

    return { phaseDurations, gateRates, lifecycle, trends }
  }, [range, data])

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PhasePerformanceChart data={filtered.phaseDurations} />
        <GateApprovalChart data={filtered.gateRates} />
        <LifecycleMetrics data={filtered.lifecycle} />
        <TrendChart data={filtered.trends} />
      </div>
    </div>
  )
}
