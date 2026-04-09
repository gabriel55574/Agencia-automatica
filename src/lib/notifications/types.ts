/**
 * Agency OS: Notification type definitions
 *
 * Data payloads for each notification type, used by templates and notify functions.
 */

export interface SquadCompletionData {
  client_name: string
  client_company: string
  process_name: string
  squad_type: string
  status: 'completed' | 'failed'
  error_excerpt: string | null
  completed_at: string
}

export interface GateFailureData {
  client_name: string
  client_company: string
  phase_name: string
  gate_number: number
  overall_verdict: 'fail' | 'partial'
  failed_items_count: number
  total_items_count: number
  summary: string
}

export interface DigestClientPhase {
  phase_number: number
  phase_name: string
  count: number
}

export interface DigestStuckClient {
  name: string
  company: string
  phase: string
  days_stuck: number
}

export interface DigestData {
  date: string
  clients_by_phase: DigestClientPhase[]
  pending_approvals: number
  failed_gates: number
  stuck_clients: DigestStuckClient[]
  yesterday_completed_runs: number
  total_active_clients: number
}

export interface NotificationPreferences {
  squad_completion_enabled: boolean
  gate_failure_enabled: boolean
  daily_digest_enabled: boolean
  digest_hour_utc: number
  email: string
}
