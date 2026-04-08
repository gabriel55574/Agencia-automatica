/**
 * Agency OS: Database schema integration tests
 *
 * These tests require `supabase start` to be running.
 * Run: supabase start && npm test
 *
 * Verifies: table structure, column defaults, and CHECK constraints
 * are enforced at the database level (not just application code).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { testClient, cleanTestData } from '../setup'
import { PHASE_NAMES } from '@/lib/database/enums'

describe('Database Schema', () => {
  afterEach(async () => {
    await cleanTestData()
  })

  // ----------------------------------------------------------------
  // clients table
  // ----------------------------------------------------------------

  it('clients table: inserts with correct column defaults', async () => {
    const { data, error } = await testClient
      .from('clients')
      .insert({ name: 'Test Client', company: 'Test Co' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data!.status).toBe('active')
    expect(data!.current_phase_number).toBe(1)
    expect(data!.cycle_number).toBe(1)
    expect(data!.metadata).toEqual({})
    expect(data!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  it('clients table: rejects invalid status value', async () => {
    const { error } = await testClient
      .from('clients')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ name: 'Bad Client', company: 'Bad Co', status: 'invalid_status' as any })

    expect(error).not.toBeNull()
    // PostgreSQL CHECK constraint violation
    expect(error!.message).toMatch(/check/i)
  })

  // ----------------------------------------------------------------
  // phases table
  // ----------------------------------------------------------------

  it('phases table: enforces UNIQUE(client_id, phase_number)', async () => {
    // Create a client first
    const { data: client, error: clientError } = await testClient
      .from('clients')
      .insert({ name: 'Unique Test Client', company: 'Unique Co' })
      .select()
      .single()

    expect(clientError).toBeNull()

    const phasePayload = {
      client_id: client!.id,
      phase_number: 1,
      name: PHASE_NAMES[1],
      status: 'pending' as const,
    }

    // Insert first phase -- should succeed
    const { error: first } = await testClient.from('phases').insert(phasePayload)
    expect(first).toBeNull()

    // Insert duplicate (same client_id + phase_number) -- should fail
    const { error: second } = await testClient.from('phases').insert(phasePayload)
    expect(second).not.toBeNull()
    // PostgreSQL unique violation code 23505
    expect(second!.code).toBe('23505')
  })

  it('phases table: rejects phase_number outside 1-5', async () => {
    const { data: client } = await testClient
      .from('clients')
      .insert({ name: 'Phase Bounds Client', company: 'Bounds Co' })
      .select()
      .single()

    const { error } = await testClient.from('phases').insert({
      client_id: client!.id,
      phase_number: 6, // out of bounds
      name: 'Out of range phase',
      status: 'pending',
    })

    expect(error).not.toBeNull()
    // PostgreSQL CHECK constraint violation
    expect(error!.message).toMatch(/check/i)
  })

  it('phases table: rejects invalid status value', async () => {
    const { data: client } = await testClient
      .from('clients')
      .insert({ name: 'Phase Status Client', company: 'Status Co' })
      .select()
      .single()

    const { error } = await testClient.from('phases').insert({
      client_id: client!.id,
      phase_number: 1,
      name: PHASE_NAMES[1],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: 'in_progress' as any, // invalid -- not in CHECK constraint
    })

    expect(error).not.toBeNull()
    expect(error!.message).toMatch(/check/i)
  })

  // ----------------------------------------------------------------
  // processes table
  // ----------------------------------------------------------------

  it('processes table: rejects invalid squad value', async () => {
    const { data: client } = await testClient
      .from('clients')
      .insert({ name: 'Squad Test Client', company: 'Squad Co' })
      .select()
      .single()

    const { data: phase } = await testClient
      .from('phases')
      .insert({ client_id: client!.id, phase_number: 1, name: PHASE_NAMES[1], status: 'pending' })
      .select()
      .single()

    const { error } = await testClient.from('processes').insert({
      phase_id: phase!.id,
      client_id: client!.id,
      process_number: 1,
      name: 'Market Research',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      squad: 'invalid_squad' as any, // not in ('estrategia', 'planejamento', 'growth', 'crm')
      status: 'pending',
    })

    expect(error).not.toBeNull()
    expect(error!.message).toMatch(/check/i)
  })
})
