import { fetchAnalyticsData } from '@/lib/analytics/queries'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const data = await fetchAnalyticsData()

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
        <p className="text-sm text-zinc-500">
          Operational performance across your portfolio
        </p>
      </div>
      <AnalyticsDashboard data={data} />
    </div>
  )
}
