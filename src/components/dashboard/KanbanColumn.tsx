import { Badge } from '@/components/ui/badge'
import { PHASE_NAMES } from '@/lib/database/enums'
import { KanbanClientCard } from './KanbanClientCard'
import type { PhaseColumn } from '@/lib/dashboard/types'

interface KanbanColumnProps {
  column: PhaseColumn
  stuckClientIds: Set<string>
}

export function KanbanColumn({ column, stuckClientIds }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-h-[200px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-zinc-700">
          {PHASE_NAMES[column.phase_number]}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {column.clients.length}
        </Badge>
      </div>

      <div className="flex-1 bg-zinc-50 rounded-lg p-2 space-y-3">
        {column.clients.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8">No clients</p>
        ) : (
          column.clients.map((client) => (
            <KanbanClientCard
              key={client.id}
              client={client}
              isStuck={stuckClientIds.has(client.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
