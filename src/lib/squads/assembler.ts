/**
 * Agency OS: Context assembler for squad execution.
 *
 * Collects the client briefing + prior phase outputs and assembles them into
 * a structured context object for Claude CLI squad prompts.
 *
 * Key behaviors:
 * - Queries completed squad_jobs from phases PRIOR to the current phase only (D-04)
 * - Orders outputs by phase_number ASC, process_number ASC (D-05)
 * - Truncates at 32,000 characters oldest-first to stay within prompt limits (D-06)
 * - feedbackContext is populated by Phase 9 feedback loop for cycle 2+ clients;
 *   empty string for cycle 1 clients (first pass through the pipeline)
 *
 * Security (T-05-02): All queries scope with WHERE client_id = $1.
 * No cross-client data leakage possible.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFeedbackContext } from './feedback'

// ============================================================
// Types
// ============================================================

export type ProcessOutput = {
  processNumber: number
  processName: string
  phaseNumber: number
  output: string
}

export type AssembledContext = {
  briefing: string
  priorOutputs: ProcessOutput[]
  feedbackContext: string // always '' in Phase 5; Phase 9 fills this
  truncated: boolean
  totalOutputsAvailable: number
  outputsIncluded: number
}

// ============================================================
// Constants
// ============================================================

/** Maximum total character count before truncation kicks in (D-06) */
const MAX_CONTEXT_CHARS = 32_000

// ============================================================
// Main function
// ============================================================

/**
 * Assembles the execution context for a squad process.
 *
 * @param clientId - The UUID of the client
 * @param processNumber - The process number being executed (1-16)
 * @param supabaseClient - Optional Supabase client for dependency injection (testing)
 * @returns Assembled context with briefing, prior outputs, and truncation metadata
 * @throws Error if the client is not found
 */
export async function assembleContext(
  clientId: string,
  processNumber: number,
  supabaseClient?: SupabaseClient
): Promise<AssembledContext> {
  const supabase = supabaseClient ?? createAdminClient()

  // Step 1: Fetch client briefing and current phase number
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('briefing, current_phase_number')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    throw new Error(clientError?.message ?? 'Client not found')
  }

  const briefing = client.briefing ? JSON.stringify(client.briefing) : ''
  const currentPhaseNumber = client.current_phase_number as number

  // Step 1b: Extract feedback context from previous cycle (Phase 9 feedback loop)
  // Returns non-empty string for cycle 2+ clients with Phase 5 outputs
  const feedback = await extractFeedbackContext(clientId, supabase)

  // Step 2: Fetch completed squad_jobs from prior phases
  // Uses a join through processes and phases tables to get process/phase metadata.
  // Only includes jobs from phases BEFORE the current phase (D-04: exclude same-phase).
  const { data: jobs, error: jobsError } = await supabase
    .from('squad_jobs')
    .select('output, processes!inner(process_number, name), phases!inner(phase_number)')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .not('output', 'is', null)
    .lt('phases.phase_number', currentPhaseNumber)
    .order('phases(phase_number)', { ascending: true })
    .order('processes(process_number)', { ascending: true })

  if (jobsError) {
    throw new Error(jobsError.message)
  }

  // Step 3: Build ProcessOutput array
  const allOutputs: ProcessOutput[] = (jobs ?? []).map((job: Record<string, unknown>) => {
    const processes = job.processes as { process_number: number; name: string }
    const phases = job.phases as { phase_number: number }
    return {
      processNumber: processes.process_number,
      processName: processes.name,
      phaseNumber: phases.phase_number,
      output: job.output as string,
    }
  })

  const totalOutputsAvailable = allOutputs.length

  // Step 4: Truncation (D-06)
  // If total chars exceed MAX_CONTEXT_CHARS, remove oldest outputs first
  let priorOutputs = [...allOutputs]
  let truncated = false

  const computeTotal = () =>
    briefing.length + feedback.length + priorOutputs.reduce((sum, o) => sum + o.output.length, 0)

  while (computeTotal() > MAX_CONTEXT_CHARS && priorOutputs.length > 1) {
    priorOutputs.shift() // Remove the oldest (first) output
    truncated = true
  }

  // Step 5: Return assembled context
  return {
    briefing,
    priorOutputs,
    feedbackContext: feedback,
    truncated,
    totalOutputsAvailable,
    outputsIncluded: priorOutputs.length,
  }
}
