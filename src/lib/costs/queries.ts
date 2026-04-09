/**
 * Agency OS: Cost tracking queries (Phase 12)
 *
 * Server-side Supabase queries for cost aggregation.
 * Used by the /costs page (COST-02) and dashboard widget (COST-04).
 *
 * Note: Supabase JS client does not support GROUP BY, so aggregation
 * is done in TypeScript using Maps. Query volume is bounded by monthly
 * job count (~50-100 max for 15 clients).
 */

import { createClient } from '@/lib/supabase/server'
import { BUDGET_THRESHOLDS } from './constants'
import type { BudgetStatus, CostBreakdownRow, MonthlyCostSummary } from './types'

/**
 * Fetch monthly cost breakdown grouped by client.
 *
 * Queries squad_jobs where status='completed' and completed_at falls within
 * the given month. Aggregates token_count and estimated_cost_usd per client.
 *
 * @param month - ISO month string "YYYY-MM" (e.g., "2026-04")
 * @returns Array of CostBreakdownRow sorted by total_cost descending
 */
export async function fetchMonthlyCostBreakdown(month: string): Promise<CostBreakdownRow[]> {
  const supabase = await createClient()

  // Calculate date range for the given month
  const startDate = `${month}-01T00:00:00.000Z`
  const [year, mon] = month.split('-').map(Number)
  const nextMonth = mon === 12
    ? `${year + 1}-01`
    : `${year}-${String(mon + 1).padStart(2, '0')}`
  const endDate = `${nextMonth}-01T00:00:00.000Z`

  // Previous month range for trend calculation
  const prevMonth = mon === 1
    ? `${year - 1}-12`
    : `${year}-${String(mon - 1).padStart(2, '0')}`
  const prevStartDate = `${prevMonth}-01T00:00:00.000Z`

  // Run current and previous month queries in parallel
  const [currentResult, prevResult] = await Promise.all([
    supabase
      .from('squad_jobs')
      .select('client_id, token_count, estimated_cost_usd')
      .eq('status', 'completed')
      .not('token_count', 'is', null)
      .gte('completed_at', startDate)
      .lt('completed_at', endDate),
    supabase
      .from('squad_jobs')
      .select('client_id, estimated_cost_usd')
      .eq('status', 'completed')
      .not('token_count', 'is', null)
      .gte('completed_at', prevStartDate)
      .lt('completed_at', startDate),
  ])

  // Fetch client names for unique client_ids from current month
  const clientIds = [...new Set((currentResult.data ?? []).map((j) => j.client_id))]
  const { data: clients } = clientIds.length > 0
    ? await supabase.from('clients').select('id, name').in('id', clientIds)
    : { data: [] }
  const clientNameMap = new Map((clients ?? []).map((c) => [c.id, c.name]))

  // Aggregate current month by client
  const currentByClient = new Map<
    string,
    { run_count: number; total_tokens: number; total_cost: number }
  >()
  for (const job of currentResult.data ?? []) {
    const entry = currentByClient.get(job.client_id) ?? {
      run_count: 0,
      total_tokens: 0,
      total_cost: 0,
    }
    entry.run_count += 1
    entry.total_tokens += (job.token_count as number) ?? 0
    entry.total_cost += Number(job.estimated_cost_usd ?? 0)
    currentByClient.set(job.client_id, entry)
  }

  // Aggregate previous month by client for trend
  const prevByClient = new Map<string, number>()
  for (const job of prevResult.data ?? []) {
    prevByClient.set(
      job.client_id,
      (prevByClient.get(job.client_id) ?? 0) + Number(job.estimated_cost_usd ?? 0)
    )
  }

  // Build and sort rows
  const rows: CostBreakdownRow[] = Array.from(currentByClient.entries()).map(
    ([clientId, data]) => ({
      client_id: clientId,
      client_name: clientNameMap.get(clientId) ?? 'Unknown',
      run_count: data.run_count,
      total_tokens: data.total_tokens,
      total_cost: Math.round(data.total_cost * 100) / 100,
      previous_month_cost: prevByClient.has(clientId)
        ? Math.round((prevByClient.get(clientId) ?? 0) * 100) / 100
        : null,
    })
  )

  rows.sort((a, b) => b.total_cost - a.total_cost)
  return rows
}

/**
 * Fetch monthly cost summary for dashboard widget.
 *
 * Returns total spend, total tokens, top 5 clients by cost, and previous month total.
 * Reuses fetchMonthlyCostBreakdown to avoid query duplication.
 *
 * @param month - ISO month string "YYYY-MM" (e.g., "2026-04")
 * @returns MonthlyCostSummary
 */
export async function fetchMonthlyCostSummary(month: string): Promise<MonthlyCostSummary> {
  const rows = await fetchMonthlyCostBreakdown(month)

  const total_cost = Math.round(rows.reduce((sum, r) => sum + r.total_cost, 0) * 100) / 100
  const total_tokens = rows.reduce((sum, r) => sum + r.total_tokens, 0)
  const top_clients = rows.slice(0, 5).map((r) => ({
    client_id: r.client_id,
    client_name: r.client_name,
    total_cost: r.total_cost,
  }))

  const prevCosts = rows.filter((r) => r.previous_month_cost !== null)
  const previous_month_total =
    prevCosts.length > 0
      ? Math.round(
          prevCosts.reduce((sum, r) => sum + (r.previous_month_cost ?? 0), 0) * 100
        ) / 100
      : null

  return { total_cost, total_tokens, top_clients, previous_month_total }
}

export type ProcessBudgetInfo = {
  budget: number
  used: number
  status: BudgetStatus
}

/**
 * Fetch budget usage for all processes that have a token_budget set.
 *
 * Returns a record keyed by process_id with budget, usage, and status.
 * Used by the client profile page to render BudgetBar on process rows.
 *
 * @param clientId - The client whose processes to check
 * @returns Record<processId, { budget, used, status }>
 */
export async function fetchProcessBudgetUsage(
  clientId: string
): Promise<Record<string, ProcessBudgetInfo>> {
  const supabase = await createClient()

  // Find all processes for this client that have a budget set
  const { data: processes } = await supabase
    .from('processes')
    .select('id, token_budget')
    .eq('client_id', clientId)
    .not('token_budget', 'is', null)

  if (!processes || processes.length === 0) return {}

  // For each budgeted process, get total token usage from completed jobs
  const processIds = processes.map(p => p.id)
  const { data: jobs } = await supabase
    .from('squad_jobs')
    .select('process_id, token_count')
    .in('process_id', processIds)
    .eq('status', 'completed')
    .not('token_count', 'is', null)

  // Aggregate token usage per process
  const usageByProcess = new Map<string, number>()
  for (const job of jobs ?? []) {
    if (job.process_id) {
      usageByProcess.set(
        job.process_id,
        (usageByProcess.get(job.process_id) ?? 0) + ((job.token_count as number) ?? 0)
      )
    }
  }

  // Build result with budget status
  const result: Record<string, ProcessBudgetInfo> = {}
  for (const process of processes) {
    const budget = (process.token_budget as number) ?? 0
    const used = usageByProcess.get(process.id) ?? 0
    const ratio = budget > 0 ? used / budget : 0

    let status: BudgetStatus = 'under'
    if (ratio >= BUDGET_THRESHOLDS.exceeded) {
      status = 'exceeded'
    } else if (ratio >= BUDGET_THRESHOLDS.approaching) {
      status = 'approaching'
    }

    result[process.id] = { budget, used, status }
  }

  return result
}
