'use client'

import type { TrendPoint } from '@/lib/analytics/types'

interface TrendChartProps {
  data: TrendPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  return <div>Trend Chart (placeholder) - {data.length} points</div>
}
