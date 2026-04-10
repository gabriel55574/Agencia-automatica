'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { KanbanColumn } from './KanbanColumn'
import { ActionPanel } from './ActionPanel'
import { ActionSummaryBar } from './ActionSummaryBar'
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard'
import type { DashboardData } from '@/lib/dashboard/types'

interface KanbanBoardProps {
  data: DashboardData
  showArchived: boolean
}

export function KanbanBoard({ data, showArchived }: KanbanBoardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Wire Realtime — returns live-updated data via RSC refresh cycle
  const liveData = useRealtimeDashboard(data)

  const stuckClientIds = new Set(liveData.stuckClients.map((c) => c.id))

  function toggleArchived() {
    const params = new URLSearchParams(searchParams.toString())
    if (showArchived) {
      params.delete('show_archived')
    } else {
      params.set('show_archived', '1')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div>
      {/* Header row: title + archived toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-800">Pipeline</h2>
        <Button variant="outline" size="sm" onClick={toggleArchived}>
          {showArchived ? 'Ocultar arquivados' : 'Mostrar arquivados'}
        </Button>
      </div>

      {/* Action summary bar — compact one-line counts */}
      <div className="mb-3">
        <ActionSummaryBar actions={liveData.actions} />
      </div>

      {/* Action panel — expandable detail sections */}
      <div className="mb-6">
        <ActionPanel actions={liveData.actions} />
      </div>

      {/* 5-column Kanban grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {liveData.columns.map((column) => (
          <KanbanColumn
            key={column.phase_number}
            column={column}
            stuckClientIds={stuckClientIds}
          />
        ))}
      </div>
    </div>
  )
}
