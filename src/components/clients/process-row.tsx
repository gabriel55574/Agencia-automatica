'use client'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Square } from 'lucide-react'
import type { ProcessRow } from '@/lib/types/pipeline'
import type { ProcessDefinition } from '@/lib/pipeline/processes'

interface ProcessRowProps {
  process: ProcessRow
  definition: ProcessDefinition | undefined
}

function StatusBadge({ status }: { status: ProcessRow['status'] }) {
  if (status === 'pending') return <Badge variant="secondary">Pending</Badge>
  if (status === 'active') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>
  return <Badge className="bg-red-100 text-red-700 border-red-200 font-semibold">Needs Rework</Badge>
}

export function ProcessRow({ process, definition }: ProcessRowProps) {
  return (
    <AccordionItem value={process.id} className="border-b border-zinc-100 last:border-0">
      <AccordionTrigger className="flex justify-between items-center py-3 px-1 hover:no-underline">
        <span className="text-sm font-medium text-zinc-800 text-left">{process.name}</span>
        <StatusBadge status={process.status} />
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
      </AccordionContent>
    </AccordionItem>
  )
}
