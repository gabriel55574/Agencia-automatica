import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Tables } from '@/lib/database/types'

type PhaseRow = Pick<
  Tables<'phases'>,
  'id' | 'phase_number' | 'name' | 'status' | 'started_at' | 'completed_at'
>

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

const STATUS_BADGE: Record<PhaseRow['status'], React.ReactNode> = {
  active: <Badge className="bg-blue-100 text-blue-700 border-blue-200">Ativo</Badge>,
  completed: <Badge className="bg-green-100 text-green-700 border-green-200">Concluido</Badge>,
  pending: <Badge variant="secondary">Pendente</Badge>,
}

export function PipelineTimeline({ phases }: { phases: PhaseRow[] }) {
  const sorted = [...phases].sort((a, b) => a.phase_number - b.phase_number)

  return (
    <div className="space-y-3">
      {sorted.map((phase, index) => {
        const isActive = phase.status === 'active'
        return (
          <div key={phase.id}>
            {index > 0 && <Separator className="my-3" />}
            <div className={`flex items-start gap-4 p-3 rounded-md ${isActive ? 'bg-blue-50 border-l-2 border-blue-500 pl-3' : ''}`}>
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold shrink-0 mt-0.5">
                {phase.phase_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-zinc-900">{phase.name}</span>
                  {STATUS_BADGE[phase.status]}
                </div>
                {phase.started_at && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Iniciado em {formatDate(phase.started_at)}
                    {phase.completed_at ? ` · Concluido em ${formatDate(phase.completed_at)}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
