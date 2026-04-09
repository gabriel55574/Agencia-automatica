export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          briefing: Json | null
          company: string
          created_at: string
          current_phase_number: number
          cycle_number: number
          id: string
          metadata: Json | null
          name: string
          previous_cycle_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          briefing?: Json | null
          company: string
          created_at?: string
          current_phase_number?: number
          cycle_number?: number
          id?: string
          metadata?: Json | null
          name: string
          previous_cycle_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          briefing?: Json | null
          company?: string
          created_at?: string
          current_phase_number?: number
          cycle_number?: number
          id?: string
          metadata?: Json | null
          name?: string
          previous_cycle_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_previous_cycle_id_fkey"
            columns: ["previous_cycle_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          client_id: string
          created_at: string
          file_name: string
          file_type: string
          id: string
          metadata: Json | null
          phase_number: number
          process_id: string | null
          storage_path: string
        }
        Insert: {
          client_id: string
          created_at?: string
          file_name: string
          file_type: string
          id?: string
          metadata?: Json | null
          phase_number: number
          process_id?: string | null
          storage_path: string
        }
        Update: {
          client_id?: string
          created_at?: string
          file_name?: string
          file_type?: string
          id?: string
          metadata?: Json | null
          phase_number?: number
          process_id?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_reviews: {
        Row: {
          client_id: string
          created_at: string
          gate_id: string
          id: string
          raw_output: string
          squad_job_id: string | null
          status: string
          verdict: Json
        }
        Insert: {
          client_id: string
          created_at?: string
          gate_id: string
          id?: string
          raw_output: string
          squad_job_id?: string | null
          status?: string
          verdict: Json
        }
        Update: {
          client_id?: string
          created_at?: string
          gate_id?: string
          id?: string
          raw_output?: string
          squad_job_id?: string | null
          status?: string
          verdict?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gate_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gate_reviews_gate_id_fkey"
            columns: ["gate_id"]
            isOneToOne: false
            referencedRelation: "quality_gates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gate_reviews_squad_job_id_fkey"
            columns: ["squad_job_id"]
            isOneToOne: false
            referencedRelation: "squad_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          name: string
          phase_number: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          phase_number: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          phase_number?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          input_snapshot: Json | null
          name: string
          output_json: Json | null
          output_markdown: string | null
          phase_id: string
          process_number: number
          squad: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          input_snapshot?: Json | null
          name: string
          output_json?: Json | null
          output_markdown?: string | null
          phase_id: string
          process_number: number
          squad: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          input_snapshot?: Json | null
          name?: string
          output_json?: Json | null
          output_markdown?: string | null
          phase_id?: string
          process_number?: number
          squad?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_gates: {
        Row: {
          ai_review_json: Json | null
          checklist_results: Json | null
          client_id: string
          created_at: string
          gate_number: number
          id: string
          operator_decision: string | null
          operator_notes: string | null
          phase_id: string
          reviewed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_review_json?: Json | null
          checklist_results?: Json | null
          client_id: string
          created_at?: string
          gate_number: number
          id?: string
          operator_decision?: string | null
          operator_notes?: string | null
          phase_id: string
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_review_json?: Json | null
          checklist_results?: Json | null
          client_id?: string
          created_at?: string
          gate_number?: number
          id?: string
          operator_decision?: string | null
          operator_notes?: string | null
          phase_id?: string
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_gates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_gates_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_jobs: {
        Row: {
          attempts: number
          cli_command: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          error_log: string | null
          id: string
          max_attempts: number
          output: string | null
          phase_id: string
          process_id: string | null
          progress_log: string | null
          squad_type: string
          started_at: string | null
          status: string
          structured_output: Json | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          cli_command?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          error_log?: string | null
          id?: string
          max_attempts?: number
          output?: string | null
          phase_id: string
          process_id?: string | null
          progress_log?: string | null
          squad_type: string
          started_at?: string | null
          status?: string
          structured_output?: Json | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          cli_command?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          error_log?: string | null
          id?: string
          max_attempts?: number
          output?: string | null
          phase_id?: string
          process_id?: string | null
          progress_log?: string | null
          squad_type?: string
          started_at?: string | null
          status?: string
          structured_output?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_jobs_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_jobs_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_gate: {
        Args: { p_client_id: string; p_gate_id: string }
        Returns: undefined
      }
      claim_next_job: {
        Args: Record<PropertyKey, never>
        Returns: {
          attempts: number
          cli_command: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          error_log: string | null
          id: string
          max_attempts: number
          output: string | null
          phase_id: string
          process_id: string | null
          progress_log: string | null
          squad_type: string
          started_at: string | null
          status: string
          structured_output: Json | null
          updated_at: string
        }[]
      }
      create_client_with_phases: {
        Args: { p_briefing?: Json; p_company: string; p_name: string }
        Returns: string
      }
      reject_gate: {
        Args: {
          p_client_id: string
          p_failed_process_ids: string[]
          p_gate_id: string
          p_notes?: string
        }
        Returns: undefined
      }
      reset_pipeline_cycle: {
        Args: { p_client_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
