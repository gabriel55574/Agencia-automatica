/**
 * Agency OS: Feedback extraction for pipeline cycle loop.
 *
 * Extracts Phase 5 (Retencao e Escala) outputs from a client's previous
 * cycle and formats them as structured feedback context for Phase 1
 * re-execution. This is the core of the feedback loop -- Phase 5 insights
 * feed back into Phase 1 when a client starts a new cycle.
 *
 * Key behaviors:
 * - Returns empty string for cycle_number=1 clients (no previous cycle data)
 * - Extracts NPS, CLV, and retention metrics from process-16 structured_output
 * - Falls back to raw output when structured_output parsing fails
 * - Includes all Phase 5 completed job outputs in a "Full Retention Outputs" section
 *
 * Security (T-09-02): All queries scope with WHERE client_id = $1.
 * No cross-client data leakage possible. Follows same pattern as assembler.ts.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { process16Schema } from '@/lib/squads/schemas/process-16'

/**
 * Extracts feedback context from a client's previous pipeline cycle.
 *
 * For cycle 1 clients, returns empty string (no previous data).
 * For cycle 2+ clients, returns a formatted string with NPS insights,
 * CLV metrics, retention analysis, and full Phase 5 outputs.
 *
 * @param clientId - The UUID of the client
 * @param supabaseClient - Optional Supabase client for dependency injection (testing)
 * @returns Formatted feedback context string, or empty string if not applicable
 */
export async function extractFeedbackContext(
  clientId: string,
  supabaseClient?: SupabaseClient
): Promise<string> {
  const supabase = supabaseClient ?? createAdminClient()

  // Step 1: Check cycle_number. If cycle 1, no previous data exists.
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('cycle_number')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    throw new Error(clientError?.message ?? 'Client not found')
  }

  const cycleNumber = client.cycle_number as number
  if (cycleNumber <= 1) {
    return ''
  }

  // Step 2: Fetch the most recent completed process-16 job (Phase 5)
  // Uses inner joins through processes and phases to filter by phase_number=5 and process_number=16
  const { data: process16Job, error: p16Error } = await supabase
    .from('squad_jobs')
    .select('output, structured_output, processes!inner(process_number, name), phases!inner(phase_number)')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .not('output', 'is', null)
    .eq('phases.phase_number', 5)
    .eq('processes.process_number', 16)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (p16Error) {
    throw new Error(p16Error.message)
  }

  // Step 3: Fetch ALL completed Phase 5 jobs for the full retention outputs section
  const { data: phase5Jobs, error: p5Error } = await supabase
    .from('squad_jobs')
    .select('output, processes!inner(process_number, name), phases!inner(phase_number)')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .not('output', 'is', null)
    .eq('phases.phase_number', 5)
    .order('processes(process_number)', { ascending: true })

  if (p5Error) {
    throw new Error(p5Error.message)
  }

  // If no Phase 5 jobs exist at all, return empty string
  if (!process16Job && (!phase5Jobs || phase5Jobs.length === 0)) {
    return ''
  }

  // Step 4: Build the feedback context string
  const parts: string[] = []
  parts.push('[FEEDBACK FROM PREVIOUS CYCLE]')
  parts.push(`Cycle: ${cycleNumber - 1}`)
  parts.push('')

  // Step 4a: Extract structured NPS/CLV data from process-16 if available
  if (process16Job) {
    const structuredOutput = (process16Job as Record<string, unknown>).structured_output
    const parseResult = structuredOutput ? process16Schema.safeParse(structuredOutput) : null

    if (parseResult && parseResult.success) {
      const data = parseResult.data

      parts.push('NPS Insights:')
      parts.push(`Promoters: ${data.nps_analysis.promoters}`)
      parts.push(`Detractors: ${data.nps_analysis.detractors}`)
      parts.push(`Passives: ${data.nps_analysis.passives}`)
      parts.push('')

      parts.push('CLV Metrics:')
      parts.push(JSON.stringify(data.clv_by_segment, null, 2))
      parts.push('')

      parts.push('Retention vs Acquisition:')
      parts.push(data.retention_vs_acquisition)
      parts.push('')
    } else {
      // Fallback: structured extraction failed or structured_output is null
      parts.push('Structured extraction unavailable -- raw output included.')
      parts.push('')
      parts.push((process16Job as Record<string, unknown>).output as string)
      parts.push('')
    }
  }

  // Step 4b: Full Retention Outputs section with all Phase 5 job outputs
  if (phase5Jobs && phase5Jobs.length > 0) {
    parts.push('Full Retention Outputs:')
    for (const job of phase5Jobs) {
      const processes = (job as Record<string, unknown>).processes as { process_number: number; name: string }
      parts.push(`--- Process ${processes.process_number}: ${processes.name} ---`)
      parts.push((job as Record<string, unknown>).output as string)
      parts.push('')
    }
  }

  return parts.join('\n').trim()
}
