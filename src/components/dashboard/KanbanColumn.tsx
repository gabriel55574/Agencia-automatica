import { Badge } from '@/components/ui/badge'
import { PHASE_NAMES, PHASE_COLORS, type PhaseNumber } from '@/lib/database/enums'
import { KanbanClientCard } from './KanbanClientCard'
import type { PhaseColumn } from '@/lib/dashboard/types'

/** Solid background variant for the phase color bar at the top of each column */
const PHASE_BAR_BG: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-violet-500',
  3: 'bg-amber-500',
  4: 'bg-green-500',
  5: 'bg-teal-500',
}

interface KanbanColumnProps {
  column: PhaseColumn
  stuckClientIds: Set<string>
}

export function KanbanColumn({ column, stuckClientIds }: KanbanColumnProps) {
  const colors = PHASE_COLORS[column.phase_number as PhaseNumber]

  return (
    <div className="flex flex-col min-h-[200px]">
      {/* Phase color bar — 4px colored indicator at top of column */}
      <div className={`h-1 rounded-t-lg ${PHASE_BAR_BG[column.phase_number] ?? 'bg-zinc-300'}`} />

      <div className="flex items-center justify-between mb-3 px-1 mt-2">
        <h3 className={`text-sm font-semibold ${colors.base}`}>
          {PHASE_NAMES[column.phase_number]}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {column.clients.length}
        </Badge>
      </div>

      <div className="flex-1 bg-zinc-50 rounded-lg p-2 space-y-3">
        {column.clients.length === 0 ? (
          <p className="text-xs text-[#8A9999] text-center py-8">Nenhum cliente</p>
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
