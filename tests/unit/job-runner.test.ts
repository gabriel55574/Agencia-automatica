/**
 * Unit tests for src/worker/job-runner.ts
 *
 * Wave 0 stubs → GREEN after implementation.
 * Tests isCliError, runJob spawn behavior, and handleFailure.
 *
 * Note: Test UUIDs use RFC 4122 v4 format (8-4-4-4-12 with version nibble=4, variant=8/9/a/b).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ChildProcess } from 'child_process'
import type { SquadJob } from '@/lib/database/schema'

// ============================================================
// MOCK SETUP — hoisted by Vitest before any imports
// ============================================================

// Create a stable mockProc reference shared across all tests
const mockProc = {
  stdout: { on: vi.fn() },
  stderr: { on: vi.fn() },
  on: vi.fn(),
  kill: vi.fn(),
  pid: 12345,
}

vi.mock('child_process', () => ({
  spawn: vi.fn(() => mockProc),
  ChildProcess: class {},
}))

// Import the real module after mocks are set up
import { isCliError, runJob, handleFailure } from '../../src/worker/job-runner'
import { spawn } from 'child_process'

const spawnMock = spawn as ReturnType<typeof vi.fn>

// ============================================================
// Test fixtures — RFC 4122 v4 compliant UUIDs
// ============================================================

const TEST_JOB_ID = '550e8400-e29b-41d4-a716-446655440001'
const TEST_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440002'
const TEST_PHASE_ID = '550e8400-e29b-41d4-a716-446655440003'

const mockJob: SquadJob = {
  id: TEST_JOB_ID,
  client_id: TEST_CLIENT_ID,
  phase_id: TEST_PHASE_ID,
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

function makeMockSupabase() {
  const eqMock = vi.fn(() => Promise.resolve({ error: null }))
  const updateMock = vi.fn(() => ({ eq: eqMock }))
  const fromMock = vi.fn(() => ({ update: updateMock }))
  return { supabase: { from: fromMock }, updateMock, eqMock }
}

// ============================================================
// isCliError tests
// ============================================================

describe('isCliError', () => {
  it('returns false when JSON has is_error=false', () => {
    expect(isCliError('{"type":"result","is_error":false}')).toBe(false)
  })

  it('returns true when JSON has is_error=true', () => {
    expect(isCliError('{"type":"result","is_error":true}')).toBe(true)
  })

  it('returns true when stdout is not valid JSON', () => {
    expect(isCliError('not json at all')).toBe(true)
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
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mockProc event handlers
    mockProc.stdout.on.mockReset()
    mockProc.stderr.on.mockReset()
    mockProc.on.mockReset()
  })

  it('calls spawn("claude", [...args]) with stdio [ignore, pipe, pipe]', async () => {
    const activeJobs = new Map<string, ChildProcess>()
    const { supabase } = makeMockSupabase()

    // Start runJob (it awaits proc.on('close') internally)
    const runPromise = runJob(mockJob, supabase as unknown as Parameters<typeof runJob>[1], activeJobs)

    // Spawn should be called synchronously during runJob initialization
    expect(spawnMock).toHaveBeenCalledOnce()
    const [cmd, args, opts] = spawnMock.mock.calls[0]
    expect(cmd).toBe('claude')
    expect(args).toEqual(expect.arrayContaining(['--print', '--output-format', expect.stringMatching(/json|stream-json/), '--no-session-persistence']))
    expect(opts.stdio).toEqual(['ignore', 'pipe', 'pipe'])

    // Resolve the Promise by triggering the close event
    const closeCb = mockProc.on.mock.calls.find(([evt]) => evt === 'close')?.[1]
    if (closeCb) await closeCb(0)
    await runPromise.catch(() => {})
  })

  it('marks job completed when spawn exits with code 0 and is_error=false', async () => {
    const activeJobs = new Map<string, ChildProcess>()
    const { supabase, updateMock } = makeMockSupabase()

    // Configure stdout to emit valid non-error JSON
    mockProc.stdout.on.mockImplementation((event: string, handler: (b: Buffer) => void) => {
      if (event === 'data') handler(Buffer.from('{"type":"result","is_error":false}'))
    })

    const runPromise = runJob(mockJob, supabase as unknown as Parameters<typeof runJob>[1], activeJobs)

    // Trigger close with exit code 0
    const closeCb = mockProc.on.mock.calls.find(([evt]) => evt === 'close')?.[1]
    if (closeCb) await closeCb(0)
    await runPromise.catch(() => {})

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('calls handleFailure when spawn exits with code 1', async () => {
    const activeJobs = new Map<string, ChildProcess>()
    const { supabase, updateMock } = makeMockSupabase()

    const runPromise = runJob(mockJob, supabase as unknown as Parameters<typeof runJob>[1], activeJobs)

    // Trigger close with exit code 1 (failure)
    const closeCb = mockProc.on.mock.calls.find(([evt]) => evt === 'close')?.[1]
    if (closeCb) await closeCb(1)
    await runPromise.catch(() => {})

    // handleFailure should update the job (re-queue or fail depending on attempts)
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.stringMatching(/queued|failed/) })
    )
  })
})
