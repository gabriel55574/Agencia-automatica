'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { KanbanColumn } from './KanbanColumn'
import type { DashboardData } from '@/lib/dashboard/types'

interface KanbanBoardProps {
  data: DashboardData
  showArchived: boolean
}

export function KanbanBoard({ data, showArchived }: KanbanBoardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const stuckClientIds = new Set(data.stuckClients.map((c) => c.id))

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
      <div className="flex items-center justify-end mb-4">
        <Button variant="outline" size="sm" onClick={toggleArchived}>
          {showArchived ? 'Hide archived' : 'Show archived'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {data.columns.map((column) => (
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
