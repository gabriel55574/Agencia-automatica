'use client'

import type { LifecycleMetric } from '@/lib/analytics/types'

interface LifecycleMetricsProps {
  data: LifecycleMetric
}

export function LifecycleMetrics({ data }: LifecycleMetricsProps) {
  return <div>Lifecycle Metrics (placeholder) - {data.completed_clients.length} clients</div>
}
