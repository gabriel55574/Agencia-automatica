/**
 * Agency OS: Cost tracking types (Phase 12)
 *
 * Type definitions for token usage extraction, cost breakdown display,
 * budget status indicators, and monthly cost summaries.
 */

/** Token usage extracted from Claude CLI JSON envelope */
export type TokenUsage = {
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

/** Row shape for the cost breakdown table (COST-02) */
export type CostBreakdownRow = {
  client_id: string
  client_name: string
  run_count: number
  total_tokens: number
  total_cost: number
  previous_month_cost: number | null
}

/** Monthly cost summary for dashboard widget (COST-04) */
export type MonthlyCostSummary = {
  total_cost: number
  total_tokens: number
  top_clients: Array<{ client_id: string; client_name: string; total_cost: number }>
  previous_month_total: number | null
}

/** Budget status indicator for per-process token budgets (COST-03) */
export type BudgetStatus = 'no-budget' | 'under' | 'approaching' | 'exceeded'
