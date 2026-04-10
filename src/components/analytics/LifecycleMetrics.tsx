'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { LifecycleMetric } from '@/lib/analytics/types'

interface LifecycleMetricsProps {
  data: LifecycleMetric
}

export function LifecycleMetrics({ data }: LifecycleMetricsProps) {
  const { avg_days, completed_clients } = data
  const hasData = completed_clients.length > 0
  const displayClients = completed_clients.slice(0, 10)
  const remaining = completed_clients.length - 10

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ciclo de Vida do Cliente</CardTitle>
        <CardDescription>Tempo do inicio ate a conclusao da Fase 5</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-zinc-700">Nenhum ciclo completo</p>
            <p className="text-xs text-zinc-500 mt-1">
              As metricas de ciclo de vida aparecem apos um cliente completar todas as 5 fases.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold font-mono text-zinc-900">
                  {avg_days.toFixed(1)}
                </span>
                <span className="text-sm text-zinc-500">dias</span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                {completed_clients.length} clientes completaram o ciclo completo
              </p>
            </div>

            <div className="space-y-2">
              {displayClients.map((client) => (
                <div
                  key={client.client_id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-700 truncate mr-2">
                    {client.client_name}
                  </span>
                  <span className="text-sm font-mono text-zinc-500 shrink-0">
                    {client.duration_days}d
                  </span>
                </div>
              ))}
              {remaining > 0 && (
                <p className="text-xs text-zinc-400">e mais {remaining}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
