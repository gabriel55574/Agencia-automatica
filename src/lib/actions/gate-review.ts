'use server'

/**
 * Agency OS: Server Action for triggering AI gate reviews.
 *
 * Called when operator clicks "Run Gate Review" in the gate section.
 * Creates a squad_jobs row with squad_type='gate_review' and a gate_reviews
 * row with status='running'. The worker picks up the job, runs the adversarial
 * review CLI, and stores the verdict.
 *
 * Security:
 * - T-06-04: Auth check via createClient().auth.getUser()
 * - T-06-05: All inputs validated with Zod (UUID format, gate number range 1-4)
 * - T-06-08: Queries scoped to specific phase_id/client_id, gate_review excluded from output collection
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildReviewPrompt } from '@/lib/gates/review-prompt'
import type { PhaseOutput } from '@/lib/gates/review-prompt'
import type { ActionResult } from './clients'

const runGateReviewSchema = z.object({
  gateId: z.string().uuid(),
  clientId: z.string().uuid(),
  gateNumber: z.number().int().min(1).max(4),
  phaseId: z.string().uuid(),
})

/**
 * Trigger an AI gate review for a quality gate.
 *
 * Flow:
 * 1. Auth check
 * 2. Validate input
 * 3. Fetch completed processes and their squad job outputs for this phase
 * 4. Build adversarial review prompt
 * 5. Create squad_jobs row with squad_type='gate_review'
 * 6. Create gate_reviews row with status='running' linked to the job
 *
 * @returns jobId on success, or error message
 */
export async function runGateReview(
  gateId: string,
  clientId: string,
  gateNumber: number,
  phaseId: string
): Promise<{ success: true; jobId: string } | { error: string }> {
  // T-06-04: Auth check (always first)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // T-06-05: Validate input
  const input = runGateReviewSchema.safeParse({
    gateId,
    clientId,
    gateNumber,
    phaseId,
  })
  if (!input.success)
    return { error: 'Invalid input: ' + input.error.issues[0]?.message }

  const admin = createAdminClient()

  // Step 3: Query completed processes in this phase
  const { data: completedProcesses, error: processError } = await admin
    .from('processes')
    .select('id, process_number, name')
    .eq('phase_id', input.data.phaseId)
    .eq('status', 'completed')

  if (processError) {
    console.error('[runGateReview] Process query error:', processError)
    return { error: 'Failed to fetch completed processes' }
  }

  // Step 4: Fetch most recent completed squad_job outputs for this phase
  // T-06-08: Exclude gate_review jobs to prevent recursive loop
  const { data: completedJobs, error: jobError } = await admin
    .from('squad_jobs')
    .select('output, process_id')
    .eq('phase_id', input.data.phaseId)
    .eq('status', 'completed')
    .not('output', 'is', null)
    .not('squad_type', 'eq', 'gate_review')

  if (jobError) {
    console.error('[runGateReview] Job query error:', jobError)
    return { error: 'Failed to fetch squad job outputs' }
  }

  // Step 5: Build phase outputs array by matching jobs to processes
  const phaseOutputs: PhaseOutput[] = (completedProcesses ?? [])
    .map((proc) => {
      // Find the most recent job output for this process
      const matchingJob = (completedJobs ?? []).find(
        (job) => job.process_id === proc.id
      )
      return {
        processName: proc.name,
        processNumber: proc.process_number,
        output: matchingJob?.output ?? '',
      }
    })
    .filter((o) => o.output !== '')

  if (phaseOutputs.length === 0) {
    return { error: 'No completed process outputs found for this phase' }
  }

  // Step 6: Build the adversarial review prompt
  const reviewPrompt = buildReviewPrompt(input.data.gateNumber, phaseOutputs)

  // Step 7: Insert squad_jobs row with squad_type='gate_review'
  const { data: jobRow, error: insertJobError } = await admin
    .from('squad_jobs')
    .insert({
      client_id: input.data.clientId,
      phase_id: input.data.phaseId,
      process_id: null,
      squad_type: 'gate_review',
      status: 'queued',
      cli_command: reviewPrompt,
    })
    .select('id')
    .single()

  if (insertJobError || !jobRow) {
    console.error('[runGateReview] Job insert error:', insertJobError)
    return { error: 'Failed to create gate review job' }
  }

  // Step 8: Insert gate_reviews row with status='running' linked to the job
  const { error: insertReviewError } = await admin
    .from('gate_reviews')
    .insert({
      gate_id: input.data.gateId,
      client_id: input.data.clientId,
      squad_job_id: jobRow.id,
      verdict: {},
      raw_output: '',
      status: 'running',
    })

  if (insertReviewError) {
    console.error('[runGateReview] Review insert error:', insertReviewError)
    return { error: 'Failed to create gate review record' }
  }

  revalidatePath(`/clients/${input.data.clientId}`)
  return { success: true, jobId: jobRow.id }
}
