'use client'

import { useState } from 'react'
import { Accordion } from '@/components/ui/accordion'
import { PipelinePhase } from './pipeline-phase'
import { PromptPreviewModal, type PreviewData } from '@/components/squad/PromptPreviewModal'
import type { PhaseRow, ProcessRow, GateRow, LatestJobData } from '@/lib/types/pipeline'

interface PipelineAccordionProps {
  phases: PhaseRow[]
  processes: ProcessRow[]
  gates: GateRow[]
  clientId: string
  clientName: string
  /** Map of process_id -> latest job data (Phase 5) */
  latestJobs: Record<string, LatestJobData>
}

export function PipelineAccordion({ phases, processes, gates, clientId, clientName, latestJobs }: PipelineAccordionProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)

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
    <>
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
            latestJobs={latestJobs}
            onAssembled={setPreviewData}
          />
        ))}
      </Accordion>

      <PromptPreviewModal
        open={!!previewData}
        data={previewData}
        onClose={() => setPreviewData(null)}
      />
    </>
  )
}
