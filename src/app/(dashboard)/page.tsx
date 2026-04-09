import { fetchDashboardData } from '@/lib/dashboard/queries'
import { fetchMonthlyCostSummary } from '@/lib/costs/queries'
import { getCurrentMonth } from '@/lib/costs/format'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { BottleneckAlert } from '@/components/dashboard/BottleneckAlert'
import { CostSummaryWidget } from '@/components/dashboard/CostSummaryWidget'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ show_archived?: string }>
}) {
  const params = await searchParams
  const showArchived = params?.show_archived === '1'
  const data = await fetchDashboardData(showArchived)
  const currentMonth = getCurrentMonth()
  const costSummary = await fetchMonthlyCostSummary(currentMonth)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Dashboard</h1>
      <BottleneckAlert stuckClients={data.stuckClients} />
      <CostSummaryWidget summary={costSummary} month={currentMonth} />
      <KanbanBoard data={data} showArchived={showArchived} />
    </div>
  )
}
