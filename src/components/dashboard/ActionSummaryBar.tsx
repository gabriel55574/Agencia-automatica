'use client'

import { Badge } from '@/components/ui/badge'
import type { ActionPanelData } from '@/lib/dashboard/types'

interface ActionSummaryBarProps {
  actions: ActionPanelData
}

export function ActionSummaryBar({ actions }: ActionSummaryBarProps) {
  const { pendingApprovals, failedGates, runningJobs } = actions
  const pending = pendingApprovals.length
  const failed = failedGates.length
  const running = runningJobs.length
  const allZero = pending === 0 && failed === 0 && running === 0

  if (allZero) {
    return (
      <div className="flex items-center gap-4 text-sm text-zinc-400">
        All clear
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 text-sm text-zinc-600">
      {pending > 0 && (
        <span className="flex items-center gap-1.5">
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            {pending}
          </Badge>
          pending approval{pending !== 1 ? 's' : ''}
        </span>
      )}
      {failed > 0 && (
        <span className="flex items-center gap-1.5">
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {failed}
          </Badge>
          failed gate{failed !== 1 ? 's' : ''}
        </span>
      )}
      {running > 0 && (
        <span className="flex items-center gap-1.5">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {running}
          </Badge>
          running job{running !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
