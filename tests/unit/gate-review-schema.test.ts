/**
 * Tests for GateReviewVerdictSchema Zod validation.
 *
 * Verifies:
 * - Valid verdicts pass validation
 * - Empty items array is rejected
 * - Invalid overall values are rejected
 * - Invalid item verdict values are rejected
 * - Empty notes are accepted
 */

import { describe, it, expect } from 'vitest'
import {
  GateReviewVerdictSchema,
  type GateReviewVerdict,
} from '@/lib/gates/review-schema'

const validVerdict: GateReviewVerdict = {
  gate_number: 1,
  overall: 'pass',
  items: [
    {
      checklist_id: 'gate-1-item-1',
      label: 'Persona principal definida com dados, nao achismo?',
      verdict: 'pass',
      evidence: 'The persona is defined with data from process 2.',
      notes: 'Well documented with real research data.',
    },
  ],
  summary: 'All checklist items have been satisfied with evidence.',
}

describe('GateReviewVerdictSchema', () => {
  it('succeeds on valid verdict with all fields', () => {
    const result = GateReviewVerdictSchema.safeParse(validVerdict)
    expect(result.success).toBe(true)
  })

  it('fails when items array is empty', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      items: [],
    })
    expect(result.success).toBe(false)
  })

  it('fails when overall is not pass|fail|partial', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      overall: 'maybe',
    })
    expect(result.success).toBe(false)
  })

  it('fails when item verdict is not pass|fail', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      items: [
        {
          ...validVerdict.items[0],
          verdict: 'partial',
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('succeeds with item notes as empty string', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      items: [
        {
          ...validVerdict.items[0],
          notes: '',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('fails when gate_number is 0', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      gate_number: 0,
    })
    expect(result.success).toBe(false)
  })

  it('fails when gate_number is 5', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      gate_number: 5,
    })
    expect(result.success).toBe(false)
  })

  it('fails when summary is empty', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      summary: '',
    })
    expect(result.success).toBe(false)
  })

  it('fails when checklist_id is empty', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      items: [
        {
          ...validVerdict.items[0],
          checklist_id: '',
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('accepts overall "partial" value', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      overall: 'partial',
    })
    expect(result.success).toBe(true)
  })

  it('accepts overall "fail" value', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      overall: 'fail',
    })
    expect(result.success).toBe(true)
  })

  it('accepts multiple items', () => {
    const result = GateReviewVerdictSchema.safeParse({
      ...validVerdict,
      items: [
        validVerdict.items[0],
        {
          checklist_id: 'gate-1-item-2',
          label: 'Segmento passa no teste de atratividade?',
          verdict: 'fail',
          evidence: 'No attractiveness test results found.',
          notes: 'Missing from output.',
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})
