/**
 * Agency OS: Domain constants for the 5-phase/16-process/4-squad/4-gate structure.
 *
 * These constants are the single source of truth for:
 * - Phase names (Portuguese -- user-facing UI strings)
 * - Process-to-phase mapping (which phase owns each process)
 * - Process-to-squad mapping (which squad executes each process)
 * - Status values (MUST match CHECK constraint values in SQL migrations)
 *
 * When adding or renaming a status, update BOTH this file AND the corresponding
 * CHECK constraint in supabase/migrations/00001_initial_schema.sql.
 */

// ============================================================
// PHASE NAMES (Portuguese -- user-facing)
// ============================================================
export const PHASE_NAMES = {
  1: 'Diagnostico',
  2: 'Engenharia de Valor',
  3: 'Go-to-Market',
  4: 'Tracao e Vendas',
  5: 'Retencao e Escala',
} as const

export type PhaseNumber = 1 | 2 | 3 | 4 | 5

// ============================================================
// PHASE LABELS (English -- internal/code use)
// ============================================================
export const PHASE_LABELS_EN = {
  1: 'diagnostic',
  2: 'value_engineering',
  3: 'go_to_market',
  4: 'traction_sales',
  5: 'retention_scale',
} as const

// ============================================================
// PHASE COLORS
// Distinct color per pipeline phase. 4 variants each:
//   base   — icon tint, header text, small accents
//   light  — badge/card backgrounds (10% opacity of base)
//   dark   — text on light backgrounds (WCAG AA compliant)
//   border — borders, bars, left-edge indicators
//
// Hex reference:
//   Phase 1 #3B82F6 = blue-500
//   Phase 2 #8B5CF6 = violet-500
//   Phase 3 #F59E0B = amber-500
//   Phase 4 #22C55E = green-500
//   Phase 5 #14B8A6 = teal-500
// ============================================================
export const PHASE_COLORS = {
  1: { base: 'text-blue-500', light: 'bg-blue-500/10', dark: 'text-blue-700', border: 'border-blue-500' },
  2: { base: 'text-violet-500', light: 'bg-violet-500/10', dark: 'text-violet-700', border: 'border-violet-500' },
  3: { base: 'text-amber-500', light: 'bg-amber-500/10', dark: 'text-amber-700', border: 'border-amber-500' },
  4: { base: 'text-green-500', light: 'bg-green-500/10', dark: 'text-green-700', border: 'border-green-500' },
  5: { base: 'text-teal-500', light: 'bg-teal-500/10', dark: 'text-teal-700', border: 'border-teal-500' },
} as const satisfies Record<PhaseNumber, { base: string; light: string; dark: string; border: string }>

// ============================================================
// PROCESS-TO-PHASE MAPPING
// 16 processes distributed across 5 phases:
//   Phase 1 (Diagnostico):         processes 1-2   (2 processes)
//   Phase 2 (Engenharia de Valor): processes 3-6   (4 processes)
//   Phase 3 (Go-to-Market):        processes 7-11  (5 processes)
//   Phase 4 (Tracao e Vendas):     processes 12-15 (4 processes)
//   Phase 5 (Retencao e Escala):   process 16      (1 process)
// ============================================================
export const PROCESS_TO_PHASE: Record<number, PhaseNumber> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 2,
  6: 2,
  7: 3,
  8: 3,
  9: 3,
  10: 3,
  11: 3,
  12: 4,
  13: 4,
  14: 4,
  15: 4,
  16: 5,
}

// ============================================================
// SQUAD TYPES
// 4 squads, each responsible for a set of processes:
//   estrategia:   Phases 1-2 (market research, positioning, offers)
//   planejamento: Phase 3    (G-STIC planning, channels)
//   growth:       Phase 4    (creative, IMC, sales funnel)
//   crm:          Phase 5    (CLV, NPS, retention)
// ============================================================
export const SQUAD_TYPES = ['estrategia', 'planejamento', 'growth', 'crm', 'gate_review'] as const
export type SquadType = (typeof SQUAD_TYPES)[number]

// ============================================================
// PROCESS-TO-SQUAD MAPPING
// 16 processes mapped to their responsible squad
// ============================================================
export const PROCESS_TO_SQUAD: Record<number, SquadType> = {
  1: 'estrategia',
  2: 'estrategia',
  3: 'estrategia',
  4: 'estrategia',
  5: 'estrategia',
  6: 'estrategia',
  7: 'planejamento',
  8: 'planejamento',
  9: 'planejamento',
  10: 'planejamento',
  11: 'planejamento',
  12: 'growth',
  13: 'growth',
  14: 'growth',
  15: 'growth',
  16: 'crm',
}

// ============================================================
// GATE-TO-PHASE MAPPING
// 4 quality gates, one after each of phases 1-4.
// Phase 5 has no gate (it feeds back into Phase 1 for the next cycle).
// ============================================================
export const GATE_TO_PHASE: Record<number, PhaseNumber> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
}

// ============================================================
// STATUS ENUMS
// Values MUST exactly match CHECK constraints in 00001_initial_schema.sql
// ============================================================

/** clients.status */
export const CLIENT_STATUSES = ['active', 'archived'] as const
export type ClientStatus = (typeof CLIENT_STATUSES)[number]

/** phases.status */
export const PHASE_STATUSES = ['pending', 'active', 'completed'] as const
export type PhaseStatus = (typeof PHASE_STATUSES)[number]

/** processes.status */
export const PROCESS_STATUSES = ['pending', 'active', 'completed', 'failed'] as const
export type ProcessStatus = (typeof PROCESS_STATUSES)[number]

/** quality_gates.status */
export const GATE_STATUSES = ['pending', 'evaluating', 'approved', 'rejected'] as const
export type GateStatus = (typeof GATE_STATUSES)[number]

/** squad_jobs.status */
export const JOB_STATUSES = ['queued', 'running', 'completed', 'failed', 'cancelled'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

/** quality_gates.operator_decision */
export const GATE_DECISIONS = ['approved', 'rejected'] as const
export type GateDecision = (typeof GATE_DECISIONS)[number]
