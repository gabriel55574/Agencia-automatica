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
import path from 'path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { squadJobSchema } from '../lib/database/schema'
import type { SquadJob } from '../lib/database/schema'
import { parseCliOutput, parseStructuredOutput } from './output-parser'

// Project root directory — worker runs from here so Claude Code picks up CLAUDE.md
const PROJECT_DIR = path.resolve(__dirname, '..', '..')
import { extractTokenUsage } from '../lib/costs/token-parser'
import { calculateCost } from '../lib/costs/constants'
import { notifySquadCompletion, notifyGateFailure } from '../lib/notifications/notify'
import type { SquadCompletionData, GateFailureData } from '../lib/notifications/types'
import { PHASE_NAMES, type PhaseNumber } from '../lib/database/enums'

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

    // NOTF-01: Notify operator of permanent squad failure (fire-and-forget)
    buildCompletionData(job, 'failed', supabase, stderr || stdout).then((data) => {
      if (data) {
        notifySquadCompletion(supabase, data, job.id).catch((err) => {
          process.stdout.write(`[worker] Notification error (failure): ${String(err)}\n`)
        })
      }
    }).catch((err) => {
      process.stdout.write(`[worker] Failed to build failure notification data: ${String(err)}\n`)
    })
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
 * Build SquadCompletionData by querying client and process info.
 * Returns null if queries fail (notification will be skipped).
 */
async function buildCompletionData(
  job: SquadJob,
  status: 'completed' | 'failed',
  supabase: SupabaseClient,
  errorExcerpt?: string
): Promise<SquadCompletionData | null> {
  const { data: client } = await supabase
    .from('clients')
    .select('name, company')
    .eq('id', job.client_id)
    .single()

  let processName = 'Unknown process'
  if (job.process_id) {
    const { data: proc } = await supabase
      .from('processes')
      .select('name')
      .eq('id', job.process_id)
      .single()
    if (proc) processName = proc.name
  }

  if (!client) return null

  return {
    client_name: client.name,
    client_company: client.company,
    process_name: processName,
    squad_type: job.squad_type,
    status,
    error_excerpt: errorExcerpt ? errorExcerpt.slice(0, 500) : null,
    completed_at: new Date().toISOString(),
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
    'stream-json',
    '--no-session-persistence',
    '--permission-mode',
    'auto',
    '--max-budget-usd',
    '5',
    job.cli_command ?? 'No command specified',
  ]

  process.stdout.write(`\n${'='.repeat(60)}\n`)
  process.stdout.write(`[worker] JOB ${job.id.slice(0, 8)} — squad: ${job.squad_type}\n`)
  process.stdout.write(`${'='.repeat(60)}\n\n`)

  // T-04-01: spawn() with array args does NOT invoke a shell — shell injection impossible
  const proc = spawn('claude', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: PROJECT_DIR,
    env: { ...process.env },
  })

  activeJobs.set(job.id, proc)

  let stdoutBuffer = ''
  let stderrBuffer = ''
  let lastResultEvent: string | null = null
  let flushPending = false

  // Flush progress_log to DB immediately after each parsed event (debounced 300ms)
  // so the worker monitor UI updates in near-realtime as Claude works.
  function scheduleFlush() {
    if (flushPending) return
    flushPending = true
    setTimeout(async () => {
      flushPending = false
      if (stdoutBuffer) {
        await supabase
          .from('squad_jobs')
          .update({ progress_log: stdoutBuffer })
          .eq('id', job.id)
      }
    }, 300)
  }

  proc.stdout!.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    stdoutBuffer += text

    // Parse stream-json events and show live progress in terminal
    let hasEvent = false
    for (const line of text.split('\n')) {
      if (!line.trim()) continue
      try {
        const event = JSON.parse(line)
        if (event.type === 'assistant' && event.message?.content) {
          hasEvent = true
          for (const block of event.message.content) {
            if (block.type === 'text' && block.text) {
              process.stdout.write(`[claude] ${block.text}\n`)
            } else if (block.type === 'tool_use') {
              process.stdout.write(`[tool]   ${block.name}(${JSON.stringify(block.input, null, 2)})\n`)
            } else if (block.type === 'tool_result') {
              const content = Array.isArray(block.content)
                ? block.content.map((c: { text?: string }) => c.text ?? '').join('')
                : String(block.content ?? '')
              process.stdout.write(`[result] ${content}\n`)
            }
          }
        } else if (event.type === 'result') {
          lastResultEvent = line
          hasEvent = true
        }
      } catch {
        // Not JSON or partial line — skip
      }
    }

    // Flush to DB whenever a meaningful event was parsed
    if (hasEvent) scheduleFlush()
  })

  proc.stderr!.on('data', (chunk: Buffer) => {
    stderrBuffer += chunk.toString()
  })

  // Fallback flush every 5 seconds to catch any buffered output not yet flushed
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

    process.stdout.write(`\n[worker] JOB ${job.id.slice(0, 8)} finished — exit code: ${exitCode}\n`)

    // With stream-json, the final result comes as a separate event line
    // Fall back to scanning the full buffer if no result event was captured
    const outputToParse = lastResultEvent ?? stdoutBuffer
    const success = exitCode === 0 && !isCliError(outputToParse)

    if (success) {
      // Phase 5: Parse structured output from CLI response
      const parsedContent = parseCliOutput(outputToParse)
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
        const gateReviewParsed = parseCliOutput(outputToParse)
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
                raw_output: outputToParse,
                status: 'completed',
              })
              .eq('squad_job_id', job.id)

            // NOTF-02: Notify on gate failure/partial (fire-and-forget)
            if (verdictResult.data.overall === 'fail' || verdictResult.data.overall === 'partial') {
              ;(async () => {
                try {
                  const { data: client } = await supabase
                    .from('clients')
                    .select('name, company')
                    .eq('id', job.client_id)
                    .single()

                  if (client) {
                    const gateData: GateFailureData = {
                      client_name: client.name,
                      client_company: client.company,
                      phase_name: PHASE_NAMES[verdictResult.data.gate_number as PhaseNumber] || `Phase ${verdictResult.data.gate_number}`,
                      gate_number: verdictResult.data.gate_number,
                      overall_verdict: verdictResult.data.overall as 'fail' | 'partial',
                      failed_items_count: verdictResult.data.items.filter((i: { verdict: string }) => i.verdict === 'fail').length,
                      total_items_count: verdictResult.data.items.length,
                      summary: verdictResult.data.summary,
                    }

                    const { data: gateReviewRow } = await supabase
                      .from('gate_reviews')
                      .select('id')
                      .eq('squad_job_id', job.id)
                      .single()

                    await notifyGateFailure(supabase, gateData, gateReviewRow?.id || job.id)
                  }
                } catch (err) {
                  process.stdout.write(`[worker] Failed to build gate failure notification data: ${String(err)}\n`)
                }
              })()
            }
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
                raw_output: outputToParse,
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
              raw_output: outputToParse,
              status: 'failed',
            })
            .eq('squad_job_id', job.id)
        }
      }

      // Phase 12: Extract token usage from CLI output for cost tracking (COST-01)
      const tokenUsage = extractTokenUsage(outputToParse)
      const tokenCount = tokenUsage?.total_tokens ?? null
      const estimatedCost = calculateCost(tokenCount)

      if (tokenUsage) {
        process.stdout.write(
          `[worker] Job ${job.id}: ${tokenUsage.total_tokens} tokens, ~$${estimatedCost?.toFixed(2)}\n`
        )
      }

      await supabase
        .from('squad_jobs')
        .update({
          status: 'completed',
          output: stdoutBuffer,
          structured_output: structuredOutput,
          progress_log: stdoutBuffer,
          completed_at: new Date().toISOString(),
          token_count: tokenCount,           // Phase 12: COST-01
          estimated_cost_usd: estimatedCost,  // Phase 12: COST-01
        })
        .eq('id', job.id)

      // Mark the process as completed so next processes can see this output
      if (job.process_id) {
        await supabase
          .from('processes')
          .update({
            status: 'completed',
            output_json: structuredOutput,
            output_markdown: typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent),
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.process_id)
      }

      // Write output to file for file-based context system
      if (job.process_id && parsedContent) {
        try {
          const { data: processData } = await supabase
            .from('processes')
            .select('process_number, name')
            .eq('id', job.process_id)
            .single()

          if (processData) {
            const { getProcessOutputFilePath, getClientOutputDir } = await import('@/lib/squads/output-files')
            const fsPromises = await import('fs/promises')
            await fsPromises.mkdir(getClientOutputDir(job.client_id), { recursive: true })
            const filePath = getProcessOutputFilePath(job.client_id, processData.process_number, processData.name)
            const fileContent = typeof parsedContent === 'string'
              ? parsedContent
              : JSON.stringify(parsedContent, null, 2)
            await fsPromises.writeFile(filePath, fileContent, 'utf-8')
            process.stdout.write(`[worker] Output saved to file: ${filePath}\n`)
          }
        } catch (err) {
          process.stdout.write(`[worker] Warning: could not write output file: ${String(err)}\n`)
        }
      }

      // NOTF-01: Notify operator of squad completion (fire-and-forget)
      buildCompletionData(job, 'completed', supabase).then((data) => {
        if (data) {
          notifySquadCompletion(supabase, data, job.id).catch((err) => {
            process.stdout.write(`[worker] Notification error (completion): ${String(err)}\n`)
          })
        }
      }).catch((err) => {
        process.stdout.write(`[worker] Failed to build completion notification data: ${String(err)}\n`)
      })
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
            raw_output: outputToParse,
            status: 'failed',
          })
          .eq('squad_job_id', job.id)
      }
      await handleFailure(job, outputToParse, stderrBuffer, supabase, retryCallback)
    }
  })
}
