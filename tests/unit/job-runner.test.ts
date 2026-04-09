/**
 * Unit tests for src/worker/job-runner.ts
 *
 * Wave 0 stubs — these test the behavior of isCliError, runJob, and
 * the spawn integration. Tests will fail RED until job-runner.ts is implemented.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChildProcess } from 'child_process'
import type { SquadJob } from '@/lib/database/schema'

// ============================================================
// MOCK SETUP
// ============================================================

// Mock child_process module before importing job-runner
vi.mock('child_process', () => {
  const mockProc = {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
    kill: vi.fn(),
    pid: 12345,
  }
  return {
    spawn: vi.fn(() => mockProc),
    __mockProc: mockProc,
  }
})

// ============================================================
// isCliError tests
// ============================================================

describe('isCliError', () => {
  let isCliError: (stdout: string) => boolean

  beforeEach(async () => {
    // Dynamic import inside test to pick up fresh mocks
    const module = await import('../../src/worker/job-runner')
    isCliError = module.isCliError
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('returns false when JSON has is_error=false', () => {
    const stdout = '{"type":"result","is_error":false}'
    expect(isCliError(stdout)).toBe(false)
  })

  it('returns true when JSON has is_error=true', () => {
    const stdout = '{"type":"result","is_error":true}'
    expect(isCliError(stdout)).toBe(true)
  })

  it('returns true when stdout is not valid JSON', () => {
    const stdout = 'not json at all'
    expect(isCliError(stdout)).toBe(true)
  })

  it('returns true when stdout is empty string', () => {
    expect(isCliError('')).toBe(true)
  })

  it('returns false for valid JSON result embedded in other output', () => {
    const stdout = 'some hook output\n{"type":"result","is_error":false}\nmore output'
    expect(isCliError(stdout)).toBe(false)
  })
})

// ============================================================
// runJob tests
// ============================================================

describe('runJob', () => {
  let runJob: (job: SquadJob, supabase: unknown, activeJobs: Map<string, ChildProcess>) => Promise<void>
  let spawnMock: ReturnType<typeof vi.fn>
  let mockProc: {
    stdout: { on: ReturnType<typeof vi.fn> }
    stderr: { on: ReturnType<typeof vi.fn> }
    on: ReturnType<typeof vi.fn>
    kill: ReturnType<typeof vi.fn>
    pid: number
  }

  const mockJob: SquadJob = {
    id: '00000000-0000-0000-0000-000000000001',
    client_id: '00000000-0000-0000-0000-000000000002',
    phase_id: '00000000-0000-0000-0000-000000000003',
    process_id: null,
    squad_type: 'estrategia',
    status: 'running',
    cli_command: 'Write a haiku about marketing',
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

  const mockSupabase = {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  }

  beforeEach(async () => {
    vi.resetModules()
    const childProcess = await import('child_process')
    spawnMock = childProcess.spawn as ReturnType<typeof vi.fn>
    // @ts-expect-error accessing test helper
    mockProc = childProcess.__mockProc

    const module = await import('../../src/worker/job-runner')
    runJob = module.runJob
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls spawn("claude", [...args]) with stdio [ignore, pipe, pipe]', async () => {
    const activeJobs = new Map<string, ChildProcess>()

    // Start runJob but don't await — just check that spawn was called
    const runPromise = runJob(mockJob, mockSupabase, activeJobs)

    expect(spawnMock).toHaveBeenCalledOnce()
    expect(spawnMock).toHaveBeenCalledWith(
      'claude',
      expect.arrayContaining(['--print', '--output-format', 'json', '--no-session-persistence']),
      expect.objectContaining({
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    )

    // Resolve the proc.on('close') to complete runJob
    const closeCall = mockProc.on.mock.calls.find(([event]) => event === 'close')
    if (closeCall) {
      await closeCall[1](0) // exit code 0
    }
    await runPromise.catch(() => {})
  })

  it('marks job completed when spawn exits with code 0 and is_error=false', async () => {
    const activeJobs = new Map<string, ChildProcess>()
    const updateEqMock = vi.fn(() => Promise.resolve({ error: null }))
    const updateMock = vi.fn(() => ({ eq: updateEqMock }))
    const fromMock = vi.fn(() => ({ update: updateMock }))
    const supabase = { from: fromMock }

    // Configure stdout to emit valid non-error JSON
    mockProc.stdout.on.mockImplementation((event: string, handler: (chunk: Buffer) => void) => {
      if (event === 'data') {
        handler(Buffer.from('{"type":"result","is_error":false}'))
      }
    })

    const runPromise = runJob(mockJob, supabase, activeJobs)

    // Trigger close with exit code 0
    const closeCall = mockProc.on.mock.calls.find(([event]) => event === 'close')
    if (closeCall) await closeCall[1](0)

    await runPromise.catch(() => {})

    // Verify that update was called with status='completed'
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('calls handleFailure when spawn exits with code 1', async () => {
    const activeJobs = new Map<string, ChildProcess>()
    const updateEqMock = vi.fn(() => Promise.resolve({ error: null }))
    const updateMock = vi.fn(() => ({ eq: updateEqMock }))
    const fromMock = vi.fn(() => ({ update: updateMock }))
    const supabase = { from: fromMock }

    const runPromise = runJob(mockJob, supabase, activeJobs)

    const closeCall = mockProc.on.mock.calls.find(([event]) => event === 'close')
    if (closeCall) await closeCall[1](1) // non-zero exit code

    await runPromise.catch(() => {})

    // On failure, job should be updated (either re-queued or failed)
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.stringMatching(/queued|failed/) })
    )
  })
})
