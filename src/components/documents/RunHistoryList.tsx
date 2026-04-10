'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export type CompletedRun = {
  id: string
  squadType: string
  structuredOutput: Record<string, unknown> | null
  output: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

interface RunHistoryListProps {
  runs: CompletedRun[]
  onSelectRun: (run: CompletedRun) => void
  selectedRunId: string | null
}

function computeDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return 'N/A'
  const start = new Date(startedAt).getTime()
  const end = new Date(completedAt).getTime()
  const diffMs = end - start
  if (diffMs < 0) return 'N/A'
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}m ${remaining}s`
}

export function RunHistoryList({ runs, onSelectRun, selectedRunId }: RunHistoryListProps) {
  if (runs.length === 0) {
    return <p className="text-sm text-zinc-400 py-2">Nenhuma execucao concluida.</p>
  }

  return (
    <div className="space-y-1">
      {runs.map((run) => {
        const isSelected = run.id === selectedRunId
        const hasStructured = run.structuredOutput !== null
        return (
          <div
            key={run.id}
            className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              isSelected ? 'bg-zinc-100' : 'hover:bg-zinc-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-zinc-700 shrink-0">
                {format(new Date(run.createdAt), 'MMM d, yyyy')}
              </span>
              <span className="text-zinc-400 text-xs shrink-0">
                {computeDuration(run.startedAt, run.completedAt)}
              </span>
              <Badge variant={hasStructured ? 'default' : 'secondary'} className="shrink-0">
                {hasStructured ? 'Estruturado' : 'Apenas bruto'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onSelectRun(run)}
            >
              Ver
            </Button>
          </div>
        )
      })}
    </div>
  )
}
