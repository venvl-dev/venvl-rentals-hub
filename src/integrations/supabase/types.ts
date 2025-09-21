export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          parent_message_id: string | null
          priority: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      amenities: {
        Row: {
          category: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          approval_history: Json | null
          created_at: string | null
          current_step: number | null
          entity_id: string
          entity_type: string
          id: string
          request_data: Json
          requested_by: string
          status: string | null
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          approval_history?: Json | null
          created_at?: string | null
          current_step?: number | null
          entity_id: string
          entity_type: string
          id?: string
          request_data: Json
          requested_by: string
          status?: string | null
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          approval_history?: Json | null
          created_at?: string | null
          current_step?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          request_data?: Json
          requested_by?: string
          status?: string | null
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          workflow_name: string
          workflow_steps: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          workflow_name: string
          workflow_steps: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          workflow_name?: string
          workflow_steps?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      booking_notifications: {
        Row: {
          booking_id: string | null
          created_at: string | null
          email_sent: boolean | null
          id: string
          notification_type: string
          recipient_id: string
          sent_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          notification_type: string
          recipient_id: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          notification_type?: string
          recipient_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_reference: string | null
          booking_type: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in: string
          check_out: string
          confirmation_sent_at: string | null
          created_at: string | null
          currency: string | null
          duration_months: number | null
          flexible_option: string | null
          guest_id: string
          guests: number
          id: string
          payment_amount: number | null
          payment_status: string | null
          property_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
          stripe_session_id: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          booking_reference?: string | null
          booking_type?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in: string
          check_out: string
          confirmation_sent_at?: string | null
          created_at?: string | null
          currency?: string | null
          duration_months?: number | null
          flexible_option?: string | null
          guest_id: string
          guests?: number
          id?: string
          payment_amount?: number | null
          payment_status?: string | null
          property_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_session_id?: string | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          booking_reference?: string | null
          booking_type?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in?: string
          check_out?: string
          confirmation_sent_at?: string | null
          created_at?: string | null
          currency?: string | null
          duration_months?: number | null
          flexible_option?: string | null
          guest_id?: string
          guests?: number
          id?: string
          payment_amount?: number | null
          payment_status?: string | null
          property_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_session_id?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      dynamic_forms: {
        Row: {
          conditional_logic: Json | null
          created_at: string | null
          created_by: string | null
          form_name: string
          form_schema: Json
          form_type: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          validation_rules: Json | null
          version: number | null
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string | null
          created_by?: string | null
          form_name: string
          form_schema: Json
          form_type: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string | null
          created_by?: string | null
          form_name?: string
          form_schema?: Json
          form_type?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      managed_locations: {
        Row: {
          average_price: number | null
          boundaries: Json | null
          center_lat: number | null
          center_lng: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          parent_location_id: string | null
          properties_count: number | null
          type: string
          updated_at: string | null
          zoom_level: number | null
        }
        Insert: {
          average_price?: number | null
          boundaries?: Json | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          parent_location_id?: string | null
          properties_count?: number | null
          type: string
          updated_at?: string | null
          zoom_level?: number | null
        }
        Update: {
          average_price?: number | null
          boundaries?: Json | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          parent_location_id?: string | null
          properties_count?: number | null
          type?: string
          updated_at?: string | null
          zoom_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "managed_locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "managed_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_reports: {
        Row: {
          created_at: string | null
          description: string
          evidence_urls: string[] | null
          id: string
          moderator_id: string | null
          moderator_notes: string | null
          priority: string | null
          report_type: string
          reported_property_id: string | null
          reported_user_id: string | null
          reporter_id: string | null
          resolution: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          evidence_urls?: string[] | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          priority?: string | null
          report_type: string
          reported_property_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          evidence_urls?: string[] | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          priority?: string | null
          report_type?: string
          reported_property_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_reports_reported_property_id_fkey"
            columns: ["reported_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean | null
          min_booking_amount: number | null
          name: string
          start_date: string
          target_criteria: Json | null
          target_type: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          is_active?: boolean | null
          min_booking_amount?: number | null
          name: string
          start_date: string
          target_criteria?: Json | null
          target_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          min_booking_amount?: number | null
          name?: string
          start_date?: string
          target_criteria?: Json | null
          target_type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          approval_status: string | null
          bathrooms: number | null
          bedrooms: number | null
          blocked_dates: string[] | null
          booking_types: string[] | null
          city: string
          country: string
          created_at: string | null
          daily_price: number | null
          description: string | null
          host_id: string
          id: string
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          max_guests: number
          min_months: number | null
          min_nights: number | null
          monthly_price: number | null
          postal_code: string | null
          price_per_night: number
          property_type: Database["public"]["Enums"]["property_type"]
          rental_type: string | null
          state: string | null
          title: string
          updated_at: string | null
          videos: string[] | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          approval_status?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          blocked_dates?: string[] | null
          booking_types?: string[] | null
          city: string
          country?: string
          created_at?: string | null
          daily_price?: number | null
          description?: string | null
          host_id: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          min_months?: number | null
          min_nights?: number | null
          monthly_price?: number | null
          postal_code?: string | null
          price_per_night: number
          property_type: Database["public"]["Enums"]["property_type"]
          rental_type?: string | null
          state?: string | null
          title: string
          updated_at?: string | null
          videos?: string[] | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          approval_status?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          blocked_dates?: string[] | null
          booking_types?: string[] | null
          city?: string
          country?: string
          created_at?: string | null
          daily_price?: number | null
          description?: string | null
          host_id?: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          min_months?: number | null
          min_nights?: number | null
          monthly_price?: number | null
          postal_code?: string | null
          price_per_night?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          rental_type?: string | null
          state?: string | null
          title?: string
          updated_at?: string | null
          videos?: string[] | null
        }
        Relationships: []
      }
      property_amenities: {
        Row: {
          amenity_id: string
          id: string
          property_id: string
        }
        Insert: {
          amenity_id: string
          id?: string
          property_id: string
        }
        Update: {
          amenity_id?: string
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_availability: {
        Row: {
          blocked_date: string
          created_at: string | null
          id: string
          property_id: string | null
          reason: string | null
          updated_at: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          reason?: string | null
          updated_at?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          property_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          property_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          property_id?: string
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
      property_types: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempt_count: number | null
          created_at: string | null
          id: string
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      real_time_notifications: {
        Row: {
          channel: string | null
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          is_sent: boolean | null
          message: string
          notification_type: string
          priority: string | null
          title: string
          user_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          message: string
          notification_type: string
          priority?: string | null
          title: string
          user_id: string
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          message?: string
          notification_type?: string
          priority?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      revenue_reports: {
        Row: {
          breakdown_by_city: Json | null
          breakdown_by_host: Json | null
          breakdown_by_property_type: Json | null
          commission_earned: number | null
          date_from: string
          date_to: string
          generated_at: string | null
          generated_by: string | null
          id: string
          report_type: string
          total_bookings: number | null
          total_revenue: number | null
          unique_guests: number | null
          unique_hosts: number | null
        }
        Insert: {
          breakdown_by_city?: Json | null
          breakdown_by_host?: Json | null
          breakdown_by_property_type?: Json | null
          commission_earned?: number | null
          date_from: string
          date_to: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_type: string
          total_bookings?: number | null
          total_revenue?: number | null
          unique_guests?: number | null
          unique_hosts?: number | null
        }
        Update: {
          breakdown_by_city?: Json | null
          breakdown_by_host?: Json | null
          breakdown_by_property_type?: Json | null
          commission_earned?: number | null
          date_from?: string
          date_to?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_type?: string
          total_bookings?: number | null
          total_revenue?: number | null
          unique_guests?: number | null
          unique_hosts?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string | null
          guest_id: string
          id: string
          property_id: string
          rating: number
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string | null
          guest_id: string
          id?: string
          property_id: string
          rating: number
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          guest_id?: string
          id?: string
          property_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_permissions: {
        Row: {
          created_at: string
          id: string
          permission_name: string
          permission_value: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_name: string
          permission_value?: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_name?: string
          permission_value?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      search_preferences: {
        Row: {
          created_at: string | null
          destination: string | null
          id: string
          search_data: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          destination?: string | null
          id?: string
          search_data?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          destination?: string | null
          id?: string
          search_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_key: string
          permission_value: boolean | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_key: string
          permission_value?: boolean | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_key?: string
          permission_value?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_cancel_booking: {
        Args: { booking_id: string }
        Returns: boolean
      }
      check_booking_conflicts: {
        Args: {
          p_property_id: string
          p_check_in: string
          p_check_out: string
          p_exclude_booking_id?: string
        }
        Returns: boolean
      }
      create_test_scenario: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string; key_name?: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { data: string; key_name?: string }
        Returns: string
      }
      generate_booking_reference: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_price_range: {
        Args: { booking_type_param?: string; price_column?: string }
        Returns: {
          min_price: number
          max_price: number
        }[]
      }
      initialize_default_setup: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_resource_type?: string
          p_resource_id?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_resource_type?: string
          p_resource_id?: string
          p_success?: boolean
          p_error_message?: string
        }
        Returns: undefined
      }
      seed_sample_bookings_and_reviews: {
        Args: { guest_user_id: string }
        Returns: undefined
      }
      seed_sample_notifications: {
        Args: { user_id: string; user_role?: string }
        Returns: undefined
      }
      seed_sample_properties_for_host: {
        Args: { host_user_id: string }
        Returns: undefined
      }
      toggle_user_status: {
        Args: { target_user_id: string; disable_user: boolean }
        Returns: boolean
      }
      update_user_role: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      user_has_permission: {
        Args: { user_id: string; permission: string }
        Returns: boolean
      }
      validate_input: {
        Args: { input_text: string; max_length?: number }
        Returns: string
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed" | "checked_in"
      property_type:
        | "apartment"
        | "house"
        | "villa"
        | "studio"
        | "cabin"
        | "loft"
      user_role: "guest" | "host" | "admin" | "super_admin"
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
      booking_status: ["pending", "confirmed", "cancelled", "completed", "checked_in"],
      property_type: ["apartment", "house", "villa", "studio", "cabin", "loft"],
      user_role: ["guest", "host", "admin", "super_admin"],
    },
  },
} as const
