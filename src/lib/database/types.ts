/**
 * Agency OS: Database TypeScript types
 *
 * Hand-generated from supabase/migrations/00001_initial_schema.sql
 * (Docker not running — replace with `supabase gen types typescript --local` when available)
 *
 * Re-generate when schema changes: npm run db:types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          company: string
          briefing: Json | null
          current_phase_number: number
          status: 'active' | 'archived'
          cycle_number: number
          previous_cycle_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company: string
          briefing?: Json | null
          current_phase_number?: number
          status?: 'active' | 'archived'
          cycle_number?: number
          previous_cycle_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string
          briefing?: Json | null
          current_phase_number?: number
          status?: 'active' | 'archived'
          cycle_number?: number
          previous_cycle_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      phases: {
        Row: {
          id: string
          client_id: string
          phase_number: number
          name: string
          status: 'pending' | 'active' | 'completed'
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          phase_number: number
          name: string
          status?: 'pending' | 'active' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          phase_number?: number
          name?: string
          status?: 'pending' | 'active' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      processes: {
        Row: {
          id: string
          phase_id: string
          client_id: string
          process_number: number
          name: string
          squad: 'estrategia' | 'planejamento' | 'growth' | 'crm'
          status: 'pending' | 'active' | 'completed' | 'failed'
          input_snapshot: Json | null
          output_json: Json | null
          output_markdown: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phase_id: string
          client_id: string
          process_number: number
          name: string
          squad: 'estrategia' | 'planejamento' | 'growth' | 'crm'
          status?: 'pending' | 'active' | 'completed' | 'failed'
          input_snapshot?: Json | null
          output_json?: Json | null
          output_markdown?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phase_id?: string
          client_id?: string
          process_number?: number
          name?: string
          squad?: 'estrategia' | 'planejamento' | 'growth' | 'crm'
          status?: 'pending' | 'active' | 'completed' | 'failed'
          input_snapshot?: Json | null
          output_json?: Json | null
          output_markdown?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quality_gates: {
        Row: {
          id: string
          phase_id: string
          client_id: string
          gate_number: number
          status: 'pending' | 'evaluating' | 'approved' | 'rejected'
          ai_review_json: Json | null
          checklist_results: Json | null
          operator_decision: 'approved' | 'rejected' | null
          operator_notes: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phase_id: string
          client_id: string
          gate_number: number
          status?: 'pending' | 'evaluating' | 'approved' | 'rejected'
          ai_review_json?: Json | null
          checklist_results?: Json | null
          operator_decision?: 'approved' | 'rejected' | null
          operator_notes?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phase_id?: string
          client_id?: string
          gate_number?: number
          status?: 'pending' | 'evaluating' | 'approved' | 'rejected'
          ai_review_json?: Json | null
          checklist_results?: Json | null
          operator_decision?: 'approved' | 'rejected' | null
          operator_notes?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      squad_jobs: {
        Row: {
          id: string
          client_id: string
          phase_id: string
          process_id: string | null
          squad_type: 'estrategia' | 'planejamento' | 'growth' | 'crm'
          status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
          cli_command: string | null
          progress_log: string | null
          output: string | null
          error_log: string | null
          attempts: number
          max_attempts: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          phase_id: string
          process_id?: string | null
          squad_type: 'estrategia' | 'planejamento' | 'growth' | 'crm'
          status?: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
          cli_command?: string | null
          progress_log?: string | null
          output?: string | null
          error_log?: string | null
          attempts?: number
          max_attempts?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          phase_id?: string
          process_id?: string | null
          squad_type?: 'estrategia' | 'planejamento' | 'growth' | 'crm'
          status?: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
          cli_command?: string | null
          progress_log?: string | null
          output?: string | null
          error_log?: string | null
          attempts?: number
          max_attempts?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deliverables: {
        Row: {
          id: string
          client_id: string
          process_id: string | null
          phase_number: number
          file_type: string
          storage_path: string
          file_name: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          process_id?: string | null
          phase_number: number
          file_type: string
          storage_path: string
          file_name: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          process_id?: string | null
          phase_number?: number
          file_type?: string
          storage_path?: string
          file_name?: string
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      client_status: 'active' | 'archived'
      phase_status: 'pending' | 'active' | 'completed'
      process_status: 'pending' | 'active' | 'completed' | 'failed'
      gate_status: 'pending' | 'evaluating' | 'approved' | 'rejected'
      gate_decision: 'approved' | 'rejected'
      squad_type: 'estrategia' | 'planejamento' | 'growth' | 'crm'
      job_status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
    }
  }
}

/** Convenience type helpers */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
