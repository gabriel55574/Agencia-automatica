/**
 * Tests for gate checklist definitions and dispatcher.
 *
 * Verifies:
 * - Each gate returns the correct checklist structure
 * - Item counts match the Agency OS methodology (5+6+6+6)
 * - Dispatcher returns null for invalid gate numbers
 * - Checklist items have required fields
 * - Verbatim labels from docs/agency-os-prompt.md
 */

import { describe, it, expect } from 'vitest'
import {
  getGateChecklist,
  type GateChecklist,
  type ChecklistItem,
} from '@/lib/gates/index'

describe('getGateChecklist dispatcher', () => {
  it('returns null for gate 0 (below range)', () => {
    expect(getGateChecklist(0)).toBeNull()
  })

  it('returns null for gate 5 (above range)', () => {
    expect(getGateChecklist(5)).toBeNull()
  })

  it('returns null for negative gate number', () => {
    expect(getGateChecklist(-1)).toBeNull()
  })
})

describe('Gate 1: Alvo Validado?', () => {
  it('returns checklist with gateNumber 1', () => {
    const checklist = getGateChecklist(1)
    expect(checklist).not.toBeNull()
    expect(checklist!.gateNumber).toBe(1)
  })

  it('returns checklist with gateName "Alvo Validado?"', () => {
    const checklist = getGateChecklist(1)!
    expect(checklist.gateName).toBe('Alvo Validado?')
  })

  it('has exactly 5 items', () => {
    const checklist = getGateChecklist(1)!
    expect(checklist.items).toHaveLength(5)
  })

  it('first item label contains "Persona principal definida com dados"', () => {
    const checklist = getGateChecklist(1)!
    expect(checklist.items[0].label).toContain(
      'Persona principal definida com dados'
    )
  })

  it('each item has non-empty id, label, and description', () => {
    const checklist = getGateChecklist(1)!
    for (const item of checklist.items) {
      expect(item.id).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.description).toBeTruthy()
    }
  })

  it('item ids follow "gate-1-item-N" pattern', () => {
    const checklist = getGateChecklist(1)!
    checklist.items.forEach((item, idx) => {
      expect(item.id).toBe(`gate-1-item-${idx + 1}`)
    })
  })
})

describe('Gate 2: Oferta + Marca OK?', () => {
  it('returns checklist with gateNumber 2', () => {
    const checklist = getGateChecklist(2)
    expect(checklist).not.toBeNull()
    expect(checklist!.gateNumber).toBe(2)
  })

  it('returns checklist with gateName "Oferta + Marca OK?"', () => {
    const checklist = getGateChecklist(2)!
    expect(checklist.gateName).toBe('Oferta + Marca OK?')
  })

  it('has exactly 6 items', () => {
    const checklist = getGateChecklist(2)!
    expect(checklist.items).toHaveLength(6)
  })

  it('each item has non-empty id, label, and description', () => {
    const checklist = getGateChecklist(2)!
    for (const item of checklist.items) {
      expect(item.id).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.description).toBeTruthy()
    }
  })
})

describe('Gate 3: Plano Tatico Validado?', () => {
  it('returns checklist with gateNumber 3', () => {
    const checklist = getGateChecklist(3)
    expect(checklist).not.toBeNull()
    expect(checklist!.gateNumber).toBe(3)
  })

  it('returns checklist with gateName "Plano Tatico Validado?"', () => {
    const checklist = getGateChecklist(3)!
    expect(checklist.gateName).toBe('Plano Tatico Validado?')
  })

  it('has exactly 6 items', () => {
    const checklist = getGateChecklist(3)!
    expect(checklist.items).toHaveLength(6)
  })

  it('each item has non-empty id, label, and description', () => {
    const checklist = getGateChecklist(3)!
    for (const item of checklist.items) {
      expect(item.id).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.description).toBeTruthy()
    }
  })
})

describe('Gate 4: Meta de Tracao Atingida?', () => {
  it('returns checklist with gateNumber 4', () => {
    const checklist = getGateChecklist(4)
    expect(checklist).not.toBeNull()
    expect(checklist!.gateNumber).toBe(4)
  })

  it('returns checklist with gateName "Meta de Tracao Atingida?"', () => {
    const checklist = getGateChecklist(4)!
    expect(checklist.gateName).toBe('Meta de Tracao Atingida?')
  })

  it('has exactly 6 items', () => {
    const checklist = getGateChecklist(4)!
    expect(checklist.items).toHaveLength(6)
  })

  it('each item has non-empty id, label, and description', () => {
    const checklist = getGateChecklist(4)!
    for (const item of checklist.items) {
      expect(item.id).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.description).toBeTruthy()
    }
  })
})

describe('Total checklist items', () => {
  it('all 4 gates together have 23 items (5+6+6+6)', () => {
    const total =
      getGateChecklist(1)!.items.length +
      getGateChecklist(2)!.items.length +
      getGateChecklist(3)!.items.length +
      getGateChecklist(4)!.items.length
    expect(total).toBe(23)
  })
})
