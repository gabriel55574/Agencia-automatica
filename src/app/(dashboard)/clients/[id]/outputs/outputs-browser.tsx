'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PHASE_NAMES, type PhaseNumber } from '@/lib/database/enums'
import { RunHistoryList, type CompletedRun } from '@/components/documents/RunHistoryList'
import { OutputViewer } from '@/components/documents/OutputViewer'
import { format } from 'date-fns'
import type { ProcessWithRuns, GateReviewOutput } from '@/lib/types/outputs'

interface OutputsBrowserProps {
  clientName: string
  clientId: string
  phaseNumbers: number[]
  byPhase: Record<string, ProcessWithRuns[]>
  gateReviews: GateReviewOutput[]
}

export function OutputsBrowser({ clientName, clientId, phaseNumbers, byPhase, gateReviews }: OutputsBrowserProps) {
  const [selectedRun, setSelectedRun] = useState<(CompletedRun & { processName: string; phaseName: string; processNumber: number }) | null>(null)
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null)

  function handleSelectRun(run: CompletedRun, processName: string, phaseName: string, processNumber: number) {
    setSelectedRun({ ...run, processName, phaseName, processNumber })
  }

  function handleClose() {
    setSelectedRun(null)
  }

  return (
    <div className="space-y-8">
      {/* Process outputs accordion */}
      {phaseNumbers.length > 0 && (
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
                          Fase {phaseNum}: {PHASE_NAMES[phaseNum as PhaseNumber]}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {totalRuns} {totalRuns === 1 ? 'execucao' : 'execucoes'}
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
                                  <span>{proc.runs.length} {proc.runs.length === 1 ? 'execucao' : 'execucoes'}</span>
                                  {latestRun && (
                                    <span>
                                      Ultima: {format(new Date(latestRun.createdAt), 'dd/MM/yyyy')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <RunHistoryList
                                runs={proc.runs}
                                onSelectRun={(run) => handleSelectRun(run, proc.processName, proc.phaseName, proc.processNumber)}
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

          {/* Right side: OutputViewer */}
          {selectedRun && (
            <div className="w-3/5">
              <OutputViewer
                run={selectedRun}
                processName={selectedRun.processName}
                phaseName={selectedRun.phaseName}
                clientName={clientName}
                onClose={handleClose}
                processNumber={selectedRun.processNumber}
                clientId={clientId}
              />
            </div>
          )}
        </div>
      )}

      {/* Gate review outputs section */}
      {gateReviews.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-700 mb-3">Revisoes de Gate (IA)</h2>
          <div className="space-y-3">
            {gateReviews.map((review) => (
              <GateReviewOutputCard
                key={review.id}
                review={review}
                expanded={expandedReviewId === review.id}
                onToggle={() => setExpandedReviewId(expandedReviewId === review.id ? null : review.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface GateReviewOutputCardProps {
  review: GateReviewOutput
  expanded: boolean
  onToggle: () => void
}

function GateReviewOutputCard({ review, expanded, onToggle }: GateReviewOutputCardProps) {
  const [showRaw, setShowRaw] = useState(false)

  const verdict = review.verdict
  const overall = typeof verdict?.overall === 'string' &&
    ['pass', 'fail', 'partial'].includes(verdict.overall as string)
    ? (verdict.overall as 'pass' | 'fail' | 'partial')
    : null
  const summary = typeof verdict?.summary === 'string' ? verdict.summary : null
  const items = Array.isArray(verdict?.items)
    ? (verdict.items as Record<string, unknown>[]).map(item => ({
        checklist_id: typeof item?.checklist_id === 'string' ? item.checklist_id : '',
        label: typeof item?.label === 'string' ? item.label : 'Item desconhecido',
        verdict: item?.verdict === 'pass' ? 'pass' as const : 'fail' as const,
        evidence: typeof item?.evidence === 'string' ? item.evidence : '',
      }))
    : null

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <VerdictIcon overall={overall} status={review.status} />
          <div className="min-w-0">
            <span className="text-sm font-medium text-zinc-800">
              Gate {review.gateNumber} — Revisao IA
            </span>
            <span className="ml-2 text-xs text-zinc-400">
              {review.phaseName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-zinc-400">
            {format(new Date(review.createdAt), 'dd/MM/yyyy HH:mm')}
          </span>
          <VerdictBadge overall={overall} status={review.status} />
          {expanded
            ? <ChevronDown className="size-4 text-zinc-400" />
            : <ChevronRight className="size-4 text-zinc-400" />
          }
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 py-3 space-y-3 border-t border-zinc-100">
          {summary && (
            <p className="text-sm text-zinc-700">{summary}</p>
          )}

          {items && items.length > 0 && (
            <div className="rounded-md border border-zinc-200 divide-y divide-zinc-100">
              {items.map((item, index) => (
                <div key={item.checklist_id || index} className="px-3 py-2 flex items-start gap-2">
                  {item.verdict === 'pass'
                    ? <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
                    : <XCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                  }
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-800">{item.label}</p>
                    {item.evidence && (
                      <p className="text-xs text-zinc-500 italic mt-0.5">{item.evidence}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {review.rawOutput && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs text-zinc-500 px-0 h-auto"
              >
                {showRaw ? 'Ocultar output bruto' : 'Ver output bruto'}
              </Button>
              {showRaw && (
                <pre className="mt-2 bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {review.rawOutput}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function VerdictIcon({ overall, status }: { overall: 'pass' | 'fail' | 'partial' | null; status: string }) {
  if (status === 'failed') return <AlertTriangle className="size-4 text-yellow-500 shrink-0" />
  if (overall === 'pass') return <CheckCircle2 className="size-4 text-green-600 shrink-0" />
  if (overall === 'fail') return <XCircle className="size-4 text-red-600 shrink-0" />
  if (overall === 'partial') return <AlertTriangle className="size-4 text-amber-500 shrink-0" />
  return <AlertTriangle className="size-4 text-zinc-400 shrink-0" />
}

function VerdictBadge({ overall, status }: { overall: 'pass' | 'fail' | 'partial' | null; status: string }) {
  if (status === 'running') {
    return <Badge variant="secondary" className="text-xs">Em andamento</Badge>
  }
  if (status === 'failed') {
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Falhou</Badge>
  }
  if (overall === 'pass') {
    return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Aprovado</Badge>
  }
  if (overall === 'fail') {
    return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Reprovado</Badge>
  }
  if (overall === 'partial') {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Parcial</Badge>
  }
  return <Badge variant="secondary" className="text-xs">Sem veredito</Badge>
}
