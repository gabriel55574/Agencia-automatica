'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getGateRateStatus, type GateRateStatus } from '@/lib/analytics/constants'
import type { GateApprovalRate } from '@/lib/analytics/types'

interface GateApprovalChartProps {
  data: GateApprovalRate[]
}

const STATUS_COLORS: Record<GateRateStatus, { bar: string; badge: string; text: string }> = {
  healthy: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-700',
  },
  moderate: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    text: 'text-amber-700',
  },
  poor: {
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    text: 'text-red-700',
  },
}

const STATUS_LABELS: Record<GateRateStatus, string> = {
  healthy: 'Saudavel',
  moderate: 'Moderado',
  poor: 'Ruim',
}

export function GateApprovalChart({ data }: GateApprovalChartProps) {
  const hasData = data.some((d) => d.total_evaluated > 0)

  const ariaLabel = hasData
    ? `Taxas de aprovacao de gate: ${data
        .map((d) => `Gate ${d.gate_number} ${Math.round(d.rate)}%`)
        .join(', ')}`
    : 'Nenhum dado de gate disponivel'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Taxas de Aprovacao de Gate</CardTitle>
        <CardDescription>Taxa de aprovacao na primeira avaliacao por gate</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-zinc-700">Nenhum dado de gate ainda</p>
            <p className="text-xs text-zinc-500 mt-1">
              As taxas de aprovacao aparecem apos a primeira revisao de gate.
            </p>
          </div>
        ) : (
          <div role="img" aria-label={ariaLabel} className="space-y-4">
            {data.map((gate) => {
              const status = getGateRateStatus(gate.rate)
              const colors = STATUS_COLORS[status]

              return (
                <div key={gate.gate_number} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700">
                      Gate {gate.gate_number} ({gate.phase_name})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-semibold ${colors.text}`}>
                        {Math.round(gate.rate)}%
                      </span>
                      {gate.total_evaluated > 0 && (
                        <Badge variant="secondary" className={colors.badge}>
                          {STATUS_LABELS[status]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100">
                    <div
                      className={`h-2 rounded-full ${colors.bar} transition-all`}
                      style={{ width: `${Math.min(gate.rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400">
                    {gate.first_pass_count} de {gate.total_evaluated} gates aprovados na primeira tentativa
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
