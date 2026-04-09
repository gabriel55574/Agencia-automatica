'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
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
import type { GateRow, ProcessRow } from '@/lib/types/pipeline'

interface GateSectionProps {
  gate: GateRow
  phaseProcesses: ProcessRow[]
  clientId: string
  clientName: string
}

function GateStatusBadge({ gate }: { gate: GateRow }) {
  if (gate.status === 'approved') {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Gate {gate.gate_number} — Approved</Badge>
  }
  if (gate.status === 'rejected') {
    return <Badge className="bg-red-100 text-red-700 border-red-200">Gate {gate.gate_number} — Rejected</Badge>
  }
  return <Badge variant="secondary">Gate {gate.gate_number} — Pending</Badge>
}

export function GateSection({ gate, phaseProcesses, clientId, clientName }: GateSectionProps) {
  const [isPendingApprove, startApprove] = useTransition()
  const [isPendingReject, startReject] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

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

  const canApprove = gate.status === 'pending' || gate.status === 'rejected'
  const canReject = gate.status !== 'approved'

  return (
    <div className="mt-4 p-4 rounded-lg border border-zinc-200 bg-zinc-50 space-y-3">
      <div className="flex items-center gap-2">
        <GateStatusBadge gate={gate} />
        {gate.status === 'rejected' && gate.operator_notes && (
          <span className="text-xs text-zinc-500 italic">{gate.operator_notes}</span>
        )}
      </div>

      {(canApprove || canReject) && (
        <div className="flex items-center gap-2">
          {canApprove && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={isPendingApprove}>
                  {isPendingApprove ? 'Approving...' : 'Approve Gate'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Gate {gate.gate_number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will advance {clientName} to Phase {gate.gate_number + 1}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApprove}>Approve Gate</AlertDialogAction>
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
                onClick={() => setRejectOpen(true)}
              >
                Reject Gate
              </Button>
              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Gate {gate.gate_number}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <p className="text-sm text-zinc-600">Select which process(es) need revision:</p>
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
                      <label className="text-sm text-zinc-600 block mb-1">Notes (optional)</label>
                      <textarea
                        className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-400"
                        rows={3}
                        maxLength={2000}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Add context for the rejection..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      disabled={selectedIds.length === 0 || isPendingReject}
                      onClick={handleReject}
                    >
                      {isPendingReject ? 'Rejecting...' : 'Confirm Rejection'}
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
