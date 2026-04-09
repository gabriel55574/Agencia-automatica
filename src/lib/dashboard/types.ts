import type { PhaseNumber } from '@/lib/database/enums'

export type DashboardClient = {
  id: string
  name: string
  company: string
  current_phase_number: PhaseNumber
  status: 'active' | 'archived'
  updated_at: string
  created_at: string
  /** Highest active/completed process in current phase */
  current_process_number: number | null
  /** Quality gate status for the current phase */
  gate_status: 'pending' | 'evaluating' | 'approved' | 'rejected' | null
  /** Whether this client has a queued or running squad job */
  has_running_job: boolean
  /** When the client entered the current phase (for bottleneck calculation) */
  phase_started_at: string | null
}

export type PhaseColumn = {
  phase_number: PhaseNumber
  phase_name: string
  clients: DashboardClient[]
}

export type PendingApproval = {
  gate_id: string
  client_id: string
  client_name: string
  client_company: string
  gate_number: number
  phase_name: string
}

export type FailedGate = {
  gate_id: string
  client_id: string
  client_name: string
  client_company: string
  gate_number: number
  phase_name: string
  status: 'rejected'
}

export type RunningJob = {
  job_id: string
  client_id: string
  client_name: string
  client_company: string
  squad_type: string
  status: 'queued' | 'running'
}

export type ActionPanelData = {
  pendingApprovals: PendingApproval[]
  failedGates: FailedGate[]
  runningJobs: RunningJob[]
}

export type DashboardData = {
  columns: PhaseColumn[]
  stuckClients: DashboardClient[]
  actions: ActionPanelData
}
