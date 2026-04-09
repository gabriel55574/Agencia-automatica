/**
 * Agency OS: Stuck job recovery heartbeat (D-08, D-09, T-04-04)
 *
 * Detects jobs stuck in 'running' state for more than TIMEOUT_MS (30 minutes)
 * and kills/re-queues them via the provided failure handler.
 *
 * Called on worker startup (to recover from worker crashes) and every 5 minutes
 * during normal operation via setInterval in index.ts (D-09).
 *
 * Security note (T-04-04): 30-minute timeout hardcoded per D-08 decision
 * (NOT configurable via env var to avoid misconfiguration in v1).
 */

import type { ChildProcess } from 'child_process'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SquadJob } from '../lib/database/schema'

/** 30-minute timeout — hardcoded per D-08, NOT from env var */
export const TIMEOUT_MS = 30 * 60_000

type FailureHandler = (
  job: SquadJob,
  stdout: string,
  stderr: string,
  supabase: SupabaseClient,
  retryCallback?: () => void
) => Promise<void>

/**
 * Find jobs stuck in 'running' for more than TIMEOUT_MS, kill them, and
 * invoke the failure handler so they can be retried or marked failed (D-06).
 *
 * @param supabase - Supabase admin client to query squad_jobs table
 * @param activeJobs - In-memory map of job.id → ChildProcess (for SIGTERM)
 * @param onFailure - Failure handler (handleFailure from job-runner.ts)
 */
export async function recoverStuckJobs(
  supabase: SupabaseClient,
  activeJobs: Map<string, ChildProcess>,
  onFailure: FailureHandler
): Promise<void> {
  const cutoff = new Date(Date.now() - TIMEOUT_MS).toISOString()

  // Query for jobs stuck in 'running' state beyond the timeout threshold
  const { data: stuckJobs, error } = await supabase
    .from('squad_jobs')
    .select('*')
    .eq('status', 'running')
    .lt('started_at', cutoff)

  if (error) {
    process.stdout.write(`[worker] heartbeat query error: ${error.message}\n`)
    return
  }

  for (const job of stuckJobs ?? []) {
    process.stdout.write(`[worker] Stuck job detected: ${job.id} (started_at: ${job.started_at})\n`)

    // Kill the process if still tracked in this worker's active jobs Map (T-04-04)
    const proc = activeJobs.get(job.id)
    if (proc) {
      proc.kill('SIGTERM')
      activeJobs.delete(job.id)
    }

    // Mark the job as failed (or retry if attempts remain) via the D-06 handler
    await onFailure(job as SquadJob, '', 'Job timed out after 30 minutes', supabase)
  }
}
