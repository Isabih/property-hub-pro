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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      apartments: {
        Row: {
          bedrooms: number | null
          code: string
          created_at: string
          floor: number | null
          id: string
          name: string | null
          notes: string | null
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bedrooms?: number | null
          code: string
          created_at?: string
          floor?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bedrooms?: number | null
          code?: string
          created_at?: string
          floor?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          brand_color: string
          category_images: Json
          contact_ceo: Json | null
          contact_info: Json | null
          contact_team: Json | null
          from_email: string
          hero_slides: Json
          hero_story_video_url: string
          hero_video_bg_url: string | null
          id: boolean
          portfolio_videos: Json
          reply_to: string | null
          sender_name: string
          signature: string
          site_url: string
          sr_confirm_body: string
          sr_confirm_subject: string
          sr_normal_label: string
          sr_reply_subject: string
          sr_urgent_label: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_color?: string
          category_images?: Json
          contact_ceo?: Json | null
          contact_info?: Json | null
          contact_team?: Json | null
          from_email?: string
          hero_slides?: Json
          hero_story_video_url?: string
          hero_video_bg_url?: string | null
          id?: boolean
          portfolio_videos?: Json
          reply_to?: string | null
          sender_name?: string
          signature?: string
          site_url?: string
          sr_confirm_body?: string
          sr_confirm_subject?: string
          sr_normal_label?: string
          sr_reply_subject?: string
          sr_urgent_label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_color?: string
          category_images?: Json
          contact_ceo?: Json | null
          contact_info?: Json | null
          contact_team?: Json | null
          from_email?: string
          hero_slides?: Json
          hero_story_video_url?: string
          hero_video_bg_url?: string | null
          id?: boolean
          portfolio_videos?: Json
          reply_to?: string | null
          sender_name?: string
          signature?: string
          site_url?: string
          sr_confirm_body?: string
          sr_confirm_subject?: string
          sr_normal_label?: string
          sr_reply_subject?: string
          sr_urgent_label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          agent_id: string | null
          amount_paid: number | null
          apartment_no: string | null
          created_at: string
          created_by: string | null
          email: string
          email_verified: boolean
          full_name: string
          id: string
          otp_attempts: number
          otp_expires_at: string | null
          otp_hash: string | null
          payment_method: string | null
          payment_status: string
          phone: string
          property_id: string | null
          stay_end: string | null
          stay_start: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          amount_paid?: number | null
          apartment_no?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          email_verified?: boolean
          full_name: string
          id?: string
          otp_attempts?: number
          otp_expires_at?: string | null
          otp_hash?: string | null
          payment_method?: string | null
          payment_status?: string
          phone: string
          property_id?: string | null
          stay_end?: string | null
          stay_start?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          amount_paid?: number | null
          apartment_no?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          email_verified?: boolean
          full_name?: string
          id?: string
          otp_attempts?: number
          otp_expires_at?: string | null
          otp_hash?: string | null
          payment_method?: string | null
          payment_status?: string
          phone?: string
          property_id?: string | null
          stay_end?: string | null
          stay_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          kind: string
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose?: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
      luxury_access_requests: {
        Row: {
          access_token: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          email_verified: boolean
          expires_at: string | null
          full_name: string
          id: string
          otp_attempts: number
          otp_expires_at: string | null
          otp_hash: string | null
          phone: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          expires_at?: string | null
          full_name: string
          id?: string
          otp_attempts?: number
          otp_expires_at?: string | null
          otp_hash?: string | null
          phone?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          expires_at?: string | null
          full_name?: string
          id?: string
          otp_attempts?: number
          otp_expires_at?: string | null
          otp_hash?: string | null
          phone?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          email_verified: boolean
          id: string
          otp_attempts: number
          otp_expires_at: string | null
          otp_hash: string | null
          status: string
          temp_password_expires_at: string | null
          temp_password_hash: string | null
          updated_at: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          id?: string
          otp_attempts?: number
          otp_expires_at?: string | null
          otp_hash?: string | null
          status?: string
          temp_password_expires_at?: string | null
          temp_password_hash?: string | null
          updated_at?: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          id?: string
          otp_attempts?: number
          otp_expires_at?: string | null
          otp_hash?: string | null
          status?: string
          temp_password_expires_at?: string | null
          temp_password_hash?: string | null
          updated_at?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pending_staff: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          otp_attempts: number
          otp_expires_at: string
          otp_hash: string
          password: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          otp_attempts?: number
          otp_expires_at: string
          otp_hash: string
          password: string
          phone?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          otp_attempts?: number
          otp_expires_at?: string
          otp_hash?: string
          password?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          agent_id: string | null
          amenities: string[] | null
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          blueprint_url: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          description: string | null
          district: string | null
          featured: boolean
          id: string
          is_luxury: boolean
          lat: number | null
          listing_type: string
          lng: number | null
          notify_subscribers: boolean
          owner_id: string
          price: number
          property_type: string
          slug: string
          status: string
          title: string
          tour_3d_url: string | null
          unit_code_prefix: string | null
          unit_count: number
          updated_at: string
          video_url: string | null
          views_count: number
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          amenities?: string[] | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          blueprint_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          district?: string | null
          featured?: boolean
          id?: string
          is_luxury?: boolean
          lat?: number | null
          listing_type?: string
          lng?: number | null
          notify_subscribers?: boolean
          owner_id: string
          price?: number
          property_type?: string
          slug: string
          status?: string
          title: string
          tour_3d_url?: string | null
          unit_code_prefix?: string | null
          unit_count?: number
          updated_at?: string
          video_url?: string | null
          views_count?: number
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          amenities?: string[] | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          blueprint_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          district?: string | null
          featured?: boolean
          id?: string
          is_luxury?: boolean
          lat?: number | null
          listing_type?: string
          lng?: number | null
          notify_subscribers?: boolean
          owner_id?: string
          price?: number
          property_type?: string
          slug?: string
          status?: string
          title?: string
          tour_3d_url?: string | null
          unit_code_prefix?: string | null
          unit_count?: number
          updated_at?: string
          video_url?: string | null
          views_count?: number
        }
        Relationships: []
      }
      property_images: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean
          position: number
          property_id: string
          provider: string
          section: string
          storage_path: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean
          position?: number
          property_id: string
          provider?: string
          section?: string
          storage_path?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean
          position?: number
          property_id?: string
          provider?: string
          section?: string
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_inquiries: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string | null
          phone: string | null
          property_id: string
          scheduled_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          property_id: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          property_id?: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_of_the_day: {
        Row: {
          id: number
          property_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          property_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          property_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_of_the_day_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          id: string
          property_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          admin_response: string | null
          assigned_to: string | null
          category: Database["public"]["Enums"]["service_request_category"]
          created_at: string
          customer_id: string
          description: string
          id: string
          image_urls: string[]
          priority: Database["public"]["Enums"]["service_request_priority"]
          responded_at: string | null
          responded_by: string | null
          status: Database["public"]["Enums"]["service_request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["service_request_category"]
          created_at?: string
          customer_id: string
          description: string
          id?: string
          image_urls?: string[]
          priority?: Database["public"]["Enums"]["service_request_priority"]
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["service_request_category"]
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          image_urls?: string[]
          priority?: Database["public"]["Enums"]["service_request_priority"]
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          property_id: string | null
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          property_id?: string | null
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          property_id?: string | null
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          notify: boolean
          otp_attempts: number
          otp_expires_at: string | null
          otp_hash: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          notify?: boolean
          otp_attempts?: number
          otp_expires_at?: string | null
          otp_hash?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          notify?: boolean
          otp_attempts?: number
          otp_expires_at?: string | null
          otp_hash?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "agent" | "owner" | "admin" | "it" | "receptionist"
      service_request_category:
        | "maintenance"
        | "plumbing"
        | "electrical"
        | "cleaning"
        | "security"
        | "general"
        | "other"
      service_request_priority: "low" | "medium" | "high" | "urgent"
      service_request_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
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
      app_role: ["buyer", "agent", "owner", "admin", "it", "receptionist"],
      service_request_category: [
        "maintenance",
        "plumbing",
        "electrical",
        "cleaning",
        "security",
        "general",
        "other",
      ],
      service_request_priority: ["low", "medium", "high", "urgent"],
      service_request_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
