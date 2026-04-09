'use client'

import type { GateApprovalRate } from '@/lib/analytics/types'

interface GateApprovalChartProps {
  data: GateApprovalRate[]
}

export function GateApprovalChart({ data }: GateApprovalChartProps) {
  return <div>Gate Approval Chart (placeholder) - {data.length} gates</div>
}
