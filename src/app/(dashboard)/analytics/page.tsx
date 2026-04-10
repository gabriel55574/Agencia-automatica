import { BarChart3 } from 'lucide-react'
import { fetchAnalyticsData } from '@/lib/analytics/queries'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { EmptyState } from '@/components/ui/empty-state'

export default async function AnalyticsPage() {
  const data = await fetchAnalyticsData()

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Analise</h1>
        <p className="text-sm text-zinc-500">
          Desempenho operacional do seu portfolio
        </p>
      </div>
      {data.phase_durations.every((p) => p.completed_count === 0) &&
       data.gate_approval_rates.every((g) => g.total_evaluated === 0) ? (
        <EmptyState
          icon={BarChart3}
          title="Dados insuficientes"
          description="Analises estarao disponiveis apos a execucao de squads."
        />
      ) : (
        <AnalyticsDashboard data={data} />
      )}
    </div>
  )
}
