'use client'

import { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { assembleSquadContext } from '@/lib/actions/squad'
import { PROCESS_TO_SQUAD } from '@/lib/database/enums'
import type { AssembledContext } from '@/lib/squads/assembler'

export interface RunSquadButtonProps {
  processId: string
  processNumber: number
  processName: string
  clientId: string
  phaseId: string
  /** Controls visibility per D-01, D-03 */
  processStatus: 'pending' | 'active' | 'completed' | 'failed'
  isActivePhase: boolean
  latestJobStatus: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | null
  /** Callback to open preview modal with assembled data */
  onAssembled: (data: {
    context: AssembledContext
    prompt: string
    squadType: string
    processId: string
    clientId: string
    phaseId: string
  }) => void
}

/**
 * RunSquadButton: Triggers squad context assembly and opens the preview modal.
 *
 * Visibility rules (D-01, D-03):
 * 1. processStatus must be 'active' or 'pending'
 * 2. isActivePhase must be true
 * 3. No job in-flight (latestJobStatus is not 'queued' or 'running')
 *
 * On click: calls assembleSquadContext Server Action, then passes result to parent
 * via onAssembled callback (which opens the PromptPreviewModal).
 *
 * T-05-12: Loading state disables button during assembly to prevent spam-clicks.
 */
export function RunSquadButton({
  processId,
  processNumber,
  processName,
  clientId,
  phaseId,
  processStatus,
  isActivePhase,
  latestJobStatus,
  onAssembled,
}: RunSquadButtonProps) {
  const [loading, setLoading] = useState(false)

  // D-01: Only show for active or pending processes
  const validProcessStatus = processStatus === 'active' || processStatus === 'pending'

  // D-03: Hide when a job is queued or running
  const noInFlightJob =
    latestJobStatus === null ||
    latestJobStatus === 'completed' ||
    latestJobStatus === 'failed' ||
    latestJobStatus === 'cancelled'

  // All three conditions must be true to show the button
  if (!validProcessStatus || !isActivePhase || !noInFlightJob) {
    return null
  }

  const squadType = PROCESS_TO_SQUAD[processNumber]
  const squadLabel = squadType
    ? squadType.charAt(0).toUpperCase() + squadType.slice(1)
    : 'Unknown'

  async function handleClick() {
    setLoading(true)
    try {
      const result = await assembleSquadContext(clientId, processId, processNumber)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      onAssembled({
        context: result.context,
        prompt: result.prompt,
        squadType: result.squadType,
        processId,
        clientId,
        phaseId,
      })
    } catch (err) {
      toast.error('Failed to assemble squad context')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      title={`Run Squad ${squadLabel}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Assembling...
        </>
      ) : (
        <>
          <Play className="h-3.5 w-3.5" />
          Run Squad
        </>
      )}
    </Button>
  )
}
