'use client'

import { useState } from 'react'
import { ProcessRow } from './process-row'
import { JobProgressModal } from './job-progress-modal'
import type { ProcessRow as ProcessRowType } from '@/lib/types/pipeline'

interface ProcessJobsSectionProps {
  processes: ProcessRowType[]
  // Server-fetched initial job state (most recent job per process_id)
  initialJobsByProcessId: Record<string, {
    id: string
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  }>
}

export function ProcessJobsSection({ processes, initialJobsByProcessId }: ProcessJobsSectionProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  return (
    <>
      <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
        {processes.map((process) => {
          const activeJob = initialJobsByProcessId[process.id] ?? null
          return (
            <ProcessRow
              key={process.id}
              process={process}
              activeJob={activeJob}
              onViewProgress={(jobId) => setSelectedJobId(jobId)}
            />
          )
        })}
      </div>

      <JobProgressModal
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
      />
    </>
  )
}
