/**
 * Integration tests for claim_next_job() PostgreSQL RPC atomicity.
 *
 * Wave 0 — tests require real Supabase connection (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 * Tests will be green when DB is reachable and schema is applied.
 *
 * Uses testClient from tests/setup.ts (service role — bypasses RLS).
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { testClient, cleanTestData } from '../setup'
import { createTestClientWithProcesses } from './helpers'

beforeEach(async () => {
  await cleanTestData()
})

afterAll(async () => {
  await cleanTestData()
})

describe('claim_next_job() — atomicity and correctness', () => {
  it('returns one job when exactly one queued job exists', async () => {
    const { clientId, phases } = await createTestClientWithProcesses()
    const phase = phases[0]

    // Insert a queued squad_job
    const { error: insertError } = await testClient.from('squad_jobs').insert({
      client_id: clientId,
      phase_id: phase.id,
      squad_type: 'estrategia',
      status: 'queued',
      cli_command: 'Write a marketing haiku',
      attempts: 0,
      max_attempts: 3,
    })
    expect(insertError).toBeNull()

    // Call claim_next_job()
    const { data, error } = await testClient.rpc('claim_next_job')
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].status).toBe('running')
    expect(data![0].started_at).not.toBeNull()
  })

  it('returns empty array when no queued jobs exist', async () => {
    // No jobs inserted — just call the RPC
    const { data, error } = await testClient.rpc('claim_next_job')
    expect(error).toBeNull()
    // Either null or empty array
    expect(data?.length ?? 0).toBe(0)
  })

  it('concurrent calls — only one job is claimed when one queued job exists (atomicity)', async () => {
    const { clientId, phases } = await createTestClientWithProcesses()
    const phase = phases[0]

    // Insert exactly one queued job
    const { data: inserted, error: insertError } = await testClient
      .from('squad_jobs')
      .insert({
        client_id: clientId,
        phase_id: phase.id,
        squad_type: 'estrategia',
        status: 'queued',
        cli_command: 'Concurrent test prompt',
        attempts: 0,
        max_attempts: 3,
      })
      .select()
    expect(insertError).toBeNull()
    const jobId = inserted![0].id

    // Call claim_next_job() twice simultaneously
    const [result1, result2] = await Promise.all([
      testClient.rpc('claim_next_job'),
      testClient.rpc('claim_next_job'),
    ])

    expect(result1.error).toBeNull()
    expect(result2.error).toBeNull()

    // Combined results: one should have the job, the other should be empty
    const allClaimed = [...(result1.data ?? []), ...(result2.data ?? [])]
    expect(allClaimed).toHaveLength(1)
    expect(allClaimed[0].id).toBe(jobId)
    expect(allClaimed[0].status).toBe('running')

    // Verify DB state — job should be running, not queued
    const { data: jobState } = await testClient
      .from('squad_jobs')
      .select('status')
      .eq('id', jobId)
      .single()
    expect(jobState?.status).toBe('running')
  })
})
