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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          created_at: string
          id: string
          items: Json
          last_activity_at: string
          recovered: boolean | null
          recovered_at: string | null
          recovery_email_sent: boolean | null
          recovery_email_sent_at: string | null
          total: number | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          last_activity_at?: string
          recovered?: boolean | null
          recovered_at?: string | null
          recovery_email_sent?: boolean | null
          recovery_email_sent_at?: string | null
          total?: number | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          last_activity_at?: string
          recovered?: boolean | null
          recovered_at?: string | null
          recovery_email_sent?: boolean | null
          recovery_email_sent_at?: string | null
          total?: number | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          address: string
          city: string
          county: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          label: string | null
          phone: string
          postal_code: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          county: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone: string
          postal_code?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          county?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone?: string
          postal_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          ip_address: string | null
          landing_url: string | null
          referrer_url: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_url?: string | null
          referrer_url?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_url?: string | null
          referrer_url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          id: string
          order_id: string | null
          order_total: number
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          order_total?: number
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          order_total?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_materials: {
        Row: {
          created_at: string
          description: string | null
          file_type: string | null
          file_url: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      affiliate_payout_requests: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          payment_method: string
          processed_at: string | null
          reference_number: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          payment_method?: string
          processed_at?: string | null
          reference_number?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          processed_at?: string | null
          reference_number?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payout_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          available_balance: number | null
          commission_rate: number
          cookie_duration_days: number | null
          created_at: string
          discount_code: string | null
          discount_percent: number | null
          email: string | null
          full_name: string | null
          id: string
          payment_details: Json | null
          payment_method: string | null
          pending_balance: number | null
          promotion_plan: string | null
          rejection_reason: string | null
          status: string
          tax_id: string | null
          total_clicks: number | null
          total_earnings: number | null
          total_orders: number | null
          total_paid: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          affiliate_code: string
          available_balance?: number | null
          commission_rate?: number
          cookie_duration_days?: number | null
          created_at?: string
          discount_code?: string | null
          discount_percent?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          pending_balance?: number | null
          promotion_plan?: string | null
          rejection_reason?: string | null
          status?: string
          tax_id?: string | null
          total_clicks?: number | null
          total_earnings?: number | null
          total_orders?: number | null
          total_paid?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          affiliate_code?: string
          available_balance?: number | null
          commission_rate?: number
          cookie_duration_days?: number | null
          created_at?: string
          discount_code?: string | null
          discount_percent?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          pending_balance?: number | null
          promotion_plan?: string | null
          rejection_reason?: string | null
          status?: string
          tax_id?: string | null
          total_clicks?: number | null
          total_earnings?: number | null
          total_orders?: number | null
          total_paid?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value_json: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value_json?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value_json?: Json
        }
        Relationships: []
      }
      attribute_values: {
        Row: {
          attribute_id: string
          color_hex: string | null
          display_order: number | null
          id: string
          slug: string
          value: string
        }
        Insert: {
          attribute_id: string
          color_hex?: string | null
          display_order?: number | null
          id?: string
          slug: string
          value: string
        }
        Update: {
          attribute_id?: string
          color_hex?: string | null
          display_order?: number | null
          id?: string
          slug?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          staff_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          staff_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          staff_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          actions_executed: Json | null
          automation_id: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          status: string
          trigger_payload: Json | null
        }
        Insert: {
          actions_executed?: Json | null
          automation_id: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          status?: string
          trigger_payload?: Json | null
        }
        Update: {
          actions_executed?: Json | null
          automation_id?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          status?: string
          trigger_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          run_count: number
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          run_count?: number
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          run_count?: number
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          link_url: string | null
          placement: string
          sort_order: number
          starts_at: string | null
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body_html: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body_html?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body_html?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          banner_image: string | null
          banner_link: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          show_in_nav: boolean
          slug: string
          visible: boolean
        }
        Insert: {
          banner_image?: string | null
          banner_link?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          show_in_nav?: boolean
          slug: string
          visible?: boolean
        }
        Update: {
          banner_image?: string | null
          banner_link?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          show_in_nav?: boolean
          slug?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          body_html: string | null
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          placement: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body_html?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          placement?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body_html?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          placement?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comparison_lists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_lists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_instances: {
        Row: {
          config_json: Json | null
          connector_id: string
          enabled: boolean | null
          error_count: number | null
          id: string
          installed_at: string | null
          installed_by: string | null
          last_error: string | null
          last_sync_at: string | null
          status: string | null
          sync_frequency_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          config_json?: Json | null
          connector_id: string
          enabled?: boolean | null
          error_count?: number | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          status?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          config_json?: Json | null
          connector_id?: string
          enabled?: boolean | null
          error_count?: number | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          status?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connector_instances_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          author: string | null
          category: string
          created_at: string | null
          description: string | null
          documentation_url: string | null
          events_subscribed: string[] | null
          icon_url: string | null
          id: string
          is_official: boolean | null
          is_published: boolean | null
          key: string
          min_platform_version: string | null
          name: string
          permissions: string[] | null
          settings_schema: Json | null
          updated_at: string | null
          version: string | null
          webhooks_provided: string[] | null
        }
        Insert: {
          author?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          events_subscribed?: string[] | null
          icon_url?: string | null
          id?: string
          is_official?: boolean | null
          is_published?: boolean | null
          key: string
          min_platform_version?: string | null
          name: string
          permissions?: string[] | null
          settings_schema?: Json | null
          updated_at?: string | null
          version?: string | null
          webhooks_provided?: string[] | null
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          events_subscribed?: string[] | null
          icon_url?: string | null
          id?: string
          is_official?: boolean | null
          is_published?: boolean | null
          key?: string
          min_platform_version?: string | null
          name?: string
          permissions?: string[] | null
          settings_schema?: Json | null
          updated_at?: string | null
          version?: string | null
          webhooks_provided?: string[] | null
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      courier_configs: {
        Row: {
          config_json: Json | null
          courier: string
          created_at: string | null
          default_pickup_address: Json | null
          display_name: string
          id: string
          is_active: boolean | null
          pricing_rules: Json | null
          updated_at: string | null
        }
        Insert: {
          config_json?: Json | null
          courier: string
          created_at?: string | null
          default_pickup_address?: Json | null
          display_name: string
          id?: string
          is_active?: boolean | null
          pricing_rules?: Json | null
          updated_at?: string | null
        }
        Update: {
          config_json?: Json | null
          courier?: string
          created_at?: string | null
          default_pickup_address?: Json | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          pricing_rules?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_scripts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          location: string
          name: string
          script_type: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string
          name: string
          script_type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string
          name?: string
          script_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_blacklist: {
        Row: {
          blocked_actions: string[] | null
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          phone: string | null
          reason: string
          user_id: string | null
        }
        Insert: {
          blocked_actions?: string[] | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          phone?: string | null
          reason: string
          user_id?: string | null
        }
        Update: {
          blocked_actions?: string[] | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          phone?: string | null
          reason?: string
          user_id?: string | null
        }
        Relationships: []
      }
      customer_group_members: {
        Row: {
          added_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_groups: {
        Row: {
          benefits: Json | null
          color: string | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          is_default: boolean | null
          last_sync_at: string | null
          member_count: number | null
          name: string
          rules: Json | null
          slug: string
          type: string | null
        }
        Insert: {
          benefits?: Json | null
          color?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_default?: boolean | null
          last_sync_at?: string | null
          member_count?: number | null
          name: string
          rules?: Json | null
          slug: string
          type?: string | null
        }
        Update: {
          benefits?: Json | null
          color?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_default?: boolean | null
          last_sync_at?: string | null
          member_count?: number | null
          name?: string
          rules?: Json | null
          slug?: string
          type?: string | null
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          note: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          note: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: []
      }
      dynamic_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          image_url: string | null
          name: string
          rules: Json
          slug: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          rules?: Json
          slug: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rules?: Json
          slug?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          from_email: string | null
          id: string
          metadata: Json | null
          resend_id: string | null
          status: string
          subject: string
          to_email: string
          type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          from_email?: string | null
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          status?: string
          subject: string
          to_email: string
          type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          from_email?: string | null
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          status?: string
          subject?: string
          to_email?: string
          type?: string
        }
        Relationships: []
      }
      erp_field_mappings: {
        Row: {
          created_at: string
          entity_type: string
          erp_field: string
          id: string
          integration_id: string
          store_field: string
          transform: string | null
        }
        Insert: {
          created_at?: string
          entity_type?: string
          erp_field: string
          id?: string
          integration_id: string
          store_field: string
          transform?: string | null
        }
        Update: {
          created_at?: string
          entity_type?: string
          erp_field?: string
          id?: string
          integration_id?: string
          store_field?: string
          transform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_field_mappings_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "erp_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_integrations: {
        Row: {
          api_base_url: string | null
          api_key: string | null
          auth_type: string | null
          created_at: string
          created_by: string | null
          id: string
          last_error: string | null
          last_sync_at: string | null
          name: string
          order_status_mapping: Json | null
          status: string
          stock_conflict_resolution: string | null
          sync_customers: boolean | null
          sync_direction: string | null
          sync_frequency: string | null
          sync_orders: boolean | null
          sync_products: boolean | null
          sync_stock: boolean | null
          template: string | null
          type: string
          updated_at: string
        }
        Insert: {
          api_base_url?: string | null
          api_key?: string | null
          auth_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          name: string
          order_status_mapping?: Json | null
          status?: string
          stock_conflict_resolution?: string | null
          sync_customers?: boolean | null
          sync_direction?: string | null
          sync_frequency?: string | null
          sync_orders?: boolean | null
          sync_products?: boolean | null
          sync_stock?: boolean | null
          template?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          api_base_url?: string | null
          api_key?: string | null
          auth_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          name?: string
          order_status_mapping?: Json | null
          status?: string
          stock_conflict_resolution?: string | null
          sync_customers?: boolean | null
          sync_direction?: string | null
          sync_frequency?: string | null
          sync_orders?: boolean | null
          sync_products?: boolean | null
          sync_stock?: boolean | null
          template?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      erp_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          direction: string
          errors: Json | null
          id: string
          integration_id: string | null
          integration_name: string | null
          records_created: number | null
          records_failed: number | null
          records_total: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          direction?: string
          errors?: Json | null
          id?: string
          integration_id?: string | null
          integration_name?: string | null
          records_created?: number | null
          records_failed?: number | null
          records_total?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          direction?: string
          errors?: Json | null
          id?: string
          integration_id?: string | null
          integration_name?: string | null
          records_created?: number | null
          records_failed?: number | null
          records_total?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "erp_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_webhook_logs: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          event_type: string | null
          id: string
          method: string | null
          request_payload: Json | null
          response_body: string | null
          response_status: number | null
          status: string
          url: string | null
          webhook_id: string | null
        }
        Insert: {
          created_at?: string
          direction?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          method?: string | null
          request_payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          status?: string
          url?: string | null
          webhook_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          method?: string | null
          request_payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          status?: string
          url?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "erp_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_webhooks: {
        Row: {
          created_at: string
          destination_url: string
          event_type: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          secret_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_url: string
          event_type: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          secret_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_url?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          secret_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      group_prices: {
        Row: {
          group_id: string
          id: string
          price: number
          product_id: string
          variant_id: string | null
        }
        Insert: {
          group_id: string
          id?: string
          price: number
          product_id: string
          variant_id?: string | null
        }
        Update: {
          group_id?: string
          id?: string
          price?: number
          product_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_prices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_prices_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      health_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          meta_json: Json | null
          scope: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          meta_json?: Json | null
          scope: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          meta_json?: Json | null
          scope?: string
        }
        Relationships: []
      }
      import_history: {
        Row: {
          created_at: string
          created_count: number
          error_count: number
          errors: Json | null
          file_name: string | null
          id: string
          import_mode: string
          scheduled_import_id: string | null
          skipped_count: number
          source: string
          total_rows: number
          updated_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_count?: number
          error_count?: number
          errors?: Json | null
          file_name?: string | null
          id?: string
          import_mode?: string
          scheduled_import_id?: string | null
          skipped_count?: number
          source?: string
          total_rows?: number
          updated_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_count?: number
          error_count?: number
          errors?: Json | null
          file_name?: string | null
          id?: string
          import_mode?: string
          scheduled_import_id?: string | null
          skipped_count?: number
          source?: string
          total_rows?: number
          updated_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_history_scheduled_import_id_fkey"
            columns: ["scheduled_import_id"]
            isOneToOne: false
            referencedRelation: "scheduled_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          source?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          app_key: string | null
          config_json: Json
          created_at: string
          credentials_ref: string | null
          display_name: string
          enabled: boolean
          id: string
          last_error: string | null
          last_sync_at: string | null
          logs: Json | null
          provider: string
          status: string
          updated_at: string
          version: string | null
          webhooks: Json | null
        }
        Insert: {
          app_key?: string | null
          config_json?: Json
          created_at?: string
          credentials_ref?: string | null
          display_name: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          logs?: Json | null
          provider: string
          status?: string
          updated_at?: string
          version?: string | null
          webhooks?: Json | null
        }
        Update: {
          app_key?: string | null
          config_json?: Json
          created_at?: string
          credentials_ref?: string | null
          display_name?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          logs?: Json | null
          provider?: string
          status?: string
          updated_at?: string
          version?: string | null
          webhooks?: Json | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number | null
          sort_order: number | null
          total: number | null
          unit_price: number
          variant_id: string | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity?: number | null
          sort_order?: number | null
          total?: number | null
          unit_price: number
          variant_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number | null
          sort_order?: number | null
          total?: number | null
          unit_price?: number
          variant_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          buyer_address: string | null
          buyer_cui: string | null
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          due_at: string | null
          efactura_id: string | null
          efactura_status: string | null
          efactura_xml: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          notes: string | null
          order_id: string | null
          pdf_url: string | null
          seller_address: string | null
          seller_bank: string | null
          seller_cui: string | null
          seller_iban: string | null
          seller_name: string | null
          seller_reg_com: string | null
          series: string | null
          shipping_amount: number | null
          status: string | null
          subtotal: number | null
          total: number | null
          type: string | null
          uit_code: string | null
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          buyer_address?: string | null
          buyer_cui?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_at?: string | null
          efactura_id?: string | null
          efactura_status?: string | null
          efactura_xml?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          notes?: string | null
          order_id?: string | null
          pdf_url?: string | null
          seller_address?: string | null
          seller_bank?: string | null
          seller_cui?: string | null
          seller_iban?: string | null
          seller_name?: string | null
          seller_reg_com?: string | null
          series?: string | null
          shipping_amount?: number | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          type?: string | null
          uit_code?: string | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          buyer_address?: string | null
          buyer_cui?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_at?: string | null
          efactura_id?: string | null
          efactura_status?: string | null
          efactura_xml?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          notes?: string | null
          order_id?: string | null
          pdf_url?: string | null
          seller_address?: string | null
          seller_bank?: string | null
          seller_cui?: string | null
          seller_iban?: string | null
          seller_name?: string | null
          seller_reg_com?: string | null
          series?: string | null
          shipping_amount?: number | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          type?: string | null
          uit_code?: string | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_levels: {
        Row: {
          benefits: string[] | null
          color: string | null
          discount_percentage: number | null
          icon: string | null
          id: string
          min_points: number
          name: string
        }
        Insert: {
          benefits?: string[] | null
          color?: string | null
          discount_percentage?: number | null
          icon?: string | null
          id?: string
          min_points?: number
          name: string
        }
        Update: {
          benefits?: string[] | null
          color?: string | null
          discount_percentage?: number | null
          icon?: string | null
          id?: string
          min_points?: number
          name?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          config_json: Json
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          name: string
          updated_at: string
          version: string | null
        }
        Insert: {
          config_json?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          name: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          config_json?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          name?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      mokka_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          order_id: string | null
          request_data: Json | null
          response_data: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          order_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          order_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
        }
        Relationships: []
      }
      mokka_settings: {
        Row: {
          accepted_terms: string[]
          api_url: string
          category_type: string
          checkout_label: string | null
          commission_rate: number | null
          country_type: string
          customer_group_type: string
          demo_mode: boolean
          differentiated_limit: boolean
          enabled_snippet: boolean
          excluded_categories: string[] | null
          excluded_customer_groups: string[] | null
          id: string
          interest_rate: number | null
          ip_whitelist: string[] | null
          ip_whitelist_enabled: boolean
          max_order_value: number | null
          min_order_value: number | null
          order_value_type: string
          secret_key: string | null
          selected_categories: string[] | null
          selected_countries: string[] | null
          selected_customer_groups: string[] | null
          shipping_methods: string[] | null
          shipping_methods_type: string
          show_footer_icon: boolean
          sort_order: number
          store_id: string | null
          updated_at: string
        }
        Insert: {
          accepted_terms?: string[]
          api_url?: string
          category_type?: string
          checkout_label?: string | null
          commission_rate?: number | null
          country_type?: string
          customer_group_type?: string
          demo_mode?: boolean
          differentiated_limit?: boolean
          enabled_snippet?: boolean
          excluded_categories?: string[] | null
          excluded_customer_groups?: string[] | null
          id?: string
          interest_rate?: number | null
          ip_whitelist?: string[] | null
          ip_whitelist_enabled?: boolean
          max_order_value?: number | null
          min_order_value?: number | null
          order_value_type?: string
          secret_key?: string | null
          selected_categories?: string[] | null
          selected_countries?: string[] | null
          selected_customer_groups?: string[] | null
          shipping_methods?: string[] | null
          shipping_methods_type?: string
          show_footer_icon?: boolean
          sort_order?: number
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          accepted_terms?: string[]
          api_url?: string
          category_type?: string
          checkout_label?: string | null
          commission_rate?: number | null
          country_type?: string
          customer_group_type?: string
          demo_mode?: boolean
          differentiated_limit?: boolean
          enabled_snippet?: boolean
          excluded_categories?: string[] | null
          excluded_customer_groups?: string[] | null
          id?: string
          interest_rate?: number | null
          ip_whitelist?: string[] | null
          ip_whitelist_enabled?: boolean
          max_order_value?: number | null
          min_order_value?: number | null
          order_value_type?: string
          secret_key?: string | null
          selected_categories?: string[] | null
          selected_countries?: string[] | null
          selected_customer_groups?: string[] | null
          shipping_methods?: string[] | null
          shipping_methods_type?: string
          show_footer_icon?: boolean
          sort_order?: number
          store_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          content: string
          created_at: string
          id: string
          recipient_count: number | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          name: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string | null
          id: string
          is_active: boolean | null
          key: string
          name: string
          subject_template: string | null
          updated_at: string | null
        }
        Insert: {
          body_template: string
          channel: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name: string
          subject_template?: string | null
          updated_at?: string | null
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name?: string
          subject_template?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          channel: string
          created_at: string | null
          id: string
          metadata: Json | null
          read_at: string | null
          recipient: string
          sent_at: string | null
          status: string | null
          subject: string | null
          template_key: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          channel: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          recipient: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_key?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_key?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          serial_numbers: Json | null
          tax_amount: number | null
          tax_rate: number | null
          variant_id: string | null
          warranty_registered: boolean | null
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity?: number
          serial_numbers?: Json | null
          tax_amount?: number | null
          tax_rate?: number | null
          variant_id?: string | null
          warranty_registered?: boolean | null
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          serial_numbers?: Json | null
          tax_amount?: number | null
          tax_rate?: number | null
          variant_id?: string | null
          warranty_registered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_statuses: {
        Row: {
          allowed_transitions: string[] | null
          color: string
          created_at: string | null
          description: string | null
          email_body: string | null
          email_enabled: boolean | null
          email_subject: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          is_final: boolean | null
          key: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_transitions?: string[] | null
          color?: string
          created_at?: string | null
          description?: string | null
          email_body?: string | null
          email_enabled?: boolean | null
          email_subject?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_final?: boolean | null
          key: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_transitions?: string[] | null
          color?: string
          created_at?: string | null
          description?: string | null
          email_body?: string | null
          email_enabled?: boolean | null
          email_subject?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_final?: boolean | null
          key?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_tag_assignments: {
        Row: {
          created_at: string
          id: string
          order_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tag_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "order_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      order_timeline: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          is_internal: boolean | null
          new_status: string | null
          note: string | null
          old_status: string | null
          order_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          new_status?: string | null
          note?: string | null
          old_status?: string | null
          order_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          new_status?: string | null
          note?: string | null
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          affiliate_id: string | null
          awb_generated_at: string | null
          billing_address: Json | null
          coupon_id: string | null
          courier: string | null
          created_at: string
          discount_amount: number | null
          discount_total: number | null
          fulfillment_warehouse_id: string | null
          id: string
          internal_notes: string | null
          loyalty_points_earned: number | null
          marketplace_data: Json | null
          notes: string | null
          order_number: string | null
          payment_installments: Json | null
          payment_method: string | null
          payment_status: string | null
          review_reminder_sent: boolean | null
          review_request_sent: boolean | null
          review_request_sent_at: string | null
          shipping_address: Json | null
          shipping_status: string | null
          shipping_total: number | null
          smartbill_number: string | null
          smartbill_status: string | null
          smartbill_url: string | null
          source: string | null
          status: string
          subtotal: number | null
          tax_total: number | null
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          affiliate_id?: string | null
          awb_generated_at?: string | null
          billing_address?: Json | null
          coupon_id?: string | null
          courier?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_total?: number | null
          fulfillment_warehouse_id?: string | null
          id?: string
          internal_notes?: string | null
          loyalty_points_earned?: number | null
          marketplace_data?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_installments?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          review_reminder_sent?: boolean | null
          review_request_sent?: boolean | null
          review_request_sent_at?: string | null
          shipping_address?: Json | null
          shipping_status?: string | null
          shipping_total?: number | null
          smartbill_number?: string | null
          smartbill_status?: string | null
          smartbill_url?: string | null
          source?: string | null
          status?: string
          subtotal?: number | null
          tax_total?: number | null
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          affiliate_id?: string | null
          awb_generated_at?: string | null
          billing_address?: Json | null
          coupon_id?: string | null
          courier?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_total?: number | null
          fulfillment_warehouse_id?: string | null
          id?: string
          internal_notes?: string | null
          loyalty_points_earned?: number | null
          marketplace_data?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_installments?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          review_reminder_sent?: boolean | null
          review_request_sent?: boolean | null
          review_request_sent_at?: string | null
          shipping_address?: Json | null
          shipping_status?: string | null
          shipping_total?: number | null
          smartbill_number?: string | null
          smartbill_status?: string | null
          smartbill_url?: string | null
          source?: string | null
          status?: string
          subtotal?: number | null
          tax_total?: number | null
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_fulfillment_warehouse_id_fkey"
            columns: ["fulfillment_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          allowed_counties: string[] | null
          allowed_customer_groups: string[] | null
          bank_details: Json | null
          bnpl_config: Json | null
          config_json: Json | null
          created_at: string | null
          description: string | null
          display_order: number | null
          extra_fee_type: string | null
          extra_fee_value: number | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          key: string
          max_amount: number | null
          min_amount: number | null
          name: string
          payment_deadline_days: number | null
          pickup_location_id: string | null
          provider: string | null
          sandbox_mode: boolean | null
          supports_saved_cards: boolean | null
          type: string
        }
        Insert: {
          allowed_counties?: string[] | null
          allowed_customer_groups?: string[] | null
          bank_details?: Json | null
          bnpl_config?: Json | null
          config_json?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          extra_fee_type?: string | null
          extra_fee_value?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          max_amount?: number | null
          min_amount?: number | null
          name: string
          payment_deadline_days?: number | null
          pickup_location_id?: string | null
          provider?: string | null
          sandbox_mode?: boolean | null
          supports_saved_cards?: boolean | null
          type: string
        }
        Update: {
          allowed_counties?: string[] | null
          allowed_customer_groups?: string[] | null
          bank_details?: Json | null
          bnpl_config?: Json | null
          config_json?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          extra_fee_type?: string | null
          extra_fee_value?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          payment_deadline_days?: number | null
          pickup_location_id?: string | null
          provider?: string | null
          sandbox_mode?: boolean | null
          supports_saved_cards?: boolean | null
          type?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          card_brand: string | null
          card_last_four: string | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          external_id: string | null
          id: string
          installments_count: number | null
          installments_provider: string | null
          order_id: string | null
          payment_method_id: string | null
          provider_response: Json | null
          refunded_amount: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          installments_count?: number | null
          installments_provider?: string | null
          order_id?: string | null
          payment_method_id?: string | null
          provider_response?: Json | null
          refunded_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          installments_count?: number | null
          installments_provider?: string | null
          order_id?: string | null
          payment_method_id?: string | null
          provider_response?: Json | null
          refunded_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          code: string
          created_at: string | null
          customer_groups: Json | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          round_to: number | null
          start_date: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          customer_groups?: Json | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          round_to?: number | null
          start_date?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          customer_groups?: Json | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          round_to?: number | null
          start_date?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      price_rules: {
        Row: {
          applies_to: Json | null
          conditions: Json | null
          created_at: string | null
          discount_type: string | null
          discount_value: number | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          name: string
          starts_at: string | null
          type: string
        }
        Insert: {
          applies_to?: Json | null
          conditions?: Json | null
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          starts_at?: string | null
          type: string
        }
        Update: {
          applies_to?: Json | null
          conditions?: Json | null
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          starts_at?: string | null
          type?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          min_quantity: number | null
          price_list_id: string
          product_id: string | null
          special_offer: Json | null
          updated_at: string | null
          value: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          min_quantity?: number | null
          price_list_id: string
          product_id?: string | null
          special_offer?: Json | null
          updated_at?: string | null
          value: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          min_quantity?: number | null
          price_list_id?: string
          product_id?: string | null
          special_offer?: Json | null
          updated_at?: string | null
          value?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prices_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          allow_stacking: boolean
          applies_to_customers: string
          applies_to_products: string
          badge_text: string | null
          brand_ids: string[] | null
          category_ids: string[] | null
          created_at: string
          customer_group_ids: string[] | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          min_order_value: number | null
          min_quantity: number | null
          name: string
          priority: number
          product_ids: string[] | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          allow_stacking?: boolean
          applies_to_customers?: string
          applies_to_products?: string
          badge_text?: string | null
          brand_ids?: string[] | null
          category_ids?: string[] | null
          created_at?: string
          customer_group_ids?: string[] | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_value?: number | null
          min_quantity?: number | null
          name: string
          priority?: number
          product_ids?: string[] | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          allow_stacking?: boolean
          applies_to_customers?: string
          applies_to_products?: string
          badge_text?: string | null
          brand_ids?: string[] | null
          category_ids?: string[] | null
          created_at?: string
          customer_group_ids?: string[] | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_value?: number | null
          min_quantity?: number | null
          name?: string
          priority?: number
          product_ids?: string[] | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_filterable: boolean | null
          is_visible: boolean | null
          name: string
          slug: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_filterable?: boolean | null
          is_visible?: boolean | null
          name: string
          slug: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_filterable?: boolean | null
          is_visible?: boolean | null
          name?: string
          slug?: string
          type?: string | null
        }
        Relationships: []
      }
      product_bundle_items: {
        Row: {
          bundle_product_id: string
          component_product_id: string
          component_variant_id: string | null
          created_at: string
          id: string
          quantity: number
          sort_order: number
        }
        Insert: {
          bundle_product_id: string
          component_product_id: string
          component_variant_id?: string | null
          created_at?: string
          id?: string
          quantity?: number
          sort_order?: number
        }
        Update: {
          bundle_product_id?: string
          component_product_id?: string
          component_variant_id?: string | null
          created_at?: string
          id?: string
          quantity?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_bundle_items_bundle_product_id_fkey"
            columns: ["bundle_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundle_items_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundle_items_component_variant_id_fkey"
            columns: ["component_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string
          id: string
          product_id: string
          question: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          product_id: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          product_id?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_relations: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          related_product_id: string
          relation_type: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          related_product_id: string
          relation_type?: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          related_product_id?: string
          relation_type?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_relations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relations_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          admin_reply: string | null
          body: string | null
          cons: string | null
          created_at: string
          helpful_count: number | null
          id: string
          photos: string[] | null
          product_id: string
          pros: string | null
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
          user_name: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          admin_reply?: string | null
          body?: string | null
          cons?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          photos?: string[] | null
          product_id: string
          pros?: string | null
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          user_name?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          admin_reply?: string | null
          body?: string | null
          cons?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          photos?: string[] | null
          product_id?: string
          pros?: string | null
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          barcode: string | null
          created_at: string | null
          dimensions: Json | null
          ean: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          mpn: string | null
          old_price: number | null
          price: number
          product_id: string
          sku: string | null
          stock: number
          updated_at: string | null
          warranty_months: number | null
          weight: number | null
        }
        Insert: {
          attributes?: Json
          barcode?: string | null
          created_at?: string | null
          dimensions?: Json | null
          ean?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          mpn?: string | null
          old_price?: number | null
          price?: number
          product_id: string
          sku?: string | null
          stock?: number
          updated_at?: string | null
          warranty_months?: number | null
          weight?: number | null
        }
        Update: {
          attributes?: Json
          barcode?: string | null
          created_at?: string | null
          dimensions?: Json | null
          ean?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          mpn?: string | null
          old_price?: number | null
          price?: number
          product_id?: string
          sku?: string | null
          stock?: number
          updated_at?: string | null
          warranty_months?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          bundle_discount_percent: number | null
          bundle_pricing_mode: string | null
          canonical_url: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          ean: string | null
          featured: boolean | null
          height_cm: number | null
          id: string
          image_alts: Json | null
          image_url: string | null
          images: string[] | null
          length_cm: number | null
          low_stock_threshold: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          old_price: number | null
          price: number
          product_type: string
          published_at: string | null
          rating: number | null
          review_count: number | null
          search_vector: unknown
          short_description: string | null
          sku: string | null
          slug: string
          smartbill_code: string | null
          smartbill_meas_unit: string | null
          smartbill_vat_rate: number | null
          specs: Json | null
          status: string | null
          stock: number
          subscription_discount_percent: number | null
          tags: string[] | null
          videos: string[] | null
          visible: boolean | null
          warranty_months: number | null
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          bundle_discount_percent?: number | null
          bundle_pricing_mode?: string | null
          canonical_url?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          ean?: string | null
          featured?: boolean | null
          height_cm?: number | null
          id?: string
          image_alts?: Json | null
          image_url?: string | null
          images?: string[] | null
          length_cm?: number | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          old_price?: number | null
          price?: number
          product_type?: string
          published_at?: string | null
          rating?: number | null
          review_count?: number | null
          search_vector?: unknown
          short_description?: string | null
          sku?: string | null
          slug: string
          smartbill_code?: string | null
          smartbill_meas_unit?: string | null
          smartbill_vat_rate?: number | null
          specs?: Json | null
          status?: string | null
          stock?: number
          subscription_discount_percent?: number | null
          tags?: string[] | null
          videos?: string[] | null
          visible?: boolean | null
          warranty_months?: number | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          bundle_discount_percent?: number | null
          bundle_pricing_mode?: string | null
          canonical_url?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          ean?: string | null
          featured?: boolean | null
          height_cm?: number | null
          id?: string
          image_alts?: Json | null
          image_url?: string | null
          images?: string[] | null
          length_cm?: number | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          old_price?: number | null
          price?: number
          product_type?: string
          published_at?: string | null
          rating?: number | null
          review_count?: number | null
          search_vector?: unknown
          short_description?: string | null
          sku?: string | null
          slug?: string
          smartbill_code?: string | null
          smartbill_meas_unit?: string | null
          smartbill_vat_rate?: number | null
          specs?: Json | null
          status?: string | null
          stock?: number
          subscription_discount_percent?: number | null
          tags?: string[] | null
          videos?: string[] | null
          visible?: boolean | null
          warranty_months?: number | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          abc_class: string | null
          avatar_url: string | null
          company: string | null
          created_at: string
          first_name: string | null
          fiscal_attributes: Json | null
          full_name: string | null
          gdpr_consents: Json | null
          id: string
          is_blocked: boolean | null
          last_login_at: string | null
          last_name: string | null
          last_order_at: string | null
          loyalty_tier: string | null
          marketing_preferences: Json | null
          notification_preferences: Json | null
          orders_count: number | null
          phone: string | null
          preferred_currency: string | null
          preferred_language: string | null
          segments: string[] | null
          smartbill_client_id: string | null
          tags: string[] | null
          total_spent: number | null
          updated_at: string
          user_id: string
          vat_number: string | null
        }
        Insert: {
          abc_class?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          first_name?: string | null
          fiscal_attributes?: Json | null
          full_name?: string | null
          gdpr_consents?: Json | null
          id?: string
          is_blocked?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          last_order_at?: string | null
          loyalty_tier?: string | null
          marketing_preferences?: Json | null
          notification_preferences?: Json | null
          orders_count?: number | null
          phone?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          segments?: string[] | null
          smartbill_client_id?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
        }
        Update: {
          abc_class?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          first_name?: string | null
          fiscal_attributes?: Json | null
          full_name?: string | null
          gdpr_consents?: Json | null
          id?: string
          is_blocked?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          last_order_at?: string | null
          loyalty_tier?: string | null
          marketing_preferences?: Json | null
          notification_preferences?: Json | null
          orders_count?: number | null
          phone?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          segments?: string[] | null
          smartbill_client_id?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          badge_text: string | null
          banner_url: string | null
          bundle_products: Json | null
          conditions: Json | null
          created_at: string | null
          discount_type: string | null
          discount_value: number | null
          ends_at: string | null
          gift_product_id: string | null
          id: string
          is_combinable: boolean | null
          max_discount: number | null
          max_uses: number | null
          max_uses_per_user: number | null
          name: string
          priority: number | null
          starts_at: string | null
          status: string | null
          type: string
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          badge_text?: string | null
          banner_url?: string | null
          bundle_products?: Json | null
          conditions?: Json | null
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          gift_product_id?: string | null
          id?: string
          is_combinable?: boolean | null
          max_discount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          name: string
          priority?: number | null
          starts_at?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          badge_text?: string | null
          banner_url?: string | null
          bundle_products?: Json | null
          conditions?: Json | null
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          gift_product_id?: string | null
          id?: string
          is_combinable?: boolean | null
          max_discount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          name?: string
          priority?: number | null
          starts_at?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_gift_product_id_fkey"
            columns: ["gift_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          id: string
          product_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      restock_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          notified: boolean | null
          notified_at: string | null
          product_id: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified?: boolean | null
          notified_at?: string | null
          product_id: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified?: boolean | null
          notified_at?: string | null
          product_id?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_notifications_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      return_request_items: {
        Row: {
          created_at: string
          exchange_product_id: string | null
          exchange_variant_id: string | null
          id: string
          order_item_id: string | null
          product_id: string | null
          product_name: string
          quantity: number
          return_request_id: string
        }
        Insert: {
          created_at?: string
          exchange_product_id?: string | null
          exchange_variant_id?: string | null
          id?: string
          order_item_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          return_request_id: string
        }
        Update: {
          created_at?: string
          exchange_product_id?: string | null
          exchange_variant_id?: string | null
          id?: string
          order_item_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          return_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_request_items_exchange_product_id_fkey"
            columns: ["exchange_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_request_items_return_request_id_fkey"
            columns: ["return_request_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_id: string | null
          details: string | null
          id: string
          images: Json | null
          items: Json
          order_id: string
          photos: string[] | null
          reason: string
          refund_amount: number | null
          resolution: string | null
          rma_number: string | null
          status: string
          tracking_number: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          details?: string | null
          id?: string
          images?: Json | null
          items?: Json
          order_id: string
          photos?: string[] | null
          reason: string
          refund_amount?: number | null
          resolution?: string | null
          rma_number?: string | null
          status?: string
          tracking_number?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          details?: string | null
          id?: string
          images?: Json | null
          items?: Json
          order_id?: string
          photos?: string[] | null
          reason?: string
          refund_amount?: number | null
          resolution?: string | null
          rma_number?: string | null
          status?: string
          tracking_number?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_export: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string | null
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      scheduled_imports: {
        Row: {
          created_at: string
          feed_url: string
          id: string
          interval_minutes: number
          is_active: boolean
          last_result: Json | null
          last_run_at: string | null
          name: string
          price_margin: number | null
          price_mode: string
          price_multiplier: number | null
          stock_only_sync: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          feed_url: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          last_result?: Json | null
          last_run_at?: string | null
          name: string
          price_margin?: number | null
          price_mode?: string
          price_multiplier?: number | null
          stock_only_sync?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          feed_url?: string
          id?: string
          interval_minutes?: number
          is_active?: boolean
          last_result?: Json | null
          last_run_at?: string | null
          name?: string
          price_margin?: number | null
          price_mode?: string
          price_multiplier?: number | null
          stock_only_sync?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          location: string | null
          raw_data: Json | null
          shipment_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          raw_data?: Json | null
          shipment_id: string
          status: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          raw_data?: Json | null
          shipment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          awb_number: string | null
          carrier: string
          carrier_response: Json | null
          cod_amount: number | null
          created_at: string | null
          delivered_at: string | null
          estimated_delivery: string | null
          id: string
          label_url: string | null
          order_id: string
          packages: Json | null
          shipping_cost: number | null
          status: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          awb_number?: string | null
          carrier: string
          carrier_response?: Json | null
          cod_amount?: number | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          order_id: string
          packages?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          awb_number?: string | null
          carrier?: string
          carrier_response?: Json | null
          cod_amount?: number | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          order_id?: string
          packages?: Json | null
          shipping_cost?: number | null
          status?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      smartbill_sync_log: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          order_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          smartbill_number: string | null
          smartbill_url: string | null
          status: string
        }
        Insert: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          smartbill_number?: string | null
          smartbill_url?: string | null
          status?: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          smartbill_number?: string | null
          smartbill_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "smartbill_sync_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_metadata: {
        Row: {
          created_at: string | null
          id: string
          ip_whitelist: string[] | null
          last_login_at: string | null
          last_login_ip: string | null
          two_fa_enabled: boolean | null
          two_fa_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          last_login_at?: string | null
          last_login_ip?: string | null
          two_fa_enabled?: boolean | null
          two_fa_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          last_login_at?: string | null
          last_login_ip?: string | null
          two_fa_enabled?: boolean | null
          two_fa_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          resolved_at: string | null
          threshold: number
          triggered_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          resolved_at?: string | null
          threshold: number
          triggered_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          resolved_at?: string | null
          threshold?: number
          triggered_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_change_log: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_value: number
          notes: string | null
          old_value: number
          product_id: string
          reason: string
          sku: string | null
          variant_id: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_value?: number
          notes?: string | null
          old_value?: number
          product_id: string
          reason?: string
          sku?: string | null
          variant_id?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_value?: number
          notes?: string | null
          old_value?: number
          product_id?: string
          reason?: string
          sku?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_change_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_change_log_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          released_at: string | null
          status: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          released_at?: string | null
          status?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          released_at?: string | null
          status?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          created_at: string
          from_warehouse_id: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          sku: string | null
          to_warehouse_id: string
          transferred_by: string | null
        }
        Insert: {
          created_at?: string
          from_warehouse_id: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          sku?: string | null
          to_warehouse_id: string
          transferred_by?: string | null
        }
        Update: {
          created_at?: string
          from_warehouse_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          sku?: string | null
          to_warehouse_id?: string
          transferred_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_orders: {
        Row: {
          created_at: string
          id: string
          order_id: string
          renewal_number: number
          subscription_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          renewal_number?: number
          subscription_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          renewal_number?: number
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_reason: string | null
          created_at: string
          customer_id: string
          delivery_address_id: string | null
          discount_percent: number
          frequency: string
          id: string
          next_renewal_date: string
          payment_method_saved: string | null
          product_id: string
          quantity: number
          status: string
          total_renewals: number
          total_revenue: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          cancel_reason?: string | null
          created_at?: string
          customer_id: string
          delivery_address_id?: string | null
          discount_percent?: number
          frequency?: string
          id?: string
          next_renewal_date?: string
          payment_method_saved?: string | null
          product_id: string
          quantity?: number
          status?: string
          total_renewals?: number
          total_revenue?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          cancel_reason?: string | null
          created_at?: string
          customer_id?: string
          delivery_address_id?: string | null
          discount_percent?: number
          frequency?: string
          id?: string
          next_renewal_date?: string
          payment_method_saved?: string | null
          product_id?: string
          quantity?: number
          status?: string
          total_renewals?: number
          total_revenue?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          body: string
          created_at: string
          customer_email: string
          customer_name: string | null
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          created_at?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          action: string
          completed_at: string | null
          connector_instance_id: string
          duration_ms: number | null
          error_details: Json | null
          id: string
          items_created: number | null
          items_failed: number | null
          items_processed: number | null
          items_skipped: number | null
          items_updated: number | null
          request_data: Json | null
          response_data: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          action: string
          completed_at?: string | null
          connector_instance_id: string
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          items_created?: number | null
          items_failed?: number | null
          items_processed?: number | null
          items_skipped?: number | null
          items_updated?: number | null
          request_data?: Json | null
          response_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          action?: string
          completed_at?: string | null
          connector_instance_id?: string
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          items_created?: number | null
          items_failed?: number | null
          items_processed?: number | null
          items_skipped?: number | null
          items_updated?: number | null
          request_data?: Json | null
          response_data?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_connector_instance_id_fkey"
            columns: ["connector_instance_id"]
            isOneToOne: false
            referencedRelation: "connector_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          courier: string | null
          created_at: string | null
          description: string | null
          event_at: string | null
          id: string
          location: string | null
          order_id: string
          status: string
        }
        Insert: {
          courier?: string | null
          created_at?: string | null
          description?: string | null
          event_at?: string | null
          id?: string
          location?: string | null
          order_id: string
          status: string
        }
        Update: {
          courier?: string | null
          created_at?: string | null
          description?: string | null
          event_at?: string | null
          id?: string
          location?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      warehouse_stock: {
        Row: {
          batch: string | null
          expiry_date: string | null
          id: string
          location_in_warehouse: string | null
          max_quantity: number | null
          min_quantity: number
          product_id: string
          quantity: number
          reserved_quantity: number | null
          serial_numbers: Json | null
          updated_at: string
          variant_id: string | null
          warehouse_id: string
        }
        Insert: {
          batch?: string | null
          expiry_date?: string | null
          id?: string
          location_in_warehouse?: string | null
          max_quantity?: number | null
          min_quantity?: number
          product_id: string
          quantity?: number
          reserved_quantity?: number | null
          serial_numbers?: Json | null
          updated_at?: string
          variant_id?: string | null
          warehouse_id: string
        }
        Update: {
          batch?: string | null
          expiry_date?: string | null
          id?: string
          location_in_warehouse?: string | null
          max_quantity?: number | null
          min_quantity?: number
          product_id?: string
          quantity?: number
          reserved_quantity?: number | null
          serial_numbers?: Json | null
          updated_at?: string
          variant_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webhook_queue: {
        Row: {
          attempts: number | null
          connector_instance_id: string | null
          created_at: string | null
          dead_letter: boolean
          direction: string
          error_message: string | null
          headers: Json | null
          id: string
          idempotency_key: string | null
          last_error: string | null
          max_attempts: number | null
          max_retries: number
          method: string | null
          next_retry_at: string | null
          payload: Json | null
          processed_at: string | null
          response_body: string | null
          response_status: number | null
          retry_count: number
          status: string | null
          url: string | null
        }
        Insert: {
          attempts?: number | null
          connector_instance_id?: string | null
          created_at?: string | null
          dead_letter?: boolean
          direction: string
          error_message?: string | null
          headers?: Json | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          max_attempts?: number | null
          max_retries?: number
          method?: string | null
          next_retry_at?: string | null
          payload?: Json | null
          processed_at?: string | null
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          status?: string | null
          url?: string | null
        }
        Update: {
          attempts?: number | null
          connector_instance_id?: string | null
          created_at?: string | null
          dead_letter?: boolean
          direction?: string
          error_message?: string | null
          headers?: Json | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          max_attempts?: number | null
          max_retries?: number
          method?: string | null
          next_retry_at?: string | null
          payload?: Json | null
          processed_at?: string | null
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          status?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_queue_connector_instance_id_fkey"
            columns: ["connector_instance_id"]
            isOneToOne: false
            referencedRelation: "connector_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_dynamic_category_products: {
        Args: { p_rules: Json }
        Returns: number
      }
      get_dynamic_category_products: {
        Args: {
          category_id: string
          result_limit?: number
          result_offset?: number
        }
        Returns: {
          product_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_products: {
        Args: { result_limit?: number; search_term: string }
        Returns: {
          brand: string
          category_name: string
          id: string
          image_url: string
          name: string
          price: number
          rank: number
          slug: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "orders_manager"
        | "products_manager"
        | "marketing"
        | "support"
        | "finance"
        | "viewer"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "orders_manager",
        "products_manager",
        "marketing",
        "support",
        "finance",
        "viewer",
      ],
    },
  },
} as const
