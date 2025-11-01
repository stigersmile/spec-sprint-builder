export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      babies: {
        Row: {
          birth_date: string
          created_at: string
          created_by: string
          gender: string | null
          id: string
          name: string
          photo: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          created_by: string
          gender?: string | null
          id?: string
          name: string
          photo?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          created_by?: string
          gender?: string | null
          id?: string
          name?: string
          photo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      baby_caregivers: {
        Row: {
          baby_id: string
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["caregiver_role"]
          user_id: string
        }
        Insert: {
          baby_id: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["caregiver_role"]
          user_id: string
        }
        Update: {
          baby_id?: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["caregiver_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "baby_caregivers_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      diaper_records: {
        Row: {
          baby_id: string
          consistency: string | null
          created_at: string
          id: string
          notes: string | null
          poop_color: string | null
          timestamp: string
          type: string
          updated_at: string
        }
        Insert: {
          baby_id: string
          consistency?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          poop_color?: string | null
          timestamp: string
          type: string
          updated_at?: string
        }
        Update: {
          baby_id?: string
          consistency?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          poop_color?: string | null
          timestamp?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diaper_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_records: {
        Row: {
          amount: number | null
          baby_id: string
          created_at: string
          duration: number | null
          id: string
          notes: string | null
          timestamp: string
          type: string
          unit: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          baby_id: string
          created_at?: string
          duration?: number | null
          id?: string
          notes?: string | null
          timestamp: string
          type: string
          unit: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          baby_id?: string
          created_at?: string
          duration?: number | null
          id?: string
          notes?: string | null
          timestamp?: string
          type?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          baby_id: string
          created_at: string
          id: string
          location: string | null
          notes: string | null
          timestamp: string
          type: string
          unit: string
          updated_at: string
          value: number
        }
        Insert: {
          baby_id: string
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          timestamp: string
          type: string
          unit: string
          updated_at?: string
          value: number
        }
        Update: {
          baby_id?: string
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          timestamp?: string
          type?: string
          unit?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          baby_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["caregiver_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          baby_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["caregiver_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          baby_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["caregiver_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_records: {
        Row: {
          baby_id: string
          created_at: string
          duration: number | null
          end_time: string | null
          id: string
          notes: string | null
          quality: string | null
          start_time: string
          type: string
          updated_at: string
        }
        Insert: {
          baby_id: string
          created_at?: string
          duration?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          quality?: string | null
          start_time: string
          type: string
          updated_at?: string
        }
        Update: {
          baby_id?: string
          created_at?: string
          duration?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          quality?: string | null
          start_time?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_baby_role: {
        Args: { p_baby_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["caregiver_role"]
      }
      user_can_edit_baby: {
        Args: { p_baby_id: string; p_user_id: string }
        Returns: boolean
      }
      user_has_baby_access: {
        Args: { p_baby_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      caregiver_role: "owner" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      caregiver_role: ["owner", "editor", "viewer"],
    },
  },
} as const
