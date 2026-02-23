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
      forum_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          property_id: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_regions: {
        Row: {
          cities: string[] | null
          country: string
          created_at: string | null
          id: string
          region: string
        }
        Insert: {
          cities?: string[] | null
          country: string
          created_at?: string | null
          id?: string
          region: string
        }
        Update: {
          cities?: string[] | null
          country?: string
          created_at?: string | null
          id?: string
          region?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          inquiry_type: string | null
          message: string
          name: string
          phone: string | null
          property_id: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          inquiry_type?: string | null
          message: string
          name: string
          phone?: string | null
          property_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          inquiry_type?: string | null
          message?: string
          name?: string
          phone?: string | null
          property_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          company_name: string | null
          company_type: string | null
          country: string | null
          created_at: string | null
          documents: Json | null
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          company_name?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string | null
          documents?: Json | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          company_name?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string | null
          documents?: Json | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_stats: {
        Row: {
          last_active: string | null
          seller_id: string
          total_leads: number | null
          total_listings: number | null
        }
        Insert: {
          last_active?: string | null
          seller_id: string
          total_leads?: number | null
          total_listings?: number | null
        }
        Update: {
          last_active?: string | null
          seller_id?: string
          total_leads?: number | null
          total_listings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_stats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string | null
          description: string
          features: Json | null
          id: string
          is_custom: boolean | null
          name: string
          price_monthly: number
        }
        Insert: {
          created_at?: string | null
          description: string
          features?: Json | null
          id?: string
          is_custom?: boolean | null
          name: string
          price_monthly: number
        }
        Update: {
          created_at?: string | null
          description?: string
          features?: Json | null
          id?: string
          is_custom?: boolean | null
          name?: string
          price_monthly?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          country: string
          created_at: string | null
          currency: string | null
          description: string
          distance_to_beach_m: number | null
          distance_to_city: number | null
          distance_to_lake: number | null
          distance_to_sea: number | null
           english_description: string | null
           english_title: string | null
           finnish_description: string | null
           finnish_title: string | null
           danish_description: string | null
           danish_title: string | null
           norwegian_description: string | null
           norwegian_title: string | null
           swedish_description: string | null
           swedish_title: string | null
           croatian_description: string | null
           croatian_title: string | null
           german_description: string | null
           german_title: string | null
           french_description: string | null
           french_title: string | null
           spanish_description: string | null
           spanish_title: string | null
           italian_description: string | null
           italian_title: string | null
          features: string[] | null
          id: string
          images: string[] | null
          lat: number | null
          listing_type: string | null
          lon: number | null
          package_id: string | null
          plot_area: number | null
          price: number
          price_history: Json | null
          property_type: string | null
          property_type_detail: string | null
          region: string | null
          rejection_reason: string | null
          seller_id: string
          seller_type: string
          status: string
          title: string
          updated_at: string | null
          verified: boolean | null
          videos: string[] | null
          views: number | null
        }
        Insert: {
          address?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          country: string
          created_at?: string | null
          currency?: string | null
          description: string
          distance_to_beach_m?: number | null
          distance_to_city?: number | null
          distance_to_lake?: number | null
          distance_to_sea?: number | null
          english_description?: string | null
          english_title?: string | null
          finnish_description?: string | null
          finnish_title?: string | null
          danish_description?: string | null
          danish_title?: string | null
          norwegian_description?: string | null
          norwegian_title?: string | null
          swedish_description?: string | null
          swedish_title?: string | null
          croatian_description?: string | null
          croatian_title?: string | null
          german_description?: string | null
          german_title?: string | null
          french_description?: string | null
          french_title?: string | null
          spanish_description?: string | null
          spanish_title?: string | null
          italian_description?: string | null
          italian_title?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          lat?: number | null
          listing_type?: string | null
          lon?: number | null
          package_id?: string | null
          plot_area?: number | null
          price: number
          price_history?: Json | null
          property_type?: string | null
          property_type_detail?: string | null
          region?: string | null
          rejection_reason?: string | null
          seller_id: string
          seller_type?: string
          status?: string
          title: string
          updated_at?: string | null
          verified?: boolean | null
          videos?: string[] | null
          views?: number | null
        }
        Update: {
          address?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          country?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          distance_to_beach_m?: number | null
          distance_to_city?: number | null
          distance_to_lake?: number | null
          distance_to_sea?: number | null
          english_description?: string | null
          english_title?: string | null
          finnish_description?: string | null
          finnish_title?: string | null
          danish_description?: string | null
          danish_title?: string | null
          norwegian_description?: string | null
          norwegian_title?: string | null
          swedish_description?: string | null
          swedish_title?: string | null
          croatian_description?: string | null
          croatian_title?: string | null
          german_description?: string | null
          german_title?: string | null
          french_description?: string | null
          french_title?: string | null
          spanish_description?: string | null
          spanish_title?: string | null
          italian_description?: string | null
          italian_title?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          lat?: number | null
          listing_type?: string | null
          lon?: number | null
          package_id?: string | null
          plot_area?: number | null
          price?: number
          price_history?: Json | null
          property_type?: string | null
          property_type_detail?: string | null
          region?: string | null
          rejection_reason?: string | null
          seller_id?: string
          seller_type?: string
          status?: string
          title?: string
          updated_at?: string | null
          verified?: boolean | null
          videos?: string[] | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          selected_features: Json | null
          status: string | null
          total_additional_cost: number | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          selected_features?: Json | null
          status?: string | null
          total_additional_cost?: number | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          selected_features?: Json | null
          status?: string | null
          total_additional_cost?: number | null
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
    Enums: {},
  },
} as const
