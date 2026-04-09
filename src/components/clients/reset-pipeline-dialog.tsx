'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { resetPipelineAction } from '@/lib/actions/pipeline-reset'

interface ResetPipelineDialogProps {
  clientId: string
  clientName: string
  canReset: boolean
}

/**
 * ResetPipelineDialog: Confirmation dialog for starting a new pipeline cycle.
 *
 * Only enabled when the client has completed Phase 5 (canReset prop).
 * Calls resetPipelineAction Server Action on confirmation (D-08).
 *
 * When canReset is false, renders the button as disabled with a title
 * explaining the requirement (no tooltip component available).
 */
export function ResetPipelineDialog({ clientId, clientName, canReset }: ResetPipelineDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!canReset) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Client must complete Phase 5 before starting a new cycle"
      >
        Reset Pipeline (New Cycle)
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
          Reset Pipeline (New Cycle)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start New Cycle for {clientName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will start a new pipeline cycle for {clientName}. All existing squad outputs
            will be preserved. The client will return to Phase 1 (Diagnostico).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isPending}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await resetPipelineAction(clientId)
                if ('error' in result) {
                  setError(result.error)
                  toast.error(result.error)
                } else {
                  toast.success('Pipeline reset — new cycle started')
                  router.refresh()
                }
              })
            }}
          >
            {isPending ? 'Resetting...' : 'Confirm Reset'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      {error && <p className="text-xs text-red-600 px-1 pb-2">{error}</p>}
    </AlertDialog>
  )
}
