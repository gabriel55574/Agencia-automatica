import { fetchDashboardData } from '@/lib/dashboard/queries'
import { KanbanBoard } from '@/components/dashboard/KanbanBoard'
import { BottleneckAlert } from '@/components/dashboard/BottleneckAlert'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ show_archived?: string }>
}) {
  const params = await searchParams
  const showArchived = params?.show_archived === '1'
  const data = await fetchDashboardData(showArchived)

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Dashboard</h1>
      <BottleneckAlert stuckClients={data.stuckClients} />
      <KanbanBoard data={data} showArchived={showArchived} />
    </div>
  )
}
