import { describe, it, expect } from 'vitest'
import { briefingSchema } from '@/lib/database/schema'

describe('briefingSchema', () => {
  it('accepts valid briefing with all fields', () => {
    const result = briefingSchema.safeParse({
      niche: 'SaaS B2B',
      target_audience: 'CTOs at 50-200 employee companies',
      additional_context: 'Focus on security compliance',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid briefing without additional_context', () => {
    const result = briefingSchema.safeParse({
      niche: 'SaaS B2B',
      target_audience: 'CTOs at 50-200 employee companies',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing niche', () => {
    const result = briefingSchema.safeParse({
      target_audience: 'CTOs',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nicheError = result.error.issues.find(i => i.path.includes('niche'))
      expect(nicheError).toBeDefined()
    }
  })

  it('rejects empty niche string', () => {
    const result = briefingSchema.safeParse({
      niche: '',
      target_audience: 'CTOs',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing target_audience', () => {
    const result = briefingSchema.safeParse({
      niche: 'SaaS B2B',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const taError = result.error.issues.find(i => i.path.includes('target_audience'))
      expect(taError).toBeDefined()
    }
  })
})
