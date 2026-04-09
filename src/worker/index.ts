/**
 * Agency OS: Background job worker — main entry point
 *
 * PM2 spawns this process as 'job-worker' (see ecosystem.config.js, D-01).
 * This module:
 *   1. Subscribes to squad_jobs INSERT events via Supabase Realtime (D-02)
 *   2. Polls claim_next_job() every 5 seconds as a fallback (D-02)
 *   3. Enforces concurrency limit (MAX_CONCURRENT=2) before every job claim (SQAD-08, T-04-03)
 *   4. Wires heartbeat recovery on startup and every 5 minutes (D-09, T-04-04)
 *   5. Handles SIGTERM gracefully by killing active processes (T-04-03)
 *
 * CRITICAL: Use RELATIVE imports only. '@/' aliases require Next.js bundler context.
 * tsx runs this file outside Next.js — path aliases will fail without explicit mapping.
 */

import { ChildProcess } from 'child_process'
import { createAdminClient } from '../lib/supabase/admin'
import { runJob, handleFailure } from './job-runner'
import { recoverStuckJobs } from './heartbeat'

// ============================================================
// CONCURRENCY CONFIG (SQAD-08, T-04-03)
// ============================================================
const MAX_CONCURRENT = 2

// ============================================================
// ACTIVE JOBS MAP
// Tracks spawned ChildProcess objects by job.id.
// Used for SIGTERM cleanup and heartbeat timeout enforcement.
// ============================================================
export const activeJobs = new Map<string, ChildProcess>()

// ============================================================
// SUPABASE ADMIN CLIENT
// Uses service role key — reads NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY from process.env (set in VPS or PM2 env block).
// ============================================================
const supabase = createAdminClient()

// ============================================================
// tryClaimAndRun — concurrency guard + atomic job claim
// ============================================================

/**
 * Check concurrency limit, atomically claim one queued job, and run it.
 *
 * Exported so it can be passed as a callback to handleFailure (avoids
 * circular import: job-runner → index).
 */
export async function tryClaimAndRun(): Promise<void> {
  // Count currently running jobs (D-02 concurrency guard, SQAD-08)
  const { count } = await supabase
    .from('squad_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'running')

  if ((count ?? 0) >= MAX_CONCURRENT) return

  // Atomically claim the next queued job via FOR UPDATE SKIP LOCKED (T-04-01)
  const { data: jobs, error } = await supabase.rpc('claim_next_job')
  if (error) {
    process.stdout.write(`[worker] claim_next_job error: ${error.message}\n`)
    return
  }

  // claim_next_job() returns SETOF squad_jobs — take the first (or only) row
  const job = Array.isArray(jobs) ? jobs[0] : jobs
  if (!job) return

  // Fire-and-forget: runJob manages its own lifecycle via activeJobs Map
  // Pass tryClaimAndRun as retryCallback to avoid circular import in handleFailure
  runJob(job, supabase, activeJobs, tryClaimAndRun).catch((err) => {
    process.stdout.write(`[worker] runJob unhandled error for ${job.id}: ${String(err)}\n`)
  })
}

// ============================================================
// SUPABASE REALTIME SUBSCRIPTION (D-02)
// Subscribe to squad_jobs INSERT events with status=queued.
// Triggers tryClaimAndRun immediately on new job arrival.
// ============================================================
supabase
  .channel('squad-jobs-queue')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'squad_jobs',
      filter: 'status=eq.queued',
    },
    () => {
      tryClaimAndRun().catch((err) => {
        process.stdout.write(`[worker] Realtime trigger error: ${String(err)}\n`)
      })
    }
  )
  .subscribe()

// ============================================================
// POLLING FALLBACK (D-02)
// Runs every 5 seconds as a safety net for dropped Realtime connections
// or jobs enqueued while the subscription was temporarily down.
// ============================================================
setInterval(() => {
  tryClaimAndRun().catch((err) => {
    process.stdout.write(`[worker] Poll trigger error: ${String(err)}\n`)
  })
}, 5_000)

// ============================================================
// HEARTBEAT — stuck job recovery (D-09, T-04-04)
// Runs every 5 minutes. Also fires on startup to recover jobs
// that were running when the worker last crashed.
// ============================================================
setInterval(() => {
  recoverStuckJobs(supabase, activeJobs, handleFailure).catch((err) => {
    process.stdout.write(`[worker] Heartbeat error: ${String(err)}\n`)
  })
}, 5 * 60_000)

// Startup recovery — catch jobs stuck before this worker instance started (D-09)
recoverStuckJobs(supabase, activeJobs, handleFailure).catch((err) => {
  process.stdout.write(`[worker] Startup recovery error: ${String(err)}\n`)
})

// ============================================================
// STARTUP — pick up any queued jobs missed while worker was down
// ============================================================
tryClaimAndRun().catch((err) => {
  process.stdout.write(`[worker] Startup claim error: ${String(err)}\n`)
})

// ============================================================
// SIGTERM HANDLER — graceful shutdown (T-04-03)
// Kill all active CLI processes, then exit.
// PM2 sends SIGTERM before restarting the process.
// ============================================================
process.on('SIGTERM', () => {
  process.stdout.write('[worker] SIGTERM received — killing active jobs and shutting down\n')
  for (const [jobId, proc] of activeJobs.entries()) {
    process.stdout.write(`[worker] Killing job ${jobId}\n`)
    proc.kill('SIGTERM')
  }
  process.exit(0)
})

process.stdout.write('[worker] Agency OS job worker started\n')
