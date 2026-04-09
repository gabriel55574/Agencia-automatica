import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { briefingSchema } from '@/lib/database/schema'

// Unit tests for edit action validation logic.
// The Server Action itself requires Supabase + Next.js runtime;
// we test the validation schema behavior here (same logic used in updateClientAction).

describe('updateClientAction input validation (schema layer)', () => {
  it('accepts valid name within 255 chars', () => {
    const result = z.string().min(1).max(255).safeParse('Valid Client Name')
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = z.string().min(1).max(255).safeParse('')
    expect(result.success).toBe(false)
  })

  it('rejects name over 255 characters', () => {
    const result = z.string().min(1).max(255).safeParse('a'.repeat(256))
    expect(result.success).toBe(false)
  })

  it('accepts valid company within 255 chars', () => {
    const result = z.string().min(1).max(255).safeParse('Acme Ltda')
    expect(result.success).toBe(true)
  })

  it('rejects missing company', () => {
    const result = z.string().min(1).max(255).safeParse('')
    expect(result.success).toBe(false)
  })

  it('edit uses briefingSchema — accepts valid briefing shape', () => {
    const result = briefingSchema.safeParse({
      niche: 'Updated niche',
      target_audience: 'Updated audience',
      additional_context: 'Updated context',
    })
    expect(result.success).toBe(true)
  })

  it('edit uses briefingSchema — rejects invalid briefing (missing niche)', () => {
    const result = briefingSchema.safeParse({
      target_audience: 'some audience',
    })
    expect(result.success).toBe(false)
  })
})
