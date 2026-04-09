'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { squadJobSchema } from '@/lib/database/schema'
import type { SquadJob } from '@/lib/database/schema'

interface JobProgressModalProps {
  jobId: string | null // null = modal closed
  onClose: () => void
}

export function JobProgressModal({ jobId, onClose }: JobProgressModalProps) {
  const [job, setJob] = useState<SquadJob | null>(null)

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      return
    }

    const supabase = createClient()

    // Fetch initial job state
    supabase
      .from('squad_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
      .then(({ data }) => {
        if (!data) return
        const parsed = squadJobSchema.safeParse(data)
        if (parsed.success) {
          setJob(parsed.data)
        } else {
          console.error('[JobProgressModal] Initial fetch parse error:', parsed.error)
        }
      })

    // Subscribe to Realtime UPDATE events for this job row (D-05)
    // Validate Realtime payload with squadJobSchema.safeParse() before setting state (T-04-10)
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'squad_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const parsed = squadJobSchema.safeParse(payload.new)
          if (parsed.success) {
            setJob(parsed.data)
          } else {
            // Malformed payload — ignore to prevent state corruption (T-04-10 mitigation)
            console.error('[JobProgressModal] Realtime payload parse error:', parsed.error)
          }
        }
      )
      .subscribe()

    // Cleanup: remove channel on unmount or jobId change
    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId])

  return (
    <Dialog open={jobId !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Squad Job Progress</DialogTitle>
        </DialogHeader>

        {job === null ? (
          <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
            Loading...
          </div>
        ) : job.status === 'running' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              {/* Animated indicator */}
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Running — updating every 5 seconds...
            </div>
            <pre className="bg-zinc-950 text-green-400 text-xs p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap font-mono">
              {job.progress_log ?? 'Waiting for output...'}
            </pre>
          </div>
        ) : job.status === 'completed' ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-green-700">Completed</p>
            <pre className="bg-zinc-950 text-green-400 text-xs p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap font-mono">
              {job.output ?? job.progress_log ?? 'No output recorded.'}
            </pre>
          </div>
        ) : job.status === 'failed' ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-700">Failed</p>
            <pre className="bg-zinc-950 text-green-400 text-xs p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap font-mono">
              {job.error_log ?? job.progress_log ?? 'No error details recorded.'}
            </pre>
          </div>
        ) : (
          /* queued or cancelled */
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 capitalize">Status: {job.status}</p>
            {job.progress_log && (
              <pre className="bg-zinc-950 text-green-400 text-xs p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                {job.progress_log}
              </pre>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
