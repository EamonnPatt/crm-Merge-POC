// Generated from the Supabase project (public schema). Regenerate after a migration with the Supabase MCP
// `generate_typescript_types` tool, or `npx supabase gen types typescript --project-id oqkmiadbknizlzelgusz`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          am_project_access: boolean
          am_see_all_order_issues: boolean
          id: boolean
          integrations: Json
          notifications: Json
          order_sheet_embed_url: string
          order_sheet_url: string
          security: Json
          updated_at: string
          updated_by_id: string | null
        }
        Insert: {
          am_project_access?: boolean
          am_see_all_order_issues?: boolean
          id?: boolean
          integrations?: Json
          notifications?: Json
          order_sheet_embed_url?: string
          order_sheet_url?: string
          security?: Json
          updated_at?: string
          updated_by_id?: string | null
        }
        Update: {
          am_project_access?: boolean
          am_see_all_order_issues?: boolean
          id?: boolean
          integrations?: Json
          notifications?: Json
          order_sheet_embed_url?: string
          order_sheet_url?: string
          security?: Json
          updated_at?: string
          updated_by_id?: string | null
        }
        Relationships: []
      }
      app_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      assistant_supports: {
        Row: { account_manager_id: string; assistant_id: string }
        Insert: { account_manager_id: string; assistant_id: string }
        Update: { account_manager_id?: string; assistant_id?: string }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string
          actor_name: string
          actor_role: string
          details: string
          entity: string
          id: string
          occurred_at: string
        }
        Insert: {
          action: string
          actor_id?: string
          actor_name: string
          actor_role: string
          details?: string
          entity: string
          id?: string
          occurred_at?: string
        }
        Update: {
          action?: string
          actor_id?: string
          actor_name?: string
          actor_role?: string
          details?: string
          entity?: string
          id?: string
          occurred_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          fiscal_year: number
          gp_monthly: number[] | null
          id: string
          notes: string
          rep_id: string
          sales_monthly: number[] | null
          updated_at: string
          updated_by_id: string | null
        }
        Insert: {
          fiscal_year: number
          gp_monthly?: number[] | null
          id?: string
          notes?: string
          rep_id: string
          sales_monthly?: number[] | null
          updated_at?: string
          updated_by_id?: string | null
        }
        Update: {
          fiscal_year?: number
          gp_monthly?: number[] | null
          id?: string
          notes?: string
          rep_id?: string
          sales_monthly?: number[] | null
          updated_at?: string
          updated_by_id?: string | null
        }
        Relationships: []
      }
      business_day_overrides: {
        Row: { fiscal_year: number; monthly: number[]; updated_at: string; updated_by_id: string | null }
        Insert: { fiscal_year: number; monthly: number[]; updated_at?: string; updated_by_id?: string | null }
        Update: { fiscal_year?: number; monthly?: number[]; updated_at?: string; updated_by_id?: string | null }
        Relationships: []
      }
      customer_aliases: {
        Row: { alias: string; customer_id: string; source: Database["public"]["Enums"]["source_system"] }
        Insert: { alias: string; customer_id: string; source: Database["public"]["Enums"]["source_system"] }
        Update: { alias?: string; customer_id?: string; source?: Database["public"]["Enums"]["source_system"] }
        Relationships: []
      }
      customers: {
        Row: {
          account_manager_id: string
          company: string
          created_at: string
          email: string
          id: string
          lifetime_value: number
          ly_gross_profit: number
          monthly_activity_logged: boolean
          name: string
          notes: string
          phone: string
          priority: Database["public"]["Enums"]["account_priority"]
          since: string
          source: Database["public"]["Enums"]["account_source"]
          total_orders: number
          updated_at: string
          weekly_activity_logged: boolean
        }
        Insert: {
          account_manager_id: string
          company: string
          created_at?: string
          email?: string
          id?: string
          lifetime_value?: number
          ly_gross_profit?: number
          monthly_activity_logged?: boolean
          name: string
          notes?: string
          phone?: string
          priority?: Database["public"]["Enums"]["account_priority"]
          since?: string
          source?: Database["public"]["Enums"]["account_source"]
          total_orders?: number
          updated_at?: string
          weekly_activity_logged?: boolean
        }
        Update: {
          account_manager_id?: string
          company?: string
          created_at?: string
          email?: string
          id?: string
          lifetime_value?: number
          ly_gross_profit?: number
          monthly_activity_logged?: boolean
          name?: string
          notes?: string
          phone?: string
          priority?: Database["public"]["Enums"]["account_priority"]
          since?: string
          source?: Database["public"]["Enums"]["account_source"]
          total_orders?: number
          updated_at?: string
          weekly_activity_logged?: boolean
        }
        Relationships: []
      }
      dashboard_shares: {
        Row: { assistant_id: string; owner_id: string; shared_at: string }
        Insert: { assistant_id: string; owner_id: string; shared_at?: string }
        Update: { assistant_id?: string; owner_id?: string; shared_at?: string }
        Relationships: []
      }
      data_sources: {
        Row: {
          last_sync: string | null
          method: string
          name: Database["public"]["Enums"]["source_system"]
          records_synced: number
          status: Database["public"]["Enums"]["sync_status"]
        }
        Insert: {
          last_sync?: string | null
          method?: string
          name: Database["public"]["Enums"]["source_system"]
          records_synced?: number
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Update: {
          last_sync?: string | null
          method?: string
          name?: Database["public"]["Enums"]["source_system"]
          records_synced?: number
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Relationships: []
      }
      ingest_batches: {
        Row: {
          error: string | null
          file_name: string | null
          finished_at: string | null
          id: number
          kind: string
          loaded_by_id: string | null
          rows_loaded: number
          source: Database["public"]["Enums"]["source_system"]
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          file_name?: string | null
          finished_at?: string | null
          id?: never
          kind?: string
          loaded_by_id?: string | null
          rows_loaded?: number
          source: Database["public"]["Enums"]["source_system"]
          started_at?: string
          status?: string
        }
        Update: {
          error?: string | null
          file_name?: string | null
          finished_at?: string | null
          id?: never
          kind?: string
          loaded_by_id?: string | null
          rows_loaded?: number
          source?: Database["public"]["Enums"]["source_system"]
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      order_issues: {
        Row: {
          account_manager_id: string
          assigned_to_id: string | null
          customer_name: string
          id: string
          in_hand_date: string | null
          issue_type: string
          notes: string
          opened_on: string
          order_number: string
          resolved_on: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          status: Database["public"]["Enums"]["issue_status"]
          updated_at: string
          updated_by_id: string | null
        }
        Insert: {
          account_manager_id: string
          assigned_to_id?: string | null
          customer_name: string
          id?: string
          in_hand_date?: string | null
          issue_type: string
          notes?: string
          opened_on?: string
          order_number: string
          resolved_on?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          updated_at?: string
          updated_by_id?: string | null
        }
        Update: {
          account_manager_id?: string
          assigned_to_id?: string | null
          customer_name?: string
          id?: string
          in_hand_date?: string | null
          issue_type?: string
          notes?: string
          opened_on?: string
          order_number?: string
          resolved_on?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          updated_at?: string
          updated_by_id?: string | null
        }
        Relationships: []
      }
      pipeline_deals: {
        Row: {
          close_date: string | null
          company: string
          created_at: string
          id: string
          name: string
          owner_id: string
          stage: Database["public"]["Enums"]["pipeline_stage"]
          updated_at: string
          value: number
        }
        Insert: {
          close_date?: string | null
          company: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
          value?: number
        }
        Update: {
          close_date?: string | null
          company?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      project_tracker: {
        Row: {
          account_manager_id: string
          account_name: string
          historical_projects: string
          id: string
          links: Json
          notes: string
          plan_month: string
          potential_projects: string
          status: Database["public"]["Enums"]["project_status"]
          target_value: number
          updated_at: string
          updated_by_id: string | null
        }
        Insert: {
          account_manager_id: string
          account_name: string
          historical_projects?: string
          id?: string
          links?: Json
          notes?: string
          plan_month: string
          potential_projects?: string
          status?: Database["public"]["Enums"]["project_status"]
          target_value?: number
          updated_at?: string
          updated_by_id?: string | null
        }
        Update: {
          account_manager_id?: string
          account_name?: string
          historical_projects?: string
          id?: string
          links?: Json
          notes?: string
          plan_month?: string
          potential_projects?: string
          status?: Database["public"]["Enums"]["project_status"]
          target_value?: number
          updated_at?: string
          updated_by_id?: string | null
        }
        Relationships: []
      }
      prospects: {
        Row: {
          company: string
          created_at: string
          est_value: number
          id: string
          last_contact: string | null
          name: string
          owner_id: string
          stage: Database["public"]["Enums"]["pipeline_stage"]
          updated_at: string
        }
        Insert: {
          company: string
          created_at?: string
          est_value?: number
          id?: string
          last_contact?: string | null
          name: string
          owner_id: string
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          est_value?: number
          id?: string
          last_contact?: string | null
          name?: string
          owner_id?: string
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
        }
        Relationships: []
      }
      referral_partners: {
        Row: {
          commission_owed: number
          contact: string
          conversions: number
          created_at: string
          id: string
          name: string
          referrals_sent: number
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
        }
        Insert: {
          commission_owed?: number
          contact?: string
          conversions?: number
          created_at?: string
          id?: string
          name: string
          referrals_sent?: number
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
        }
        Update: {
          commission_owed?: number
          contact?: string
          conversions?: number
          created_at?: string
          id?: string
          name?: string
          referrals_sent?: number
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
        }
        Relationships: []
      }
      rep_aliases: {
        Row: { alias: string; source: Database["public"]["Enums"]["source_system"]; user_id: string }
        Insert: { alias: string; source: Database["public"]["Enums"]["source_system"]; user_id: string }
        Update: { alias?: string; source?: Database["public"]["Enums"]["source_system"]; user_id?: string }
        Relationships: []
      }
      sales_orders: {
        Row: {
          amount: number
          cost: number
          created_at: string
          customer_id: string | null
          customer_name: string
          gross_profit: number | null
          id: number
          ingest_batch_id: number | null
          invoice_date: string
          order_number: string
          rep_id: string
          source: Database["public"]["Enums"]["source_system"]
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          cost: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          gross_profit?: number | null
          id?: never
          ingest_batch_id?: number | null
          invoice_date: string
          order_number: string
          rep_id: string
          source: Database["public"]["Enums"]["source_system"]
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          cost?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          gross_profit?: number | null
          id?: never
          ingest_batch_id?: number | null
          invoice_date?: string
          order_number?: string
          rep_id?: string
          source?: Database["public"]["Enums"]["source_system"]
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      rep_monthly_performance: {
        Row: {
          cost: number | null
          fiscal_year: number | null
          gross_profit: number | null
          margin_pct: number | null
          month: number | null
          order_count: number | null
          rep_id: string | null
          sales: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_priority: "A" | "B" | "Prospect"
      account_source: "ASI SmartBooks" | "Facilis Syncore" | "Created in app"
      app_role: "super_user" | "management" | "account_manager" | "assistant" | "csr"
      issue_severity: "low" | "medium" | "high"
      issue_status: "open" | "in_progress" | "resolved"
      order_status: "paid" | "pending" | "overdue"
      partner_status: "active" | "inactive"
      pipeline_stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed_won"
      project_status: "researching" | "active" | "on_hold" | "won" | "lost"
      source_system: "ASI SmartBooks" | "Facilis Syncore"
      sync_status: "connected" | "attention"
      user_status: "active" | "invited"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

/** Row type of a table or view, e.g. Tables<"customers">. */
export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> = (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T] extends { Insert: infer I } ? I : never
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T] extends { Update: infer U } ? U : never
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
