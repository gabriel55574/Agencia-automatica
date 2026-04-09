/**
 * Agency OS: Templates integration tests (Phase 15)
 *
 * Tests the templates table schema, constraints, indexes,
 * Zod validation schemas, and the clone client pattern.
 *
 * Requires live Supabase connection (cloud or local).
 * Run: npx vitest run tests/db/templates.test.ts
 */

import { describe, it, expect, afterEach } from 'vitest'
import { testClient, cleanTestData } from '../setup'
import { templateInsertSchema } from '@/lib/database/schema'

describe('Templates (Phase 15)', () => {
  afterEach(async () => {
    await cleanTestData()
  })

  // ----------------------------------------------------------------
  // templates table — column defaults & constraints
  // ----------------------------------------------------------------

  describe('templates table', () => {
    it('inserts with correct column defaults', async () => {
      // Create a client first (needed for source_client_id FK)
      const { data: client } = await testClient
        .from('clients')
        .insert({ name: 'Template Source', company: 'Test Co' })
        .select()
        .single()

      const { data, error } = await testClient
        .from('templates')
        .insert({
          name: 'SaaS Research Template',
          description: 'For SaaS market research',
          process_number: 1,
          content: { market_size: 'Large', competitors: ['A', 'B'] },
          source_client_id: client!.id,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data!.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
      expect(data!.name).toBe('SaaS Research Template')
      expect(data!.description).toBe('For SaaS market research')
      expect(data!.process_number).toBe(1)
      expect(data!.content).toEqual({ market_size: 'Large', competitors: ['A', 'B'] })
      expect(data!.source_client_id).toBe(client!.id)
      expect(data!.source_job_id).toBeNull()
      expect(data!.created_at).toBeTruthy()
      expect(data!.updated_at).toBeTruthy()
    })

    it('rejects process_number outside 1-16 range', async () => {
      const { error: low } = await testClient
        .from('templates')
        .insert({ name: 'Bad Low', process_number: 0, content: {} })

      expect(low).not.toBeNull()

      const { error: high } = await testClient
        .from('templates')
        .insert({ name: 'Bad High', process_number: 17, content: {} })

      expect(high).not.toBeNull()
    })

    it('sets source_client_id to null on client deletion (ON DELETE SET NULL)', async () => {
      // Create a source client
      const { data: client } = await testClient
        .from('clients')
        .insert({ name: 'Will Delete', company: 'Gone Co' })
        .select()
        .single()

      // Create template referencing that client
      const { data: template } = await testClient
        .from('templates')
        .insert({
          name: 'Orphan Test',
          process_number: 3,
          content: { test: true },
          source_client_id: client!.id,
        })
        .select()
        .single()

      expect(template!.source_client_id).toBe(client!.id)

      // Delete the client (must clean FK dependents first)
      await testClient.from('quality_gates').delete().eq('client_id', client!.id)
      await testClient.from('processes').delete().eq('client_id', client!.id)
      await testClient.from('phases').delete().eq('client_id', client!.id)
      await testClient.from('clients').delete().eq('id', client!.id)

      // Template should survive with null source_client_id
      const { data: surviving } = await testClient
        .from('templates')
        .select()
        .eq('id', template!.id)
        .single()

      expect(surviving).not.toBeNull()
      expect(surviving!.source_client_id).toBeNull()
    })

    it('has functional index on process_number (query succeeds)', async () => {
      // Insert a template to ensure the table is non-empty
      await testClient
        .from('templates')
        .insert({ name: 'Index Test', process_number: 7, content: { idx: true } })

      // Query filtering by process_number exercises the index
      const { data, error } = await testClient
        .from('templates')
        .select('id')
        .eq('process_number', 7)
        .limit(1)

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data!.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ----------------------------------------------------------------
  // templateInsertSchema (Zod validation)
  // ----------------------------------------------------------------

  describe('templateInsertSchema (Zod)', () => {
    it('accepts valid template input', () => {
      const result = templateInsertSchema.safeParse({
        name: 'Valid Template',
        description: 'A description',
        process_number: 5,
        content: { key: 'value' },
        source_client_id: '550e8400-e29b-41d4-a716-446655440000',
        source_job_id: null,
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid inputs (empty name, process_number out of range)', () => {
      // Empty name
      const emptyName = templateInsertSchema.safeParse({
        name: '',
        process_number: 1,
        content: {},
      })
      expect(emptyName.success).toBe(false)

      // process_number too low
      const tooLow = templateInsertSchema.safeParse({
        name: 'X',
        process_number: 0,
        content: {},
      })
      expect(tooLow.success).toBe(false)

      // process_number too high
      const tooHigh = templateInsertSchema.safeParse({
        name: 'X',
        process_number: 17,
        content: {},
      })
      expect(tooHigh.success).toBe(false)
    })
  })

  // ----------------------------------------------------------------
  // Clone client pattern
  // ----------------------------------------------------------------

  describe('clone client pattern', () => {
    it('creates new client with cloned briefing starting at phase 1', async () => {
      // Create source client with briefing via RPC
      const briefing = {
        niche: 'SaaS B2B',
        target_audience: 'CTOs',
        additional_context: 'Enterprise focus',
      }
      const { data: sourceId } = await testClient.rpc('create_client_with_phases', {
        p_name: 'Source Client',
        p_company: 'Source Co',
        p_briefing: briefing,
      })
      expect(sourceId).toBeTruthy()

      // Read source client's briefing
      const { data: source } = await testClient
        .from('clients')
        .select('briefing')
        .eq('id', sourceId)
        .single()
      expect(source!.briefing).toEqual(briefing)

      // Clone: create new client with same briefing
      const { data: cloneId } = await testClient.rpc('create_client_with_phases', {
        p_name: 'Cloned Client',
        p_company: 'Clone Co',
        p_briefing: source!.briefing,
      })
      expect(cloneId).toBeTruthy()

      // Verify cloned client
      const { data: clone } = await testClient
        .from('clients')
        .select('name, company, briefing, current_phase_number, cycle_number, status')
        .eq('id', cloneId)
        .single()

      expect(clone!.name).toBe('Cloned Client')
      expect(clone!.company).toBe('Clone Co')
      expect(clone!.briefing).toEqual(briefing)
      expect(clone!.current_phase_number).toBe(1) // Fresh start
      expect(clone!.cycle_number).toBe(1)
      expect(clone!.status).toBe('active')

      // Verify cloned client has 5 phases
      const { data: phases } = await testClient
        .from('phases')
        .select('phase_number')
        .eq('client_id', cloneId)
        .order('phase_number')
      expect(phases).toHaveLength(5)
    })
  })
})
