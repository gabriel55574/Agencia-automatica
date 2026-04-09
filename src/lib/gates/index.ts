/**
 * Gate checklist dispatcher: maps gate numbers (1-4) to their checklists.
 *
 * Follows the same dispatcher pattern as src/lib/squads/schemas/index.ts.
 *
 * Used by:
 * - src/lib/gates/review-prompt.ts to embed checklist items in the adversarial prompt
 * - Future: gate review UI to display checklist items for operator approval
 *
 * @example
 * const checklist = getGateChecklist(1)
 * if (checklist) {
 *   console.log(checklist.gateName) // "Alvo Validado?"
 *   console.log(checklist.items.length) // 5
 * }
 */

// ============================================================
// Types
// ============================================================

export type ChecklistItem = {
  id: string // e.g. "gate-1-item-1"
  label: string // Short label from checklist
  description: string // Full description
}

export type GateChecklist = {
  gateNumber: number
  gateName: string
  items: ChecklistItem[]
}

// ============================================================
// Imports
// ============================================================

import { gate1Checklist } from './gate-1-checklist'
import { gate2Checklist } from './gate-2-checklist'
import { gate3Checklist } from './gate-3-checklist'
import { gate4Checklist } from './gate-4-checklist'

// ============================================================
// Dispatcher
// ============================================================

const GATE_CHECKLISTS: Record<number, GateChecklist> = {
  1: gate1Checklist,
  2: gate2Checklist,
  3: gate3Checklist,
  4: gate4Checklist,
}

/**
 * Returns the checklist for the given gate number, or null if invalid.
 *
 * @param gateNumber - The gate number (1-4)
 * @returns The gate checklist, or null for invalid gate numbers
 */
export function getGateChecklist(gateNumber: number): GateChecklist | null {
  return GATE_CHECKLISTS[gateNumber] ?? null
}

// ============================================================
// Re-exports
// ============================================================

export { gate1Checklist } from './gate-1-checklist'
export { gate2Checklist } from './gate-2-checklist'
export { gate3Checklist } from './gate-3-checklist'
export { gate4Checklist } from './gate-4-checklist'
