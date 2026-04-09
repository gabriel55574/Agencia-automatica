'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { confirmSquadRun } from '@/lib/actions/squad'
import type { AssembledContext } from '@/lib/squads/assembler'

export interface PreviewData {
  context: AssembledContext
  prompt: string
  squadType: string
  processId: string
  clientId: string
  phaseId: string
}

interface PromptPreviewModalProps {
  open: boolean
  onClose: () => void
  data: PreviewData | null
}

/**
 * PromptPreviewModal: Read-only preview of the assembled prompt before confirming execution.
 *
 * D-10: Shows squad name, context summary, and full prompt.
 * D-11: "Confirm & Run" calls confirmSquadRun Server Action.
 *
 * T-05-11: All text rendered as React text nodes (no dangerouslySetInnerHTML).
 */
export function PromptPreviewModal({ open, onClose, data }: PromptPreviewModalProps) {
  const [confirming, setConfirming] = useState(false)

  if (!data) return null

  const squadLabel = data.squadType.charAt(0).toUpperCase() + data.squadType.slice(1)
  const truncatedBriefing =
    data.context.briefing.length > 300
      ? data.context.briefing.slice(0, 300) + '...'
      : data.context.briefing

  async function handleConfirm() {
    if (!data) return
    setConfirming(true)
    try {
      const result = await confirmSquadRun(
        data.processId,
        data.clientId,
        data.phaseId,
        data.squadType,
        data.prompt
      )
      if ('error' in result && result.error) {
        toast.error(result.error)
      } else {
        toast.success('Squad run queued')
        onClose()
      }
    } catch {
      toast.error('Failed to queue squad run')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Run Squad {squadLabel}</DialogTitle>
        </DialogHeader>

        {/* Truncation warning (D-10) */}
        {data.context.truncated && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm">
            Context was truncated. Showing {data.context.outputsIncluded} of{' '}
            {data.context.totalOutputsAvailable} prior outputs (oldest removed).
          </div>
        )}

        {/* Context summary */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">
              Briefing
            </h4>
            <p className="text-sm text-zinc-700">{truncatedBriefing || 'No briefing available'}</p>
          </div>

          {data.context.priorOutputs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">
                Prior Outputs
              </h4>
              <ul className="list-disc list-inside text-sm text-zinc-600 space-y-0.5">
                {data.context.priorOutputs.map((output, i) => (
                  <li key={i}>
                    Process {output.processNumber}: {output.processName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Full prompt display */}
        <div>
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">
            Full Prompt
          </h4>
          <pre className="max-h-96 overflow-y-auto bg-zinc-50 p-4 rounded-md text-xs font-mono whitespace-pre-wrap break-words">
            {data.prompt}
          </pre>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={confirming}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={confirming}>
            {confirming ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm & Run'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
