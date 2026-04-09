// src/lib/types/pipeline.ts
// Row shapes returned from Supabase queries on the client profile page.
// Used as prop types for PipelineAccordion and child components.

export type PhaseRow = {
  id: string
  phase_number: number
  name: string
  status: 'pending' | 'active' | 'completed'
  started_at: string | null
  completed_at: string | null
}

export type ProcessRow = {
  id: string
  phase_id: string
  process_number: number
  name: string
  squad: 'estrategia' | 'planejamento' | 'growth' | 'crm'
  status: 'pending' | 'active' | 'completed' | 'failed'
}

export type GateRow = {
  id: string
  phase_id: string
  gate_number: number
  status: 'pending' | 'evaluating' | 'approved' | 'rejected'
  operator_decision: 'approved' | 'rejected' | null
  operator_notes: string | null
}

/** Most recent squad_job data for a process, used by pipeline accordion */
export type LatestJobData = {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  structured_output: Record<string, unknown> | null
  output: string | null
}

/** Row shape from gate_reviews table, used as prop for GateReviewDisplay */
export type GateReviewRow = {
  id: string
  gate_id: string
  client_id: string
  squad_job_id: string | null
  verdict: Record<string, unknown>
  raw_output: string
  status: 'running' | 'completed' | 'failed'
  created_at: string
}
