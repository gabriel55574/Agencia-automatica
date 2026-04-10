'use client'

import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Accordion } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProcessAccordionRow as ProcessRowComponent } from './process-row'
import { GateSection } from './gate-section'
import { PROCESS_DEFINITIONS } from '@/lib/pipeline/processes'
import { PHASE_COLORS, type PhaseNumber } from '@/lib/database/enums'
import type { PhaseRow, ProcessRow, GateRow, LatestJobData, GateReviewRow } from '@/lib/types/pipeline'
import type { AssembledContext } from '@/lib/squads/assembler'

interface PipelinePhaseProps {
  phase: PhaseRow
  processes: ProcessRow[]
  gate: GateRow | null
  clientId: string
  clientName: string
  /** Map of process_id -> latest job data (Phase 5) */
  latestJobs: Record<string, LatestJobData>
  /** Map of gate_id -> latest gate review data (Phase 6) */
  latestReviews: Record<string, GateReviewRow>
  /** Map of process_id -> budget info (Phase 12, COST-03) */
  budgetUsage?: Record<string, { budget: number; used: number; status: string }>
  /** Callback for when squad context is assembled (Phase 5) */
  onAssembled: (data: {
    context: AssembledContext
    prompt: string
    squadType: string
    processId: string
    processNumber: number
    clientId: string
    phaseId: string
  }) => void
}

/** Phase number circle background colors (solid variants for the numbered circle) */
const PHASE_CIRCLE_BG: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-violet-500',
  3: 'bg-amber-500',
  4: 'bg-green-500',
  5: 'bg-teal-500',
}

function PhaseStatusBadge({ status, phaseNumber }: { status: PhaseRow['status']; phaseNumber: PhaseNumber }) {
  const colors = PHASE_COLORS[phaseNumber]
  if (status === 'active') return <Badge className={`${colors.light} ${colors.dark} border-transparent`}>Active</Badge>
  if (status === 'completed') return <Badge className={`${colors.light} ${colors.dark} border-transparent`}>Completed</Badge>
  return <Badge variant="secondary">Pending</Badge>
}

export function PipelinePhase({ phase, processes, gate, clientId, clientName, latestJobs, latestReviews, budgetUsage, onAssembled }: PipelinePhaseProps) {
  const isActivePhase = phase.status === 'active'

  return (
    <AccordionItem value={phase.id} className={`border border-zinc-200 rounded-lg mb-2 px-4 overflow-hidden border-l-[3px] ${PHASE_COLORS[phase.phase_number as PhaseNumber].border}`}>
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className={`flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shrink-0 ${PHASE_CIRCLE_BG[phase.phase_number] ?? 'bg-zinc-800'}`}>
            {phase.phase_number}
          </span>
          <span className="text-sm font-semibold text-zinc-900">{phase.name}</span>
          <PhaseStatusBadge status={phase.status} phaseNumber={phase.phase_number as PhaseNumber} />
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <Accordion type="single" collapsible className="w-full">
          {processes.map(proc => (
            <ProcessRowComponent
              key={proc.id}
              process={proc}
              definition={PROCESS_DEFINITIONS[proc.process_number]}
              latestJob={latestJobs[proc.id] ?? null}
              isActivePhase={isActivePhase}
              clientId={clientId}
              phaseId={phase.id}
              onAssembled={onAssembled}
              tokenBudget={budgetUsage?.[proc.id]?.budget ?? null}
              budgetUsed={budgetUsage?.[proc.id]?.used ?? null}
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
              phaseId={phase.id}
              latestReview={gate ? (latestReviews[gate.id] ?? null) : null}
            />
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
