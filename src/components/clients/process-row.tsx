'use client'

import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Square } from 'lucide-react'
import { RunSquadButton } from '@/components/squad/RunSquadButton'
import { RunCostBadge } from '@/components/squad/RunCostBadge'
import { StructuredOutputView } from '@/components/squad/StructuredOutputView'
import { BudgetSettingDialog } from '@/components/costs/BudgetSettingDialog'
import { BudgetBar } from '@/components/costs/BudgetBar'
import type { ProcessRow as ProcessRowType, LatestJobData } from '@/lib/types/pipeline'
import type { ProcessDefinition } from '@/lib/pipeline/processes'
import type { AssembledContext } from '@/lib/squads/assembler'

// ============================================================
// ProcessAccordionRow — used inside PipelinePhase accordion
// (Phase 3 component: shows process definition details)
// (Phase 5 extension: Run Squad button + structured output display)
// ============================================================

interface ProcessAccordionRowProps {
  process: ProcessRowType
  definition: ProcessDefinition | undefined
  /** Most recent squad_job for this process (null if none exist) */
  latestJob: LatestJobData | null
  /** Whether the parent phase is active */
  isActivePhase: boolean
  clientId: string
  phaseId: string
  /** Callback to open preview modal with assembled data */
  onAssembled: (data: {
    context: AssembledContext
    prompt: string
    squadType: string
    processId: string
    processNumber: number
    clientId: string
    phaseId: string
  }) => void
  /** Token budget for this process (null if no budget set) */
  tokenBudget: number | null
  /** Total tokens used by completed squad runs for this process */
  budgetUsed: number | null
}

function AccordionStatusBadge({ status }: { status: ProcessRowType['status'] }) {
  if (status === 'pending') return <Badge variant="secondary">Pending</Badge>
  if (status === 'active') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>
  return <Badge className="bg-red-100 text-red-700 border-red-200 font-semibold">Needs Rework</Badge>
}

export function ProcessAccordionRow({
  process,
  definition,
  latestJob,
  isActivePhase,
  clientId,
  phaseId,
  onAssembled,
  tokenBudget,
  budgetUsed,
}: ProcessAccordionRowProps) {
  return (
    <AccordionItem value={process.id} className="border-b border-zinc-100 last:border-0">
      <AccordionTrigger className="flex justify-between items-center py-3 px-1 hover:no-underline">
        <span className="text-sm font-medium text-zinc-800 text-left">{process.name}</span>
        <div className="flex items-center gap-2">
          {/* Job status badge inline with process status */}
          {latestJob?.status === 'running' && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">running</Badge>
          )}
          {latestJob?.status === 'queued' && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">queued</Badge>
          )}
          {latestJob?.status === 'failed' && (
            <Badge className="bg-red-100 text-red-700 border-red-200">failed</Badge>
          )}
          {latestJob?.status === 'completed' && latestJob.token_count != null && (
            <RunCostBadge
              tokenCount={latestJob.token_count ?? null}
              estimatedCost={latestJob.estimated_cost_usd ?? null}
            />
          )}
          <AccordionStatusBadge status={process.status} />
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-1 pb-4">
        {definition ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Squad</dt>
              <dd className="text-zinc-700 capitalize">{definition.squad}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Required Inputs</dt>
              <dd>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-600">
                  {definition.inputs.map((input, i) => <li key={i}>{input}</li>)}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Execution Steps</dt>
              <dd>
                <ol className="list-decimal list-inside space-y-0.5 text-zinc-600">
                  {definition.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Output Checklist</dt>
              <dd>
                <ul className="space-y-0.5 text-zinc-600">
                  {definition.checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Square className="h-3.5 w-3.5 mt-0.5 shrink-0 text-zinc-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-400">No definition available for this process.</p>
        )}

        {/* Run Squad button (Phase 5) — between definition and output sections */}
        {isActivePhase && (
          <div className="mt-4">
            <RunSquadButton
              processId={process.id}
              processNumber={process.process_number}
              processName={process.name}
              clientId={clientId}
              phaseId={phaseId}
              processStatus={process.status}
              isActivePhase={isActivePhase}
              latestJobStatus={latestJob?.status ?? null}
              onAssembled={onAssembled}
            />
          </div>
        )}

        {/* Budget system (Phase 12, COST-03) */}
        {isActivePhase && (
          <div className="mt-3 flex items-center gap-2">
            <BudgetSettingDialog
              processId={process.id}
              processName={process.name}
              currentBudget={tokenBudget}
            />
          </div>
        )}
        {tokenBudget != null && (
          <div className="mt-2">
            <BudgetBar used={budgetUsed ?? 0} budget={tokenBudget} />
          </div>
        )}

        {/* Squad execution status messages */}
        {latestJob?.status === 'running' && (
          <div className="mt-4 flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">running</Badge>
            <span className="text-sm text-zinc-500">Squad is executing...</span>
          </div>
        )}

        {/* Structured output display for completed jobs (D-15, D-16) */}
        {latestJob?.status === 'completed' && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
              Latest Output
            </h4>
            <StructuredOutputView
              structuredOutput={latestJob.structured_output}
              rawOutput={latestJob.output}
              processNumber={process.process_number}
              clientId={clientId}
              jobId={latestJob.id}
            />
          </div>
        )}

        {/* Failed job indicator */}
        {latestJob?.status === 'failed' && (
          <div className="mt-4 flex items-center gap-2">
            <Badge className="bg-red-100 text-red-700 border-red-200">failed</Badge>
            {latestJob.output && (
              <span className="text-xs text-zinc-500 truncate max-w-xs">{latestJob.output}</span>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

// ============================================================
// ProcessRow — used in /clients/[id] job status section (Phase 4)
// Shows running/failed/completed badges + View button for job progress
// Does NOT import Supabase — pure display component
// ============================================================

interface ProcessRowProps {
  process: {
    id: string
    process_number: number
    name: string
    squad: string
    status: string
  }
  // The most recent squad_job for this process (null if none exist)
  activeJob: {
    id: string
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  } | null
  // Callback to open the progress modal with the job ID
  onViewProgress: (jobId: string) => void
}

export function ProcessRow({ process, activeJob, onViewProgress }: ProcessRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-50 transition-colors">
      {/* Process number badge */}
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold shrink-0">
        #{process.process_number}
      </span>

      {/* Process name + squad */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 truncate">{process.name}</p>
        <p className="text-xs text-zinc-500 capitalize">{process.squad}</p>
      </div>

      {/* Status badge + optional View button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Process-level completed badge (independent of job status) */}
        {process.status === 'completed' && (
          <Badge className="bg-green-100 text-green-700 border-green-200">completed</Badge>
        )}

        {/* Job-level status badges */}
        {activeJob?.status === 'running' && (
          <>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">running</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewProgress(activeJob.id)}
              className="text-xs h-7 px-2"
            >
              View ►
            </Button>
          </>
        )}

        {activeJob?.status === 'failed' && (
          <Badge className="bg-red-100 text-red-700 border-red-200">failed</Badge>
        )}
      </div>
    </div>
  )
}
