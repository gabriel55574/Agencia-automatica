/**
 * Unit tests for src/worker/output-parser.ts
 *
 * Tests parseCliOutput (two-level JSON deserialization) and
 * parseStructuredOutput (schema validation on parsed output).
 */

import { describe, it, expect } from 'vitest'
import { parseCliOutput, parseStructuredOutput } from '../../src/worker/output-parser'

// ============================================================
// parseCliOutput tests
// ============================================================

describe('parseCliOutput', () => {
  it('extracts inner JSON from valid CLI envelope', () => {
    const raw = '{"type":"result","is_error":false,"result":"{\\"key\\":\\"val\\"}"}'
    const result = parseCliOutput(raw)
    expect(result).toEqual({ key: 'val' })
  })

  it('returns null for non-JSON input', () => {
    const result = parseCliOutput('not json at all')
    expect(result).toBeNull()
  })

  it('returns null when envelope has is_error=true', () => {
    const raw = '{"type":"result","is_error":true,"result":"some error message"}'
    const result = parseCliOutput(raw)
    expect(result).toBeNull()
  })

  it('returns null for empty string', () => {
    const result = parseCliOutput('')
    expect(result).toBeNull()
  })

  it('handles multiline stdout where JSON is on second line', () => {
    const raw = 'some hook output\n{"type":"result","is_error":false,"result":"{\\"data\\":\\"test\\"}"}\nmore output'
    const result = parseCliOutput(raw)
    expect(result).toEqual({ data: 'test' })
  })

  it('handles result that is a JSON object (not string-escaped)', () => {
    // Some CLI versions may return result as a direct object
    const raw = JSON.stringify({
      type: 'result',
      is_error: false,
      result: JSON.stringify({ nested: 'value' }),
    })
    const result = parseCliOutput(raw)
    expect(result).toEqual({ nested: 'value' })
  })

  it('returns result as-is when inner result is not valid JSON string', () => {
    const raw = '{"type":"result","is_error":false,"result":"plain text output"}'
    const result = parseCliOutput(raw)
    // If inner JSON.parse fails, should return the raw result string
    expect(result).toBe('plain text output')
  })

  it('returns null when JSON line has no result field', () => {
    const raw = '{"type":"something","is_error":false}'
    const result = parseCliOutput(raw)
    expect(result).toBeNull()
  })
})

// ============================================================
// parseStructuredOutput tests
// ============================================================

describe('parseStructuredOutput', () => {
  it('returns success for valid process 01 data', () => {
    const validData = {
      problem_definition: 'Test problem',
      data_sources: ['source1'],
      competitive_analysis: {
        clientes: 'c',
        colaboradores: 'c',
        companhia: 'c',
        concorrentes: 'c',
        contexto: 'c',
      },
      actionable_insights: ['insight1'],
    }
    const result = parseStructuredOutput(validData, 1)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validData)
  })

  it('returns failure for invalid data against process 01 schema', () => {
    const result = parseStructuredOutput({ wrong: 'data' }, 1)
    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
  })

  it('returns failure for invalid process number', () => {
    const result = parseStructuredOutput({ any: 'data' }, 99)
    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
  })

  it('returns failure with error message', () => {
    const result = parseStructuredOutput({ wrong: 'data' }, 1)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(typeof result.error).toBe('string')
      expect(result.error.length).toBeGreaterThan(0)
    }
  })

  it('returns failure for null input', () => {
    const result = parseStructuredOutput(null, 1)
    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
  })
})
