'use client'

import { useState } from 'react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { PHASE_NAMES, type PhaseNumber } from '@/lib/database/enums'
import { RunHistoryList, type CompletedRun } from '@/components/documents/RunHistoryList'
import { format } from 'date-fns'
import type { ProcessWithRuns } from './page'

interface OutputsBrowserProps {
  clientName: string
  phaseNumbers: number[]
  byPhase: Record<string, ProcessWithRuns[]>
}

export function OutputsBrowser({ clientName, phaseNumbers, byPhase }: OutputsBrowserProps) {
  const [selectedRun, setSelectedRun] = useState<(CompletedRun & { processName: string; phaseName: string }) | null>(null)

  function handleSelectRun(run: CompletedRun, processName: string, phaseName: string) {
    setSelectedRun({ ...run, processName, phaseName })
  }

  function handleClose() {
    setSelectedRun(null)
  }

  return (
    <div className="flex gap-6">
      {/* Left side: accordion */}
      <div className={selectedRun ? 'w-2/5 shrink-0' : 'w-full'}>
        <Accordion type="multiple" defaultValue={phaseNumbers.map(String)} className="w-full">
          {phaseNumbers.map((phaseNum) => {
            const procs = byPhase[String(phaseNum)] ?? []
            const totalRuns = procs.reduce((sum, p) => sum + p.runs.length, 0)
            return (
              <AccordionItem key={phaseNum} value={String(phaseNum)}>
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      Phase {phaseNum}: {PHASE_NAMES[phaseNum as PhaseNumber]}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {totalRuns} {totalRuns === 1 ? 'run' : 'runs'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {procs.map((proc) => {
                      const latestRun = proc.runs[0]
                      return (
                        <div key={proc.processId} className="border rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium text-zinc-800 truncate">
                                {proc.processNumber}. {proc.processName}
                              </span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {proc.squad}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-xs text-zinc-400">
                              <span>{proc.runs.length} {proc.runs.length === 1 ? 'run' : 'runs'}</span>
                              {latestRun && (
                                <span>
                                  Latest: {format(new Date(latestRun.createdAt), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                          <RunHistoryList
                            runs={proc.runs}
                            onSelectRun={(run) => handleSelectRun(run, proc.processName, proc.phaseName)}
                            selectedRunId={selectedRun?.id ?? null}
                          />
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      {/* Right side: OutputViewer placeholder - wired in Task 2 */}
      {selectedRun && (
        <div className="w-3/5 border-l pl-6">
          <div className="text-sm text-zinc-400">
            Output viewer will render here. Selected run: {selectedRun.id}
          </div>
        </div>
      )}
    </div>
  )
}
