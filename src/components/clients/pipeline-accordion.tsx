'use client'

import { Accordion } from '@/components/ui/accordion'
import { PipelinePhase } from './pipeline-phase'
import type { PhaseRow, ProcessRow, GateRow } from '@/lib/types/pipeline'

interface PipelineAccordionProps {
  phases: PhaseRow[]
  processes: ProcessRow[]
  gates: GateRow[]
  clientId: string
  clientName: string
}

export function PipelineAccordion({ phases, processes, gates, clientId, clientName }: PipelineAccordionProps) {
  const activePhase = phases.find(p => p.status === 'active')

  const processesByPhase = processes.reduce<Record<string, ProcessRow[]>>((acc, proc) => {
    if (!acc[proc.phase_id]) acc[proc.phase_id] = []
    acc[proc.phase_id].push(proc)
    return acc
  }, {})

  const gateByPhase = gates.reduce<Record<string, GateRow>>((acc, gate) => {
    acc[gate.phase_id] = gate
    return acc
  }, {})

  const sortedPhases = [...phases].sort((a, b) => a.phase_number - b.phase_number)

  return (
    <Accordion
      type="multiple"
      defaultValue={activePhase ? [activePhase.id] : []}
      className="w-full"
    >
      {sortedPhases.map(phase => (
        <PipelinePhase
          key={phase.id}
          phase={phase}
          processes={processesByPhase[phase.id] ?? []}
          gate={gateByPhase[phase.id] ?? null}
          clientId={clientId}
          clientName={clientName}
        />
      ))}
    </Accordion>
  )
}
