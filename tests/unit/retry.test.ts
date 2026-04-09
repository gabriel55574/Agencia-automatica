/**
 * Unit tests for retry / exponential backoff in src/worker/job-runner.ts
 *
 * Wave 0 stubs → GREEN after implementation.
 * Tests handleFailure() retry behavior.
 *
 * Note: Test UUIDs use RFC 4122 v4 format.
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
  ChildProcess: class {},
}))

import { handleFailure } from '../../src/worker/job-runner'

// ============================================================
// Test fixtures — RFC 4122 v4 compliant UUIDs
// ============================================================

const baseJob: SquadJob = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  client_id: '550e8400-e29b-41d4-a716-446655440002',
  phase_id: '550e8400-e29b-41d4-a716-446655440003',
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

function makeMockSupabase() {
  const eqMock = vi.fn(() => Promise.resolve({ error: null }))
  const updateMock = vi.fn(() => ({ eq: eqMock }))
  const fromMock = vi.fn(() => ({ update: updateMock }))
  return { supabase: { from: fromMock }, updateMock }
}

// ============================================================
// handleFailure tests
// ============================================================

describe('handleFailure — retry with exponential backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('re-queues job with status=queued and increments attempts to 1 when attempts=0, max_attempts=3', async () => {
    const { supabase, updateMock } = makeMockSupabase()

    const job = { ...baseJob, attempts: 0, max_attempts: 3 }
    const retryCallback = vi.fn()

    await handleFailure(job, '', 'some error', supabase as unknown as Parameters<typeof handleFailure>[3], retryCallback)

    // Should have updated status to 'queued' with attempts=1
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'queued',
        attempts: 1,
      })
    )
  })

  it('marks job status=failed when attempts=2 and max_attempts=3 (exhausted)', async () => {
    const { supabase, updateMock } = makeMockSupabase()

    // newAttempts = 3 >= max_attempts 3 → should mark failed
    const job = { ...baseJob, attempts: 2, max_attempts: 3 }

    await handleFailure(job, '', 'some error', supabase as unknown as Parameters<typeof handleFailure>[3])

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        attempts: 3,
      })
    )
  })

  it('computes correct backoff delay: newAttempts=1 → 60000ms (2^1 × 30000)', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    const { supabase } = makeMockSupabase()

    // job.attempts=0 → newAttempts=1 → delay=2^1*30000=60000
    const job = { ...baseJob, attempts: 0, max_attempts: 3 }
    const retryCallback = vi.fn()

    await handleFailure(job, '', 'error', supabase as unknown as Parameters<typeof handleFailure>[3], retryCallback)

    const timeoutCalls = setTimeoutSpy.mock.calls
    const called60000 = timeoutCalls.some(([, delay]) => delay === 60_000)
    expect(called60000).toBe(true)
  })

  it('computes correct backoff delay: newAttempts=2 → 120000ms (2^2 × 30000)', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    const { supabase } = makeMockSupabase()

    // job.attempts=1 → newAttempts=2 → delay=2^2*30000=120000
    const job = { ...baseJob, attempts: 1, max_attempts: 3 }
    const retryCallback = vi.fn()

    await handleFailure(job, '', 'error', supabase as unknown as Parameters<typeof handleFailure>[3], retryCallback)

    const timeoutCalls = setTimeoutSpy.mock.calls
    const called120000 = timeoutCalls.some(([, delay]) => delay === 120_000)
    expect(called120000).toBe(true)
  })
})
