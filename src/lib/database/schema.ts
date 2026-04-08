/**
 * Agency OS: Zod validation schemas mirroring the database tables.
 *
 * These schemas serve three purposes:
 * 1. Runtime validation of data at API boundaries (form inputs, CLI output parsing)
 * 2. TypeScript type inference (eliminates hand-written interfaces)
 * 3. Documentation of the data model in executable form
 *
 * IMPORTANT: Enum values in z.enum() MUST exactly match:
 * - The CHECK constraint values in supabase/migrations/00001_initial_schema.sql
 * - The status arrays in src/lib/database/enums.ts
 *
 * Uses Zod v3 syntax. Do NOT use Zod v4 breaking changes.
 */

import { z } from 'zod'
import {
  CLIENT_STATUSES,
  PHASE_STATUSES,
  PROCESS_STATUSES,
  GATE_STATUSES,
  JOB_STATUSES,
  GATE_DECISIONS,
  SQUAD_TYPES,
} from './enums'

// ============================================================
// CLIENT schemas
// ============================================================

/** Schema for creating a new client (subset of full client fields) */
export const clientInsertSchema = z.object({
  name: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  briefing: z.record(z.string(), z.unknown()).nullable().optional(),
  status: z.enum(CLIENT_STATUSES).default('active'),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

/** Full client row schema (mirrors clients table) */
export const clientSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  company: z.string(),
  briefing: z.record(z.string(), z.unknown()).nullable(),
  current_phase_number: z.number().int().min(1).max(5),
  status: z.enum(CLIENT_STATUSES),
  cycle_number: z.number().int().min(1),
  previous_cycle_id: z.string().uuid().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// ============================================================
// PHASE schemas
// ============================================================

/** Full phase row schema (mirrors phases table) */
export const phaseSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  phase_number: z.number().int().min(1).max(5),
  name: z.string(),
  status: z.enum(PHASE_STATUSES),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// ============================================================
// PROCESS schemas
// ============================================================

/** Full process row schema (mirrors processes table) */
export const processSchema = z.object({
  id: z.string().uuid(),
  phase_id: z.string().uuid(),
  client_id: z.string().uuid(),
  process_number: z.number().int().min(1).max(16),
  name: z.string(),
  squad: z.enum(SQUAD_TYPES),
  status: z.enum(PROCESS_STATUSES),
  input_snapshot: z.record(z.string(), z.unknown()).nullable(),
  output_json: z.record(z.string(), z.unknown()).nullable(),
  output_markdown: z.string().nullable(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// ============================================================
// QUALITY GATE schemas
// ============================================================

/** Full quality_gate row schema (mirrors quality_gates table) */
export const qualityGateSchema = z.object({
  id: z.string().uuid(),
  phase_id: z.string().uuid(),
  client_id: z.string().uuid(),
  gate_number: z.number().int().min(1).max(4),
  status: z.enum(GATE_STATUSES),
  ai_review_json: z.record(z.string(), z.unknown()).nullable(),
  checklist_results: z.record(z.string(), z.unknown()).nullable(),
  operator_decision: z.enum(GATE_DECISIONS).nullable(),
  operator_notes: z.string().nullable(),
  reviewed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// ============================================================
// SQUAD JOB schemas
// ============================================================

/** Full squad_job row schema (mirrors squad_jobs table) */
export const squadJobSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  phase_id: z.string().uuid(),
  process_id: z.string().uuid().nullable(),
  squad_type: z.enum(SQUAD_TYPES),
  status: z.enum(JOB_STATUSES),
  cli_command: z.string().nullable(),
  progress_log: z.string().nullable(),
  output: z.string().nullable(),
  error_log: z.string().nullable(),
  attempts: z.number().int().min(0),
  max_attempts: z.number().int().min(1),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// ============================================================
// DELIVERABLE schemas
// ============================================================

/** Full deliverable row schema (mirrors deliverables table) */
export const deliverableSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  process_id: z.string().uuid().nullable(),
  phase_number: z.number().int(),
  file_type: z.string(),
  storage_path: z.string(),
  file_name: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.string().datetime(),
})

// ============================================================
// EXPORTED TYPES
// Inferred from schemas -- these are the canonical TypeScript types for the domain.
// Do NOT hand-write these interfaces; let Zod infer them.
// ============================================================
export type Client = z.infer<typeof clientSchema>
export type ClientInsert = z.infer<typeof clientInsertSchema>
export type Phase = z.infer<typeof phaseSchema>
export type Process = z.infer<typeof processSchema>
export type QualityGate = z.infer<typeof qualityGateSchema>
export type SquadJob = z.infer<typeof squadJobSchema>
export type Deliverable = z.infer<typeof deliverableSchema>
