'use client'

import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Accordion } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProcessRow as ProcessRowComponent } from './process-row'
import { GateSection } from './gate-section'
import { PROCESS_DEFINITIONS } from '@/lib/pipeline/processes'
import type { PhaseRow, ProcessRow, GateRow } from '@/lib/types/pipeline'

interface PipelinePhaseProps {
  phase: PhaseRow
  processes: ProcessRow[]
  gate: GateRow | null
  clientId: string
  clientName: string
}

function PhaseStatusBadge({ status }: { status: PhaseRow['status'] }) {
  if (status === 'active') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>
  return <Badge variant="secondary">Pending</Badge>
}

export function PipelinePhase({ phase, processes, gate, clientId, clientName }: PipelinePhaseProps) {
  return (
    <AccordionItem value={phase.id} className="border border-zinc-200 rounded-lg mb-2 px-4 overflow-hidden">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-white text-xs font-bold shrink-0">
            {phase.phase_number}
          </span>
          <span className="text-sm font-semibold text-zinc-900">{phase.name}</span>
          <PhaseStatusBadge status={phase.status} />
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <Accordion type="single" collapsible className="w-full">
          {processes.map(proc => (
            <ProcessRowComponent
              key={proc.id}
              process={proc}
              definition={PROCESS_DEFINITIONS[proc.process_number]}
            />
          ))}
        </Accordion>

        {gate && (
          <>
            <Separator className="my-4" />
            <GateSection
              gate={gate}
              phaseProcesses={processes}
              clientId={clientId}
              clientName={clientName}
            />
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
