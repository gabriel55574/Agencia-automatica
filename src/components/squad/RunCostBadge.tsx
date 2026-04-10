import { Badge } from '@/components/ui/badge'
import { formatCost, formatTokensCompact } from '@/lib/costs/format'

interface RunCostBadgeProps {
  tokenCount: number | null
  estimatedCost: number | null
}

export function RunCostBadge({ tokenCount, estimatedCost }: RunCostBadgeProps) {
  // Only render if we have at least one value
  if (tokenCount === null && estimatedCost === null) return null

  const costStr = estimatedCost !== null ? formatCost(estimatedCost) : '\u2014'
  const tokenStr = tokenCount !== null ? `${formatTokensCompact(tokenCount)} tokens` : ''

  const label = tokenCount !== null && estimatedCost !== null
    ? `${costStr} | ${tokenStr}`
    : tokenCount !== null
      ? tokenStr
      : costStr

  const ariaLabel = tokenCount !== null
    ? `Custo: ${costStr}, ${tokenCount.toLocaleString('pt-BR')} tokens`
    : `Custo: ${costStr}`

  return (
    <Badge
      variant="outline"
      className="text-xs font-mono"
      aria-label={ariaLabel}
    >
      {label}
    </Badge>
  )
}
