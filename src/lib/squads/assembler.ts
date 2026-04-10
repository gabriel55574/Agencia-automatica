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
import { PROCESS_DEFINITIONS } from '@/lib/pipeline/processes'
import { getProcessOutputFilePath, processOutputFileExists } from './output-files'

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
  priorOutputFilePaths: string[]
  feedbackContext: string // always '' in Phase 5; Phase 9 fills this
  templateContent: string // TMPL-03: template reference content (empty if no template selected)
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
  supabaseClient?: SupabaseClient,
  templateContent?: string,
  contextFrom?: number[]
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

  // Step 2: Fetch completed squad_jobs based on contextFrom strategy:
  // - contextFrom === [] (process 1): no prior context needed, skip query
  // - contextFrom provided with items: filter by specific process numbers
  // - contextFrom undefined: fall back to legacy lte/lt filters
  let jobs: Record<string, unknown>[] | null = null
  let jobsError: { message: string } | null = null

  if (contextFrom !== undefined && contextFrom.length === 0) {
    // Process 1 or any process that explicitly needs no prior context
    jobs = []
  } else if (contextFrom !== undefined && contextFrom.length > 0) {
    // Fetch only the specific prior process outputs listed in contextFrom
    const result = await supabase
      .from('squad_jobs')
      .select('output, processes!inner(process_number, name), phases!inner(phase_number)')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .not('output', 'is', null)
      .in('processes.process_number', contextFrom)
      .order('phases(phase_number)', { ascending: true })
      .order('processes(process_number)', { ascending: true })
    jobs = result.data
    jobsError = result.error
  } else {
    // Legacy fallback: all completed outputs from prior phases + same-phase earlier processes
    // Includes: all completed outputs from prior phases + same phase processes with lower number
    // This lets Process 2 see Process 1's output within the same phase.
    const result = await supabase
      .from('squad_jobs')
      .select('output, processes!inner(process_number, name), phases!inner(phase_number)')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .not('output', 'is', null)
      .lte('phases.phase_number', currentPhaseNumber)
      .lt('processes.process_number', processNumber)
      .order('phases(phase_number)', { ascending: true })
      .order('processes(process_number)', { ascending: true })
    jobs = result.data
    jobsError = result.error
  }

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

  // Step 4: Split outputs into file-based and DB-based
  // For each output, check if the file exists on disk.
  // If it does, use the @mention path. Otherwise, keep the DB text as fallback.
  const priorOutputFilePaths: string[] = []
  const dbFallbackOutputs: ProcessOutput[] = []

  for (const output of allOutputs) {
    // Look up the process name from PROCESS_DEFINITIONS if available, else use the DB name
    const processDef = PROCESS_DEFINITIONS[output.processNumber]
    const nameForPath = processDef?.name ?? output.processName
    if (processOutputFileExists(clientId, output.processNumber, nameForPath)) {
      priorOutputFilePaths.push(getProcessOutputFilePath(clientId, output.processNumber, nameForPath))
    } else {
      dbFallbackOutputs.push(output)
    }
  }

  // Step 5: Truncation (D-06) — only applies to DB fallback outputs (file-based outputs don't count against budget)
  // TMPL-03: Template content counts against the truncation budget
  const templateStr = templateContent ?? ''
  const priorOutputs = [...dbFallbackOutputs]
  let truncated = false

  const computeTotal = () =>
    briefing.length + feedback.length + templateStr.length + priorOutputs.reduce((sum, o) => sum + o.output.length, 0)

  while (computeTotal() > MAX_CONTEXT_CHARS && priorOutputs.length > 1) {
    priorOutputs.shift() // Remove the oldest (first) output
    truncated = true
  }

  // Step 6: Return assembled context
  return {
    briefing,
    priorOutputs,
    priorOutputFilePaths,
    feedbackContext: feedback,
    templateContent: templateStr,
    truncated,
    totalOutputsAvailable,
    outputsIncluded: priorOutputs.length + priorOutputFilePaths.length,
  }
}
