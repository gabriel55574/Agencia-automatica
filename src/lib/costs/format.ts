/**
 * Number and date formatting utilities for cost tracking.
 *
 * All formatting rules match the UI-SPEC number formatting contract:
 * - Dollar cost: $X,XXX.XX (2 decimal places, comma thousands)
 * - Token count compact: raw if <1k, Xk if 1k-999k, X.XM if 1M+
 * - Token count full: comma-separated (100,000)
 * - Percentage: X% (no decimals, round)
 * - Trend: +X% / -X% / 0% (sign prefix, no decimals)
 * - Month display: MMMM YYYY (April 2026)
 * - All monetary/numeric values render in font-mono (handled by components)
 */

/**
 * Format a dollar amount as $X,XXX.XX
 */
export function formatCost(amount: number | null): string {
  if (amount === null || amount === undefined) return '$0.00'
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format token count in compact form.
 * - Under 1000: raw number (e.g., "850")
 * - 1k-999k: "X.Xk" or "Xk" if no remainder (e.g., "12.3k", "5k")
 * - 1M+: "X.XM" or "XM" if no remainder (e.g., "1.2M", "2M")
 */
export function formatTokensCompact(tokens: number | null): string {
  if (tokens === null || tokens === undefined) return '0'
  if (tokens < 1000) return String(tokens)
  if (tokens < 1_000_000) {
    const k = tokens / 1000
    return k % 1 === 0 ? `${k}k` : `${parseFloat(k.toFixed(1))}k`
  }
  const m = tokens / 1_000_000
  return m % 1 === 0 ? `${m}M` : `${parseFloat(m.toFixed(1))}M`
}

/**
 * Format token count with comma separators (e.g., "100,000").
 */
export function formatTokensFull(tokens: number | null): string {
  if (tokens === null || tokens === undefined) return '0'
  return tokens.toLocaleString('en-US')
}

/**
 * Format a trend percentage with sign prefix.
 * Returns "+X%", "-X%", or "0%".
 * Returns "—" if previous is null or 0 (no comparison available).
 */
export function formatTrend(current: number, previous: number | null): string {
  if (previous === null || previous === 0) return '—'
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return '0%'
  return pct > 0 ? `+${pct}%` : `${pct}%`
}

/**
 * Format a month string "YYYY-MM" as "MMMM YYYY" (e.g., "April 2026").
 */
export function formatMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number)
  const date = new Date(year, mon - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Get current month in "YYYY-MM" format.
 */
export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Generate a list of the last N months in "YYYY-MM" format, most recent first.
 */
export function getLastMonths(count: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}
