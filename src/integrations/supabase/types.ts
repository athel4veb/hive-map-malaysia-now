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
      grant_programs: {
        Row: {
          company_name: string | null
          contact_info: string | null
          description_services: string | null
          fund_name: string | null
          id: number
          industry_sector: string | null
          program_participation: string | null
          related_news_updates: string | null
          social_enterprise_status: string | null
          website_url: string | null
        }
        Insert: {
          company_name?: string | null
          contact_info?: string | null
          description_services?: string | null
          fund_name?: string | null
          id?: number
          industry_sector?: string | null
          program_participation?: string | null
          related_news_updates?: string | null
          social_enterprise_status?: string | null
          website_url?: string | null
        }
        Update: {
          company_name?: string | null
          contact_info?: string | null
          description_services?: string | null
          fund_name?: string | null
          id?: number
          industry_sector?: string | null
          program_participation?: string | null
          related_news_updates?: string | null
          social_enterprise_status?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      grant_urls: {
        Row: {
          created_at: string
          url: string
        }
        Insert: {
          created_at?: string
          url: string
        }
        Update: {
          created_at?: string
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      startup: {
        Row: {
          Awards: string | null
          CompanyName: string | null
          Grants: string | null
          Impact: string | null
          InstitutionalSupport: string | null
          Location: string | null
          MaGICAccredited: string | null
          No: number
          ProblemTheySolve: string | null
          RevenueModel: string | null
          Sector: string | null
          TargetBeneficiaries: string | null
          WebsiteSocialMedia: string | null
          WhatTheyDo: string | null
          YearFounded: number | null
        }
        Insert: {
          Awards?: string | null
          CompanyName?: string | null
          Grants?: string | null
          Impact?: string | null
          InstitutionalSupport?: string | null
          Location?: string | null
          MaGICAccredited?: string | null
          No: number
          ProblemTheySolve?: string | null
          RevenueModel?: string | null
          Sector?: string | null
          TargetBeneficiaries?: string | null
          WebsiteSocialMedia?: string | null
          WhatTheyDo?: string | null
          YearFounded?: number | null
        }
        Update: {
          Awards?: string | null
          CompanyName?: string | null
          Grants?: string | null
          Impact?: string | null
          InstitutionalSupport?: string | null
          Location?: string | null
          MaGICAccredited?: string | null
          No?: number
          ProblemTheySolve?: string | null
          RevenueModel?: string | null
          Sector?: string | null
          TargetBeneficiaries?: string | null
          WebsiteSocialMedia?: string | null
          WhatTheyDo?: string | null
          YearFounded?: number | null
        }
        Relationships: []
      }
      startup_urls: {
        Row: {
          created_at: string
          url: string
        }
        Insert: {
          created_at?: string
          url: string
        }
        Update: {
          created_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
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
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
