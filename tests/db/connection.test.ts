/**
 * Agency OS: Database connection integration tests
 *
 * These tests run against the cloud Supabase project (configured via .env/.env.local).
 *
 * Verifies: Supabase is reachable and all 7 core tables exist.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { testClient, cleanTestData } from '../setup'

const EXPECTED_TABLES = [
  'clients',
  'phases',
  'processes',
  'quality_gates',
  'squad_jobs',
  'deliverables',
  'gate_reviews',
] as const

describe('Database Connection', () => {
  afterAll(async () => {
    await cleanTestData()
  })

  it('Supabase client connects successfully', async () => {
    const { error } = await testClient.from('clients').select('id').limit(1)
    expect(error).toBeNull()
  })

  it('All 7 core tables exist and are accessible', async () => {
    for (const tableName of EXPECTED_TABLES) {
      // Use a zero-row SELECT to confirm the table exists without fetching data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (testClient as any)
        .from(tableName)
        .select('id')
        .limit(0)

      expect(error, `Table '${tableName}' should be accessible (no error)`).toBeNull()
    }
  })
})
