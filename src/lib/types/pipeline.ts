// src/lib/types/pipeline.ts
// Row shapes returned from Supabase queries on the client profile page.
// Used as prop types for PipelineAccordion and child components.

export type PhaseRow = {
  id: string
  phase_number: number
  name: string
  status: string
  started_at: string | null
  completed_at: string | null
}

export type ProcessRow = {
  id: string
  phase_id: string
  process_number: number
  name: string
  squad: string
  status: string
}

export type GateRow = {
  id: string
  phase_id: string
  gate_number: number
  status: string
  operator_decision: string | null
  operator_notes: string | null
}

/** Most recent squad_job data for a process, used by pipeline accordion */
export type LatestJobData = {
  id: string
  status: string
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
  status: string
  created_at: string
}
