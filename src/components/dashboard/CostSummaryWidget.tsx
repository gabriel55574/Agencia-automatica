import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCost, formatMonth } from '@/lib/costs/format'
import type { MonthlyCostSummary } from '@/lib/costs/types'

interface CostSummaryWidgetProps {
  summary: MonthlyCostSummary
  month: string
}

export function CostSummaryWidget({ summary, month }: CostSummaryWidgetProps) {
  // Empty state per UI-SPEC copywriting contract
  if (summary.total_cost === 0 && summary.top_clients.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-base font-semibold text-zinc-900">Resumo de Custos</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-semibold text-zinc-700 mb-1">Sem gastos neste mes</p>
          <p className="text-xs text-zinc-500">
            Execute um squad para comecar a rastrear custos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-base font-semibold text-zinc-900">Resumo de Custos</h3>
        <Link href={`/costs?month=${month}`}>
          <Button variant="link" size="sm" className="text-sm px-0">
            Ver Todos os Custos &rarr;
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl font-semibold font-mono text-zinc-900">
            {formatCost(summary.total_cost)}
          </p>
          <p className="text-sm text-zinc-500">{formatMonth(month)}</p>
        </div>

        {summary.top_clients.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
              Maiores clientes
            </p>
            <ul className="space-y-1.5">
              {summary.top_clients.map((client, i) => (
                <li
                  key={client.client_id}
                  className="flex items-center justify-between"
                >
                  <Link
                    href={`/clients/${client.client_id}`}
                    className="text-sm text-zinc-700 hover:text-zinc-900 hover:underline truncate"
                  >
                    {i + 1}. {client.client_name}
                  </Link>
                  <span className="text-sm font-mono text-zinc-900 shrink-0 ml-2">
                    {formatCost(client.total_cost)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
