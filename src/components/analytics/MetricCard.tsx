'use client'

import { Card, CardContent } from '@/components/ui/card'

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
}

export function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-3xl font-semibold font-mono text-zinc-900">{value}</p>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
