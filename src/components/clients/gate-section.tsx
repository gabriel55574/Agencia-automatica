'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { approveGateAction, rejectGateAction } from '@/lib/actions/gates'
import { runGateReview } from '@/lib/actions/gate-review'
import { getGateChecklist } from '@/lib/gates/index'
import { GateReviewDisplay } from './gate-review-display'
import type { GateRow, ProcessRow, GateReviewRow } from '@/lib/types/pipeline'

interface GateSectionProps {
  gate: GateRow
  phaseProcesses: ProcessRow[]
  clientId: string
  clientName: string
  phaseId: string
  latestReview: GateReviewRow | null
}

function GateStatusBadge({ gate }: { gate: GateRow }) {
  if (gate.status === 'approved') {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Gate {gate.gate_number} — Aprovado</Badge>
  }
  if (gate.status === 'rejected') {
    return <Badge className="bg-red-100 text-red-700 border-red-200">Gate {gate.gate_number} — Rejeitado</Badge>
  }
  return <Badge variant="secondary">Gate {gate.gate_number} — Pendente</Badge>
}

/** Check whether the verdict has any failed items (for reject dialog pre-selection per D-13) */
function hasFailedVerdictItems(review: GateReviewRow | null): boolean {
  if (!review || review.status !== 'completed') return false
  const verdict = review.verdict
  if (!verdict || !Array.isArray(verdict.items)) return false
  return (verdict.items as Array<Record<string, unknown>>).some(
    (item) => item?.verdict === 'fail'
  )
}

export function GateSection({ gate, phaseProcesses, clientId, clientName, phaseId, latestReview }: GateSectionProps) {
  const [isPendingApprove, startApprove] = useTransition()
  const [isPendingReject, startReject] = useTransition()
  const [isPendingReview, startReview] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const checklist = getGateChecklist(gate.gate_number)
  const allProcessesCompleted = phaseProcesses.every(p => p.status === 'completed')

  function toggleProcess(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleApprove() {
    startApprove(async () => {
      const result = await approveGateAction(gate.id, clientId)
      if ('error' in result) toast.error(result.error)
    })
  }

  function handleReject() {
    startReject(async () => {
      const result = await rejectGateAction(gate.id, clientId, selectedIds, notes)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setRejectOpen(false)
        setSelectedIds([])
        setNotes('')
      }
    })
  }

  /** Trigger AI gate review (T-06-12: disabled during pending transition prevents double-click) */
  function handleRunReview() {
    startReview(async () => {
      const result = await runGateReview(gate.id, clientId, gate.gate_number, phaseId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Revisao do gate iniciada')
      }
    })
  }

  /** Open reject dialog, pre-selecting all processes when AI verdict has failures (D-13) */
  function handleOpenReject() {
    if (hasFailedVerdictItems(latestReview)) {
      setSelectedIds(phaseProcesses.map(p => p.id))
    }
    setRejectOpen(true)
  }

  const canApprove = gate.status === 'pending' || gate.status === 'rejected'
  const canReject = gate.status !== 'approved'
  const showRunReviewButton = gate.status === 'pending' && !latestReview

  return (
    <div className="mt-4 p-4 rounded-lg border border-zinc-200 bg-zinc-50 space-y-3">
      <div className="flex items-center gap-2">
        <GateStatusBadge gate={gate} />
        {gate.status === 'rejected' && gate.operator_notes && (
          <span className="text-xs text-zinc-500 italic">{gate.operator_notes}</span>
        )}
      </div>

      {/* 1. Checklist Display (D-02): visible when no review exists yet */}
      {checklist && !latestReview?.status?.startsWith('completed') && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-zinc-800">{checklist.gateName}</h4>
          <ul className="space-y-1">
            {checklist.items.map(item => (
              <li key={item.id} className="flex items-center gap-2">
                <Circle className="size-3.5 text-zinc-400 shrink-0" />
                <span className="text-sm text-zinc-500">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. Run Gate Review Button (D-03, D-04, T-06-12) */}
      {showRunReviewButton && (
        <div>
          <Button
            size="sm"
            variant="outline"
            disabled={!allProcessesCompleted || isPendingReview}
            title={!allProcessesCompleted ? 'Complete todos os processos antes de executar a revisao do gate' : undefined}
            onClick={handleRunReview}
          >
            {isPendingReview ? 'Executando Revisao...' : 'Executar Revisao do Gate'}
          </Button>
        </div>
      )}

      {/* 3. Gate Review Display (D-11): shown when review data exists */}
      {latestReview && (
        <GateReviewDisplay review={latestReview} gateNumber={gate.gate_number} />
      )}

      {/* 4. Approve / Reject buttons (D-12: approve always available regardless of AI review) */}
      {(canApprove || canReject) && (
        <div className="flex items-center gap-2">
          {canApprove && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={isPendingApprove}>
                  {isPendingApprove ? 'Aprovando...' : 'Aprovar Gate'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Aprovar Gate {gate.gate_number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso avancara {clientName} para a Fase {gate.gate_number + 1}. Esta acao nao pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApprove}>Aprovar Gate</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {canReject && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={isPendingReject}
                onClick={handleOpenReject}
              >
                Rejeitar Gate
              </Button>
              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rejeitar Gate {gate.gate_number}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <p className="text-sm text-zinc-600">Selecione qual(is) processo(s) precisam de revisao:</p>
                    <div className="space-y-2">
                      {phaseProcesses.map(proc => (
                        <label key={proc.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedIds.includes(proc.id)}
                            onCheckedChange={() => toggleProcess(proc.id)}
                          />
                          <span className="text-sm text-zinc-800">{proc.name}</span>
                        </label>
                      ))}
                    </div>
                    <div>
                      <label className="text-sm text-zinc-600 block mb-1">Observacoes (opcional)</label>
                      <textarea
                        className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-400"
                        rows={3}
                        maxLength={2000}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Adicione contexto para a rejeicao..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      disabled={selectedIds.length === 0 || isPendingReject}
                      onClick={handleReject}
                    >
                      {isPendingReject ? 'Rejeitando...' : 'Confirmar Rejeicao'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      )}
    </div>
  )
}
