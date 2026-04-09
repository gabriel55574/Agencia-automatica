/**
 * Phase 12: Unit tests for token extraction and cost calculation.
 *
 * Tests extractTokenUsage (from token-parser.ts) and calculateCost (from constants.ts).
 * Covers all behavior cases defined in 12-01-PLAN.md.
 */

import { describe, it, expect } from 'vitest'
import { extractTokenUsage } from '@/lib/costs/token-parser'
import { calculateCost, COST_PER_1K_TOKENS } from '@/lib/costs/constants'

describe('extractTokenUsage', () => {
  it('extracts token usage from valid CLI JSON with usage field', () => {
    const input = '{"type":"result","is_error":false,"result":"...","usage":{"input_tokens":1000,"output_tokens":500}}'
    const result = extractTokenUsage(input)
    expect(result).toEqual({
      input_tokens: 1000,
      output_tokens: 500,
      total_tokens: 1500,
    })
  })

  it('returns null when JSON envelope has no usage field', () => {
    const input = '{"type":"result","is_error":false,"result":"..."}'
    const result = extractTokenUsage(input)
    expect(result).toBeNull()
  })

  it('returns null for unparseable input (not JSON)', () => {
    const result = extractTokenUsage('not json at all')
    expect(result).toBeNull()
  })

  it('returns null for empty string', () => {
    const result = extractTokenUsage('')
    expect(result).toBeNull()
  })

  it('extracts correctly from multi-line stdout where JSON is on one line', () => {
    const input = [
      'Some CLI warning message',
      'Another line of noise',
      '{"type":"result","is_error":false,"result":"ok","usage":{"input_tokens":2000,"output_tokens":800}}',
      'trailing output',
    ].join('\n')

    const result = extractTokenUsage(input)
    expect(result).toEqual({
      input_tokens: 2000,
      output_tokens: 800,
      total_tokens: 2800,
    })
  })

  it('returns null when usage field is not an object', () => {
    const input = '{"type":"result","is_error":false,"result":"...","usage":"invalid"}'
    const result = extractTokenUsage(input)
    expect(result).toBeNull()
  })

  it('returns null when usage tokens are not numbers', () => {
    const input = '{"type":"result","is_error":false,"result":"...","usage":{"input_tokens":"many","output_tokens":"few"}}'
    const result = extractTokenUsage(input)
    expect(result).toBeNull()
  })

  it('handles zero token values correctly', () => {
    const input = '{"type":"result","is_error":false,"result":"...","usage":{"input_tokens":0,"output_tokens":0}}'
    const result = extractTokenUsage(input)
    expect(result).toEqual({
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
    })
  })
})

describe('calculateCost', () => {
  it('calculates cost correctly for 1500 tokens', () => {
    // 1500 / 1000 * 0.025 = 0.0375, rounded to 2 decimals = 0.04
    const result = calculateCost(1500)
    expect(result).toBe(0.04)
  })

  it('returns 0 for 0 tokens', () => {
    const result = calculateCost(0)
    expect(result).toBe(0)
  })

  it('returns null for null input', () => {
    const result = calculateCost(null)
    expect(result).toBeNull()
  })

  it('calculates cost for large token counts', () => {
    // 100000 / 1000 * 0.025 = 2.50
    const result = calculateCost(100000)
    expect(result).toBe(2.5)
  })

  it('rounds to 2 decimal places', () => {
    // 1234 / 1000 * 0.025 = 0.03085, rounded = 0.03
    const result = calculateCost(1234)
    expect(result).toBe(0.03)
  })

  it('uses the configurable COST_PER_1K_TOKENS rate', () => {
    // Verify the rate is what we expect
    expect(COST_PER_1K_TOKENS).toBe(0.025)
  })
})
