/**
 * Agency OS: Stuck job recovery heartbeat (D-08, D-09)
 *
 * Detects jobs stuck in 'running' state for more than TIMEOUT_MS (30 minutes)
 * and kills/re-queues them. Called on worker startup and every 5 minutes.
 *
 * Full implementation in Task 3. This stub satisfies the import requirement
 * for index.ts during Task 2 (will be replaced in Task 3).
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
 */
export async function recoverStuckJobs(
  supabase: SupabaseClient,
  activeJobs: Map<string, ChildProcess>,
  onFailure: FailureHandler
): Promise<void> {
  // Implementation in Task 3
  void supabase
  void activeJobs
  void onFailure
}
