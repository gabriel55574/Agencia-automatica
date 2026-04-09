/**
 * Agency OS: Claude CLI job runner
 *
 * Handles spawning the Claude Code CLI as a child process, streaming stdout
 * to squad_jobs.progress_log every 5 seconds (D-03), and marking jobs
 * complete or failed on process exit (D-06).
 *
 * Security note (T-04-01): cli_command is passed as a positional arg to spawn()
 * — NOT via shell. Node.js spawn() does NOT invoke a shell when given an array
 * of args, making shell injection impossible. NEVER use exec() or shell:true here.
 */

import { spawn, ChildProcess } from 'child_process'
import type { SupabaseClient } from '@supabase/supabase-js'
import { squadJobSchema } from '../lib/database/schema'
import type { SquadJob } from '../lib/database/schema'
import { parseCliOutput, parseStructuredOutput } from './output-parser'

export type { SquadJob }

/**
 * Determine if the Claude CLI output indicates an error.
 *
 * Finds the first line that starts with '{', parses it as JSON, and checks
 * the is_error field. Returns true if no JSON line is found, JSON.parse throws,
 * or is_error is true.
 *
 * @param stdout - Accumulated stdout from the Claude CLI process
 * @returns true if the CLI run resulted in an error
 */
export function isCliError(stdout: string): boolean {
  try {
    const jsonLine = stdout.split('\n').find((l) => l.trim().startsWith('{'))
    if (!jsonLine) return true
    const result = JSON.parse(jsonLine)
    return result.is_error === true
  } catch {
    return true
  }
}

/**
 * Handle job failure: retry with exponential backoff (D-06) or mark failed.
 *
 * Backoff formula: delay = 2^newAttempts × 30_000ms
 *   - newAttempts=1 → 60_000ms (60s)
 *   - newAttempts=2 → 120_000ms (120s)
 *   - newAttempts=3 → 240_000ms (240s)
 *
 * @param job - The failed SquadJob
 * @param stdout - Accumulated stdout at time of failure
 * @param stderr - Accumulated stderr at time of failure
 * @param supabase - Supabase admin client
 * @param retryCallback - Optional callback to call after scheduling retry (avoids circular import)
 */
export async function handleFailure(
  job: SquadJob,
  stdout: string,
  stderr: string,
  supabase: SupabaseClient,
  retryCallback?: () => void
): Promise<void> {
  const newAttempts = job.attempts + 1

  if (newAttempts >= job.max_attempts) {
    // Exhausted retries — mark permanently failed
    await supabase
      .from('squad_jobs')
      .update({
        status: 'failed',
        error_log: stderr || stdout,
        attempts: newAttempts,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
    return
  }

  // Re-queue with exponential backoff: 2^newAttempts × 30_000ms
  const delayMs = Math.pow(2, newAttempts) * 30_000

  await supabase
    .from('squad_jobs')
    .update({
      status: 'queued',
      error_log: stderr || stdout,
      attempts: newAttempts,
    })
    .eq('id', job.id)

  // Schedule retry trigger via callback to avoid circular dependency with index.ts
  if (retryCallback) {
    setTimeout(retryCallback, delayMs)
  }
}

/**
 * Spawn the Claude CLI for a squad job.
 *
 * Security note (T-04-01): Uses spawn() with an array of args — no shell.
 * The cli_command is passed as the last positional argument to the claude binary.
 * stdio: ['ignore', 'pipe', 'pipe'] closes stdin immediately (eliminates 3s warning).
 *
 * @param job - The SquadJob to run (must have status='running')
 * @param supabase - Supabase admin client for progress_log writes
 * @param activeJobs - In-memory map of job.id → ChildProcess for concurrency tracking
 * @param retryCallback - Callback to trigger tryClaimAndRun after failure backoff
 */
export async function runJob(
  job: SquadJob,
  supabase: SupabaseClient,
  activeJobs: Map<string, ChildProcess>,
  retryCallback?: () => void
): Promise<void> {
  // Validate the job object before proceeding
  const parsed = squadJobSchema.safeParse(job)
  if (!parsed.success) {
    process.stdout.write(
      `[worker] INVALID JOB ${job.id}: ${parsed.error.message}\n`
    )
    return
  }

  const args = [
    '--print',
    '--output-format',
    'json',
    '--no-session-persistence',
    '--permission-mode',
    'auto',
    job.cli_command ?? 'No command specified',
  ]

  // CRITICAL: stdio: ['ignore', 'pipe', 'pipe'] — closes stdin immediately
  // This eliminates the "Warning: no stdin data received in 3s" message
  // T-04-01: spawn() with array args does NOT invoke a shell — shell injection impossible
  const proc = spawn('claude', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  activeJobs.set(job.id, proc)

  let stdoutBuffer = ''
  let stderrBuffer = ''

  proc.stdout!.on('data', (chunk: Buffer) => {
    stdoutBuffer += chunk.toString()
  })

  proc.stderr!.on('data', (chunk: Buffer) => {
    stderrBuffer += chunk.toString()
  })

  // Batch flush progress_log to DB every 5 seconds (D-03)
  const flushInterval = setInterval(async () => {
    if (stdoutBuffer) {
      await supabase
        .from('squad_jobs')
        .update({ progress_log: stdoutBuffer })
        .eq('id', job.id)
    }
  }, 5_000)

  proc.on('close', async (exitCode) => {
    clearInterval(flushInterval)
    activeJobs.delete(job.id)

    const success = exitCode === 0 && !isCliError(stdoutBuffer)

    if (success) {
      // Phase 5: Parse structured output from CLI response
      const parsedContent = parseCliOutput(stdoutBuffer)
      let structuredOutput: unknown = null

      if (parsedContent !== null && job.process_id) {
        // Need process_number to select correct schema
        // Query it from processes table
        const { data: processRow } = await supabase
          .from('processes')
          .select('process_number')
          .eq('id', job.process_id)
          .single()

        if (processRow) {
          const result = parseStructuredOutput(parsedContent, processRow.process_number)
          if (result.success) {
            structuredOutput = result.data
          } else {
            // Log parse failure but don't fail the job
            process.stdout.write(
              `[worker] Structured output parse failed for job ${job.id}: ${result.error}\n`
            )
          }
        }
      }

      // Phase 6: Gate review jobs — parse verdict and store in gate_reviews table
      if (job.squad_type === 'gate_review') {
        const gateReviewParsed = parseCliOutput(stdoutBuffer)
        if (gateReviewParsed !== null) {
          // Dynamic import: worker runs outside Next.js bundler, use relative path
          const { GateReviewVerdictSchema } = await import(
            '../lib/gates/review-schema'
          )
          const verdictResult = GateReviewVerdictSchema.safeParse(gateReviewParsed)

          if (verdictResult.success) {
            await supabase
              .from('gate_reviews')
              .update({
                verdict: verdictResult.data,
                raw_output: stdoutBuffer,
                status: 'completed',
              })
              .eq('squad_job_id', job.id)
          } else {
            // Parse failed — store raw output and parse error, mark as failed
            process.stdout.write(
              `[worker] Gate review verdict parse failed for job ${job.id}: ${verdictResult.error.message}\n`
            )
            await supabase
              .from('gate_reviews')
              .update({
                verdict: {
                  parse_error: verdictResult.error.message,
                  raw: gateReviewParsed,
                },
                raw_output: stdoutBuffer,
                status: 'failed',
              })
              .eq('squad_job_id', job.id)
          }
        } else {
          // CLI output not parseable at all
          await supabase
            .from('gate_reviews')
            .update({
              verdict: { parse_error: 'CLI output could not be parsed' },
              raw_output: stdoutBuffer,
              status: 'failed',
            })
            .eq('squad_job_id', job.id)
        }
      }

      await supabase
        .from('squad_jobs')
        .update({
          status: 'completed',
          output: stdoutBuffer,
          structured_output: structuredOutput,
          progress_log: stdoutBuffer,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
    } else {
      // Phase 6: On failure, update gate_reviews status for gate_review jobs
      if (job.squad_type === 'gate_review') {
        await supabase
          .from('gate_reviews')
          .update({
            verdict: {
              error: 'Job failed',
              stderr: stderrBuffer.slice(0, 2000),
            },
            raw_output: stdoutBuffer,
            status: 'failed',
          })
          .eq('squad_job_id', job.id)
      }
      await handleFailure(job, stdoutBuffer, stderrBuffer, supabase, retryCallback)
    }
  })
}
