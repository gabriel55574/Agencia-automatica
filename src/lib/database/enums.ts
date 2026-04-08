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
export const SQUAD_TYPES = ['estrategia', 'planejamento', 'growth', 'crm'] as const
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
