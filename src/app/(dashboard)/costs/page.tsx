import { Suspense } from 'react'
import { DollarSign } from 'lucide-react'
import { fetchMonthlyCostBreakdown } from '@/lib/costs/queries'
import { CostBreakdownTable } from '@/components/costs/CostBreakdownTable'
import { MonthSelector } from '@/components/costs/MonthSelector'
import { EmptyState } from '@/components/ui/empty-state'
import { formatMonth, formatCost, getCurrentMonth } from '@/lib/costs/format'

interface CostsPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function CostsPage({ searchParams }: CostsPageProps) {
  const params = await searchParams
  const month = params?.month ?? getCurrentMonth()
  const rows = await fetchMonthlyCostBreakdown(month)
  const monthTotal = rows.reduce((sum, r) => sum + r.total_cost, 0)

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Detalhamento de Custos</h1>
        <Suspense fallback={null}>
          <MonthSelector currentMonth={month} />
        </Suspense>
      </div>

      <div>
        <p className="text-sm text-zinc-500">Total de {formatMonth(month)}</p>
        <p className="text-xl font-semibold font-mono text-zinc-900">
          {formatCost(monthTotal)}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhum dado de custo"
          description="Custos de execucao das squads serao registrados automaticamente."
        />
      ) : (
        <CostBreakdownTable rows={rows} />
      )}
    </div>
  )
}
