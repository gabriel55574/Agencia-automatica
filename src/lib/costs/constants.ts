/**
 * Agency OS: Cost tracking constants and utilities (Phase 12)
 *
 * Configurable rate per 1K tokens and cost calculation utility.
 * Update COST_PER_1K_TOKENS when Claude pricing changes.
 */

/** Rate per 1,000 tokens in USD. Update this when pricing changes. */
export const COST_PER_1K_TOKENS = 0.025

/**
 * Calculate estimated cost from token count.
 *
 * @param tokenCount - Total tokens used (input + output), or null if unavailable
 * @returns Estimated cost in USD rounded to 2 decimal places, or null if tokenCount is null
 */
export function calculateCost(tokenCount: number | null): number | null {
  if (tokenCount === null || tokenCount === undefined) return null
  if (tokenCount === 0) return 0
  return Math.round((tokenCount / 1000) * COST_PER_1K_TOKENS * 100) / 100
}

/** Budget threshold percentages for visual alerts (COST-03) */
export const BUDGET_THRESHOLDS = {
  approaching: 0.8,  // 80% -- amber warning
  exceeded: 1.0,     // 100% -- red alert
} as const
