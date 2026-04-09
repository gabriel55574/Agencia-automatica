'use client'

import type { PhaseDuration } from '@/lib/analytics/types'

interface PhasePerformanceChartProps {
  data: PhaseDuration[]
}

export function PhasePerformanceChart({ data }: PhasePerformanceChartProps) {
  return <div>Phase Performance Chart (placeholder) - {data.length} phases</div>
}
