/**
 * Unit tests for retry / exponential backoff in src/worker/job-runner.ts
 *
 * Wave 0 stubs — test handleFailure() retry behavior.
 * Tests will fail RED until job-runner.ts is implemented.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SquadJob } from '@/lib/database/schema'

// ============================================================
// MOCK SETUP
// ============================================================

vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
    kill: vi.fn(),
  })),
}))

// ============================================================
// handleFailure tests
// ============================================================

describe('handleFailure — retry with exponential backoff', () => {
  let handleFailure: (
    job: SquadJob,
    stdout: string,
    stderr: string,
    supabase: unknown,
    retryCallback?: () => void
  ) => Promise<void>

  const baseJob: SquadJob = {
    id: '00000000-0000-0000-0000-000000000001',
    client_id: '00000000-0000-0000-0000-000000000002',
    phase_id: '00000000-0000-0000-0000-000000000003',
    process_id: null,
    squad_type: 'estrategia',
    status: 'running',
    cli_command: 'Write a haiku',
    progress_log: null,
    output: null,
    error_log: null,
    attempts: 0,
    max_attempts: 3,
    started_at: new Date().toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()

    const module = await import('../../src/worker/job-runner')
    handleFailure = module.handleFailure
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('re-queues job with status=queued and increments attempts to 1 when attempts=0, max_attempts=3', async () => {
    const updateEqMock = vi.fn(() => Promise.resolve({ error: null }))
    const updateMock = vi.fn(() => ({ eq: updateEqMock }))
    const fromMock = vi.fn(() => ({ update: updateMock }))
    const supabase = { from: fromMock }

    const job = { ...baseJob, attempts: 0, max_attempts: 3 }
    const retryCallback = vi.fn()

    await handleFailure(job, '', 'some error', supabase, retryCallback)

    // Should have updated status to 'queued' with attempts=1
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'queued',
        attempts: 1,
      })
    )
  })

  it('marks job status=failed when attempts=2 and max_attempts=3 (exhausted)', async () => {
    const updateEqMock = vi.fn(() => Promise.resolve({ error: null }))
    const updateMock = vi.fn(() => ({ eq: updateEqMock }))
    const fromMock = vi.fn(() => ({ update: updateMock }))
    const supabase = { from: fromMock }

    const job = { ...baseJob, attempts: 2, max_attempts: 3 }

    await handleFailure(job, '', 'some error', supabase)

    // newAttempts = 3 >= max_attempts 3 → should mark failed
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        attempts: 3,
      })
    )
  })

  it('computes correct backoff delay: attempts=1 → 60000ms (2^1 × 30000)', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    const updateEqMock = vi.fn(() => Promise.resolve({ error: null }))
    const updateMock = vi.fn(() => ({ eq: updateEqMock }))
    const fromMock = vi.fn(() => ({ update: updateMock }))
    const supabase = { from: fromMock }

    const job = { ...baseJob, attempts: 1, max_attempts: 3 }
    const retryCallback = vi.fn()

    await handleFailure(job, '', 'error', supabase, retryCallback)

    // newAttempts = 2, delay = 2^2 × 30000 = 120000ms
    // Wait — for attempts=1 (incoming), newAttempts=2, delay = 2^2 * 30_000 = 120_000
    // But the test says attempts=1 → 60000ms based on plan: "backoff delay for attempts=1 is 60000ms (2^1 × 30000)"
    // The plan says attempts=1 here means newAttempts=1 (job.attempts=0 → newAttempts=1 → delay=2^1*30000=60000)
    // Let me check: the plan says "attempts=1 is 60000ms" which means newAttempts=1 → delay=2^1*30000=60000
    // For job.attempts=1 (incoming), newAttempts=2, delay=2^2*30000=120000

    // Per plan spec: "backoff delay for attempts=1 is 60000ms (2^1 × 30000), attempts=2 is 120000ms"
    // This refers to the newAttempts value (after incrementing)
    // If job.attempts=0 → newAttempts=1 → delay=60000
    const jobWith0Attempts = { ...baseJob, attempts: 0, max_attempts: 3 }
    const retryCallback2 = vi.fn()

    await handleFailure(jobWith0Attempts, '', 'error', supabase, retryCallback2)

    // Check that setTimeout was called with 60000ms delay for newAttempts=1
    const timeoutCalls = setTimeoutSpy.mock.calls
    const called60000 = timeoutCalls.some(([, delay]) => delay === 60_000)
    expect(called60000).toBe(true)
  })

  it('computes correct backoff delay: attempts=2 → 120000ms (2^2 × 30000)', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    const updateEqMock = vi.fn(() => Promise.resolve({ error: null }))
    const updateMock = vi.fn(() => ({ eq: updateEqMock }))
    const fromMock = vi.fn(() => ({ update: updateMock }))
    const supabase = { from: fromMock }

    // job.attempts=1 → newAttempts=2 → delay=2^2*30000=120000
    const job = { ...baseJob, attempts: 1, max_attempts: 3 }
    const retryCallback = vi.fn()

    await handleFailure(job, '', 'error', supabase, retryCallback)

    const timeoutCalls = setTimeoutSpy.mock.calls
    const called120000 = timeoutCalls.some(([, delay]) => delay === 120_000)
    expect(called120000).toBe(true)
  })
})
