'use client'

import { Progress } from '@/components/ui/progress'
import { formatTokensCompact } from '@/lib/costs/format'
import { BUDGET_THRESHOLDS } from '@/lib/costs/constants'

interface BudgetBarProps {
  used: number
  budget: number
}

export function BudgetBar({ used, budget }: BudgetBarProps) {
  if (budget <= 0) return null

  const percentage = Math.round((used / budget) * 100)
  const displayPercentage = Math.min(percentage, 100) // cap visual at 100%

  // Color class based on thresholds — targets the indicator child div
  let colorClass = '[&>div]:bg-zinc-600'
  if (percentage >= BUDGET_THRESHOLDS.exceeded * 100) {
    colorClass = '[&>div]:bg-red-500'
  } else if (percentage >= BUDGET_THRESHOLDS.approaching * 100) {
    colorClass = '[&>div]:bg-amber-500'
  }

  return (
    <div className="space-y-1">
      <Progress
        value={displayPercentage}
        className={`h-2 ${colorClass}`}
        aria-label={`Token budget usage: ${percentage}% of ${budget.toLocaleString('en-US')} tokens`}
      />
      <p className="text-xs text-zinc-500 font-mono text-right">
        {percentage}% of {formatTokensCompact(budget)}
      </p>
    </div>
  )
}
