import { describe, it, expect } from 'vitest'
import { PROCESS_DEFINITIONS } from '@/lib/pipeline/processes'
import type { ProcessDefinition } from '@/lib/pipeline/processes'
import { PROCESS_TO_PHASE, PROCESS_TO_SQUAD } from '@/lib/database/enums'

describe('PIPE-05: PROCESS_DEFINITIONS shape and count', () => {
  it('PIPE-05: PROCESS_DEFINITIONS has exactly 16 keys (1-16)', () => {
    expect(Object.keys(PROCESS_DEFINITIONS)).toHaveLength(16)
    for (let i = 1; i <= 16; i++) {
      expect(PROCESS_DEFINITIONS[i]).toBeDefined()
    }
  })

  it('PIPE-05: every process has required fields', () => {
    for (const [key, def] of Object.entries(PROCESS_DEFINITIONS)) {
      const d = def as ProcessDefinition
      expect(typeof d.name).toBe('string')
      expect(d.name.length).toBeGreaterThan(0)
      expect([1, 2, 3, 4, 5]).toContain(d.phase)
      expect(['estrategia', 'planejamento', 'growth', 'crm']).toContain(d.squad)
      expect(Array.isArray(d.inputs)).toBe(true)
      expect(d.inputs.length).toBeGreaterThanOrEqual(1)
      expect(Array.isArray(d.steps)).toBe(true)
      expect(d.steps.length).toBeGreaterThanOrEqual(1)
      expect(Array.isArray(d.checklist)).toBe(true)
      expect(d.checklist.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('PIPE-05: phase alignment matches PROCESS_TO_PHASE', () => {
    for (let n = 1; n <= 16; n++) {
      expect(PROCESS_DEFINITIONS[n].phase).toBe(PROCESS_TO_PHASE[n])
    }
  })

  it('PIPE-05: squad alignment matches PROCESS_TO_SQUAD', () => {
    for (let n = 1; n <= 16; n++) {
      expect(PROCESS_DEFINITIONS[n].squad).toBe(PROCESS_TO_SQUAD[n])
    }
  })
})
