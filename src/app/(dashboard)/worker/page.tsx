import { createClient } from '@/lib/supabase/server'
import { WorkerMonitor } from '@/components/worker/worker-monitor'

export const dynamic = 'force-dynamic'

export default async function WorkerPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('squad_jobs')
    .select(`
      id, client_id, squad_type, status, progress_log,
      started_at, completed_at, created_at, token_count, estimated_cost_usd,
      clients!inner(name),
      processes(process_number, name)
    `)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <WorkerMonitor initialJobs={(jobs ?? []) as any} />
}
