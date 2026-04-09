/**
 * Unit tests for concurrency guard in src/worker/index.ts
 *
 * Wave 0 stubs — test the tryClaimAndRun() concurrency behavior.
 * Tests will fail RED until index.ts is implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================
// MOCK SETUP
// ============================================================

// Mock the job-runner module to avoid real child_process calls
vi.mock('../../src/worker/job-runner', () => ({
  runJob: vi.fn(() => Promise.resolve()),
  isCliError: vi.fn(() => false),
  handleFailure: vi.fn(() => Promise.resolve()),
}))

// Mock heartbeat module
vi.mock('../../src/worker/heartbeat', () => ({
  recoverStuckJobs: vi.fn(() => Promise.resolve()),
  TIMEOUT_MS: 1800000,
}))

// ============================================================
// Concurrency guard tests
// ============================================================

describe('tryClaimAndRun — concurrency guard', () => {
  let tryClaimAndRun: () => Promise<void>
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>
    rpc: ReturnType<typeof vi.fn>
    channel: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    vi.resetModules()

    // Re-mock child_process for each test
    vi.doMock('child_process', () => ({
      spawn: vi.fn(() => ({
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn(),
        pid: 99999,
      })),
    }))

    // Re-mock job-runner
    vi.doMock('../../src/worker/job-runner', () => ({
      runJob: vi.fn(() => Promise.resolve()),
      isCliError: vi.fn(() => false),
      handleFailure: vi.fn(() => Promise.resolve()),
    }))

    // Re-mock heartbeat
    vi.doMock('../../src/worker/heartbeat', () => ({
      recoverStuckJobs: vi.fn(() => Promise.resolve()),
      TIMEOUT_MS: 1800000,
    }))
  })

  it('returns without calling supabase.rpc when running job count >= MAX_CONCURRENT (2)', async () => {
    // Mock supabase that reports 2 running jobs (at concurrency limit)
    const rpcMock = vi.fn(() => Promise.resolve({ data: [], error: null }))
    const headMock = vi.fn(() => Promise.resolve({ count: 2, error: null }))
    const eqMock = vi.fn(() => ({ head: false, then: undefined, count: 2, error: null }))

    // Build the supabase chain: .from(...).select(..., { count: 'exact', head: true }).eq(...)
    const selectMock = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ count: 2, error: null })),
    }))
    const fromMock = vi.fn(() => ({ select: selectMock }))

    mockSupabase = {
      from: fromMock,
      rpc: rpcMock,
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
    }

    vi.doMock('../../src/lib/supabase/admin', () => ({
      createAdminClient: vi.fn(() => mockSupabase),
    }))

    const mod = await import('../../src/worker/index')
    tryClaimAndRun = mod.tryClaimAndRun

    await tryClaimAndRun()

    // supabase.rpc should NOT have been called because we are at the concurrency limit
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('calls supabase.rpc("claim_next_job") when running count < MAX_CONCURRENT (2)', async () => {
    // Mock supabase that reports 0 running jobs (below limit)
    const rpcMock = vi.fn(() => Promise.resolve({ data: [], error: null }))
    const selectMock = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
    }))
    const fromMock = vi.fn(() => ({ select: selectMock }))

    mockSupabase = {
      from: fromMock,
      rpc: rpcMock,
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
    }

    vi.doMock('../../src/lib/supabase/admin', () => ({
      createAdminClient: vi.fn(() => mockSupabase),
    }))

    const mod = await import('../../src/worker/index')
    tryClaimAndRun = mod.tryClaimAndRun

    await tryClaimAndRun()

    // supabase.rpc should have been called with 'claim_next_job'
    expect(rpcMock).toHaveBeenCalledWith('claim_next_job')
  })
})
