export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      architectures: {
        Row: {
          created_at: string;
          edges: Json;
          id: string;
          name: string;
          nodes: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          edges?: Json;
          id?: string;
          name: string;
          nodes?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          edges?: Json;
          id?: string;
          name?: string;
          nodes?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      compliance_runs: {
        Row: {
          created_at: string;
          findings: Json;
          framework: string;
          id: string;
          score: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          findings?: Json;
          framework: string;
          id?: string;
          score: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          findings?: Json;
          framework?: string;
          id?: string;
          score?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      leaderboard: {
        Row: {
          badges: Json;
          display_name: string;
          id: string;
          labs_completed: number;
          points: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          badges?: Json;
          display_name: string;
          id?: string;
          labs_completed?: number;
          points?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          badges?: Json;
          display_name?: string;
          id?: string;
          labs_completed?: number;
          points?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          completed: boolean;
          created_at: string;
          id: string;
          lesson_slug: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          lesson_slug: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          created_at?: string;
          id?: string;
          lesson_slug?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          provider: Database["public"]["Enums"]["sub_provider"];
          provider_payment_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          provider: Database["public"]["Enums"]["sub_provider"];
          provider_payment_id: string;
          status: string;
          user_id: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          provider?: Database["public"]["Enums"]["sub_provider"];
          provider_payment_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scan_results: {
        Row: {
          created_at: string;
          filename: string;
          findings: Json;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          filename: string;
          findings?: Json;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          filename?: string;
          findings?: Json;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      soc_events: {
        Row: {
          attack_type: string;
          created_at: string;
          id: string;
          message: string | null;
          severity: string;
          source_country: string | null;
          source_ip: string | null;
          source_lat: number | null;
          source_lng: number | null;
          target: string | null;
          user_id: string | null;
        };
        Insert: {
          attack_type: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          severity: string;
          source_country?: string | null;
          source_ip?: string | null;
          source_lat?: number | null;
          source_lng?: number | null;
          target?: string | null;
          user_id?: string | null;
        };
        Update: {
          attack_type?: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          severity?: string;
          source_country?: string | null;
          source_ip?: string | null;
          source_lat?: number | null;
          source_lng?: number | null;
          target?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          created_at: string;
          current_period_end: string | null;
          id: string;
          plan: Database["public"]["Enums"]["sub_plan"];
          provider: Database["public"]["Enums"]["sub_provider"];
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          status: Database["public"]["Enums"]["sub_status"];
          trial_ends_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          plan?: Database["public"]["Enums"]["sub_plan"];
          provider?: Database["public"]["Enums"]["sub_provider"];
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["sub_status"];
          trial_ends_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          plan?: Database["public"]["Enums"]["sub_plan"];
          provider?: Database["public"]["Enums"]["sub_provider"];
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["sub_status"];
          trial_ends_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          joined_at: string;
          role: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          joined_at?: string;
          role?: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          joined_at?: string;
          role?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
          owner_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invite_code?: string;
          name: string;
          owner_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invite_code?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      threat_intel: {
        Row: {
          cached_at: string;
          cve_id: string;
          cvss_score: number | null;
          description: string | null;
          id: string;
          published_at: string | null;
          severity: string | null;
          source_url: string | null;
          title: string | null;
        };
        Insert: {
          cached_at?: string;
          cve_id: string;
          cvss_score?: number | null;
          description?: string | null;
          id?: string;
          published_at?: string | null;
          severity?: string | null;
          source_url?: string | null;
          title?: string | null;
        };
        Update: {
          cached_at?: string;
          cve_id?: string;
          cvss_score?: number | null;
          description?: string | null;
          id?: string;
          published_at?: string | null;
          severity?: string | null;
          source_url?: string | null;
          title?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_active_access: { Args: { _user_id: string }; Returns: boolean };
      is_team_member: {
        Args: { _team_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      sub_plan: "free" | "pro_monthly" | "pro_yearly";
      sub_provider: "stripe" | "razorpay" | "none";
      sub_status: "trialing" | "active" | "past_due" | "canceled" | "expired";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      sub_plan: ["free", "pro_monthly", "pro_yearly"],
      sub_provider: ["stripe", "razorpay", "none"],
      sub_status: ["trialing", "active", "past_due", "canceled", "expired"],
    },
  },
} as const;
