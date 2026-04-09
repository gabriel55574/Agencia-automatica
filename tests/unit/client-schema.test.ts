import { describe, it, expect } from 'vitest'
import { clientInsertSchema } from '@/lib/database/schema'

describe('clientInsertSchema', () => {
  it('accepts valid client insert with briefing', () => {
    const result = clientInsertSchema.safeParse({
      name: 'Acme Corp',
      company: 'Acme',
      briefing: {
        niche: 'Retail',
        target_audience: 'SMB owners',
        additional_context: null,
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = clientInsertSchema.safeParse({
      company: 'Acme',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = clientInsertSchema.safeParse({
      name: '',
      company: 'Acme',
    })
    expect(result.success).toBe(false)
  })

  it('rejects name over 255 characters', () => {
    const result = clientInsertSchema.safeParse({
      name: 'a'.repeat(256),
      company: 'Acme',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing company', () => {
    const result = clientInsertSchema.safeParse({
      name: 'Acme Corp',
    })
    expect(result.success).toBe(false)
  })

  it('accepts null briefing (briefing optional at schema level)', () => {
    const result = clientInsertSchema.safeParse({
      name: 'Acme Corp',
      company: 'Acme',
      briefing: null,
    })
    expect(result.success).toBe(true)
  })
})
