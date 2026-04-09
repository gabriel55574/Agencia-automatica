'use client'

import { Badge } from '@/components/ui/badge'

interface CycleBadgeProps {
  cycleNumber: number
}

/**
 * CycleBadge: Displays the pipeline cycle number for returning clients.
 *
 * Renders nothing for cycle 1 (first pass). Shows a blue "Cycle N" badge
 * for cycle 2+ clients who have gone through the feedback loop (D-09).
 */
export function CycleBadge({ cycleNumber }: CycleBadgeProps) {
  if (cycleNumber <= 1) return null
  return (
    <Badge variant="outline" className="text-xs font-medium border-blue-300 text-blue-700 bg-blue-50">
      Cycle {cycleNumber}
    </Badge>
  )
}
