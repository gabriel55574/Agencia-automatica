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
  if (!user) return { error: 'Nao autorizado' }

  // T-06-05: Validate input
  const input = runGateReviewSchema.safeParse({
    gateId,
    clientId,
    gateNumber,
    phaseId,
  })
  if (!input.success)
    return { error: 'Entrada invalida: ' + input.error.issues[0]?.message }

  const admin = createAdminClient()

  // Step 3: Query all phase processes. Gate review should rely on the most recent
  // completed job outputs, not on process.status alone, because the UI may observe
  // job completion slightly before the persisted process row catches up.
  const { data: phaseProcesses, error: processError } = await admin
    .from('processes')
    .select('id, process_number, name')
    .eq('phase_id', input.data.phaseId)
    .order('process_number', { ascending: true })

  if (processError) {
    console.error('[runGateReview] Process query error:', processError)
    return { error: 'Falha ao buscar processos da fase' }
  }

  if (!phaseProcesses || phaseProcesses.length === 0) {
    return { error: 'Nenhum processo encontrado para esta fase' }
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
    .in('process_id', phaseProcesses.map((process) => process.id))
    .order('created_at', { ascending: false })

  if (jobError) {
    console.error('[runGateReview] Job query error:', jobError)
    return { error: 'Falha ao buscar outputs do squad' }
  }

  // Step 5: Keep only the most recent completed output per process.
  const latestCompletedJobByProcessId = new Map<string, string>()
  for (const job of completedJobs ?? []) {
    if (!job.process_id || latestCompletedJobByProcessId.has(job.process_id)) continue
    if (typeof job.output !== 'string' || job.output.length === 0) continue
    latestCompletedJobByProcessId.set(job.process_id, job.output)
  }

  const missingOutputs = phaseProcesses.filter(
    (process) => !latestCompletedJobByProcessId.has(process.id)
  )

  if (missingOutputs.length > 0) {
    return {
      error: `Complete os processos pendentes antes da revisao do gate: ${missingOutputs
        .map((process) => `${process.process_number}. ${process.name}`)
        .join(', ')}`,
    }
  }

  const phaseOutputs: PhaseOutput[] = phaseProcesses.map((process) => ({
    processName: process.name,
    processNumber: process.process_number,
    output: latestCompletedJobByProcessId.get(process.id) ?? '',
  }))

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
    return { error: 'Falha ao criar tarefa de revisao do gate' }
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
    return { error: 'Falha ao criar registro de revisao do gate' }
  }

  revalidatePath(`/clients/${input.data.clientId}`)
  return { success: true, jobId: jobRow.id }
}
