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
          email_1_sent_at: string | null
          email_2_sent_at: string | null
          email_3_sent_at: string | null
          id: string
          items: Json
          last_activity_at: string
          lost: boolean
          recovered: boolean | null
          recovered_at: string | null
          recovered_order_id: string | null
          recovery_coupon_code: string | null
          recovery_email_sent: boolean | null
          recovery_email_sent_at: string | null
          recovery_token: string | null
          recovery_token_expires_at: string | null
          status: string
          total: number | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          email_3_sent_at?: string | null
          id?: string
          items?: Json
          last_activity_at?: string
          lost?: boolean
          recovered?: boolean | null
          recovered_at?: string | null
          recovered_order_id?: string | null
          recovery_coupon_code?: string | null
          recovery_email_sent?: boolean | null
          recovery_email_sent_at?: string | null
          recovery_token?: string | null
          recovery_token_expires_at?: string | null
          status?: string
          total?: number | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          email_3_sent_at?: string | null
          id?: string
          items?: Json
          last_activity_at?: string
          lost?: boolean
          recovered?: boolean | null
          recovered_at?: string | null
          recovered_order_id?: string | null
          recovery_coupon_code?: string | null
          recovery_email_sent?: boolean | null
          recovery_email_sent_at?: string | null
          recovery_token?: string | null
          recovery_token_expires_at?: string | null
          status?: string
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
      ai_bulk_jobs: {
        Row: {
          completed: number
          created_at: string
          error_log: Json | null
          failed: number
          finished_at: string | null
          generation_targets: Json
          id: string
          job_type: string
          started_at: string | null
          started_by: string
          status: string
          target_ids: Json
          total_products: number
        }
        Insert: {
          completed?: number
          created_at?: string
          error_log?: Json | null
          failed?: number
          finished_at?: string | null
          generation_targets?: Json
          id?: string
          job_type?: string
          started_at?: string | null
          started_by: string
          status?: string
          target_ids?: Json
          total_products?: number
        }
        Update: {
          completed?: number
          created_at?: string
          error_log?: Json | null
          failed?: number
          finished_at?: string | null
          generation_targets?: Json
          id?: string
          job_type?: string
          started_at?: string | null
          started_by?: string
          status?: string
          target_ids?: Json
          total_products?: number
        }
        Relationships: []
      }
      ai_generator_log: {
        Row: {
          action_type: string
          admin_user_id: string
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          created_at: string
          generated_content: string
          id: string
          original_content: string | null
          product_id: string | null
          status: string
          uniqueness_score: number | null
        }
        Insert: {
          action_type?: string
          admin_user_id: string
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          generated_content?: string
          id?: string
          original_content?: string | null
          product_id?: string | null
          status?: string
          uniqueness_score?: number | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          generated_content?: string
          id?: string
          original_content?: string | null
          product_id?: string | null
          status?: string
          uniqueness_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generator_log_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generator_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generator_settings: {
        Row: {
          content_length: string
          content_length_max: number | null
          content_length_min: number | null
          created_at: string
          enabled: boolean
          format_bullets: boolean
          format_diacritics: boolean
          format_emojis: boolean
          format_html: boolean
          format_plain_text: boolean
          id: string
          language: string
          manual_approval: boolean
          tone: string
          updated_at: string
        }
        Insert: {
          content_length?: string
          content_length_max?: number | null
          content_length_min?: number | null
          created_at?: string
          enabled?: boolean
          format_bullets?: boolean
          format_diacritics?: boolean
          format_emojis?: boolean
          format_html?: boolean
          format_plain_text?: boolean
          id?: string
          language?: string
          manual_approval?: boolean
          tone?: string
          updated_at?: string
        }
        Update: {
          content_length?: string
          content_length_max?: number | null
          content_length_min?: number | null
          created_at?: string
          enabled?: boolean
          format_bullets?: boolean
          format_diacritics?: boolean
          format_emojis?: boolean
          format_html?: boolean
          format_plain_text?: boolean
          id?: string
          language?: string
          manual_approval?: boolean
          tone?: string
          updated_at?: string
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
      back_in_stock_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "back_in_stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_holder: string
          bank_name: string
          branch: string | null
          created_at: string
          currency: string
          display_order: number
          iban: string
          id: string
          is_default: boolean
          settings_id: string
          show_on_documents: boolean
          swift_bic: string | null
          updated_at: string
        }
        Insert: {
          account_holder?: string
          bank_name?: string
          branch?: string | null
          created_at?: string
          currency?: string
          display_order?: number
          iban?: string
          id?: string
          is_default?: boolean
          settings_id: string
          show_on_documents?: boolean
          swift_bic?: string | null
          updated_at?: string
        }
        Update: {
          account_holder?: string
          bank_name?: string
          branch?: string | null
          created_at?: string
          currency?: string
          display_order?: number
          iban?: string
          id?: string
          is_default?: boolean
          settings_id?: string
          show_on_documents?: boolean
          swift_bic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_settings_id_fkey"
            columns: ["settings_id"]
            isOneToOne: false
            referencedRelation: "bank_transfer_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transfer_payments: {
        Row: {
          amount_expected: number
          amount_received: number
          bank_transaction_ref: string | null
          confirmed_by_admin_id: string | null
          created_at: string
          id: string
          internal_note: string | null
          order_id: string
          payment_deadline: string
          payment_reference: string
          payment_status: string
          received_at: string | null
          updated_at: string
        }
        Insert: {
          amount_expected?: number
          amount_received?: number
          bank_transaction_ref?: string | null
          confirmed_by_admin_id?: string | null
          created_at?: string
          id?: string
          internal_note?: string | null
          order_id: string
          payment_deadline: string
          payment_reference?: string
          payment_status?: string
          received_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_expected?: number
          amount_received?: number
          bank_transaction_ref?: string | null
          confirmed_by_admin_id?: string | null
          created_at?: string
          id?: string
          internal_note?: string | null
          order_id?: string
          payment_deadline?: string
          payment_reference?: string
          payment_status?: string
          received_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfer_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transfer_settings: {
        Row: {
          allowed_delivery_method_ids: Json | null
          allowed_ips: string | null
          auto_cancel_expired: boolean
          business_days_only: boolean
          checkout_display_name: string
          company_name: string
          condition_categories: Json | null
          condition_countries: Json | null
          condition_customer_groups: Json | null
          cui: string
          customer_message: string | null
          delivery_restriction: string
          enabled: boolean
          id: string
          limit_by_customer_type: boolean
          limit_individual_max: number | null
          limit_individual_min: number | null
          limit_legal_max: number | null
          limit_legal_min: number | null
          max_order_value: number | null
          min_order_value: number | null
          payment_term_unit: string
          payment_term_value: number
          updated_at: string
        }
        Insert: {
          allowed_delivery_method_ids?: Json | null
          allowed_ips?: string | null
          auto_cancel_expired?: boolean
          business_days_only?: boolean
          checkout_display_name?: string
          company_name?: string
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          cui?: string
          customer_message?: string | null
          delivery_restriction?: string
          enabled?: boolean
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_max?: number | null
          limit_individual_min?: number | null
          limit_legal_max?: number | null
          limit_legal_min?: number | null
          max_order_value?: number | null
          min_order_value?: number | null
          payment_term_unit?: string
          payment_term_value?: number
          updated_at?: string
        }
        Update: {
          allowed_delivery_method_ids?: Json | null
          allowed_ips?: string | null
          auto_cancel_expired?: boolean
          business_days_only?: boolean
          checkout_display_name?: string
          company_name?: string
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          cui?: string
          customer_message?: string | null
          delivery_restriction?: string
          enabled?: boolean
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_max?: number | null
          limit_individual_min?: number | null
          limit_legal_max?: number | null
          limit_legal_min?: number | null
          max_order_value?: number | null
          min_order_value?: number | null
          payment_term_unit?: string
          payment_term_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          badge_text: string | null
          bg_color: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          link_url: string | null
          placement: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          active?: boolean
          badge_text?: string | null
          bg_color?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          active?: boolean
          badge_text?: string | null
          bg_color?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
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
      bundle_components: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          sort_order: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_components_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundle_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_products: {
        Row: {
          availability_rule: string
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          meta_description: string | null
          meta_title: string | null
          name: string
          order_display_mode: string
          original_total_value: number | null
          price_type: string
          price_value: number
          short_description: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          availability_rule?: string
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_display_mode?: string
          original_total_value?: number | null
          price_type?: string
          price_value?: number
          short_description?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          availability_rule?: string
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_display_mode?: string
          original_total_value?: number | null
          price_type?: string
          price_value?: number
          short_description?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_settings: {
        Row: {
          default_availability_rule: string
          default_order_display_mode: string
          enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          default_availability_rule?: string
          default_order_display_mode?: string
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          default_availability_rule?: string
          default_order_display_mode?: string
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      burn_logs: {
        Row: {
          burn_date: string
          created_at: string
          duration_minutes: number
          id: string
          mood: string | null
          notes: string | null
          product_id: string | null
          product_name: string
          rating: number | null
          user_id: string
        }
        Insert: {
          burn_date?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          mood?: string | null
          notes?: string | null
          product_id?: string | null
          product_name?: string
          rating?: number | null
          user_id: string
        }
        Update: {
          burn_date?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          mood?: string | null
          notes?: string | null
          product_id?: string | null
          product_name?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "burn_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      candle_subscription_plans: {
        Row: {
          active: boolean
          candles_per_month: number
          color_choice: boolean
          created_at: string
          description: string | null
          extra_discount_pct: number
          features: Json | null
          id: string
          name: string
          price_ron: number
          scent_choice: boolean
        }
        Insert: {
          active?: boolean
          candles_per_month?: number
          color_choice?: boolean
          created_at?: string
          description?: string | null
          extra_discount_pct?: number
          features?: Json | null
          id?: string
          name: string
          price_ron: number
          scent_choice?: boolean
        }
        Update: {
          active?: boolean
          candles_per_month?: number
          color_choice?: boolean
          created_at?: string
          description?: string | null
          extra_discount_pct?: number
          features?: Json | null
          id?: string
          name?: string
          price_ron?: number
          scent_choice?: boolean
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
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chatbot_actions_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          order_id: string | null
          result: string
          session_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          order_id?: string | null
          result?: string
          session_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          order_id?: string | null
          result?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_actions_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chatbot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversations: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean
          messages: Json
          satisfaction_rating: number | null
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          messages?: Json
          satisfaction_rating?: number | null
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          messages?: Json
          satisfaction_rating?: number | null
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chatbot_faq: {
        Row: {
          active: boolean
          answer: string
          category: string
          created_at: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          category?: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          category?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chatbot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_sessions: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_id: string | null
          ended_at: string | null
          escalated_to_ticket_id: string | null
          id: string
          messages_count: number
          orders_actioned: Json | null
          satisfaction_rating: number | null
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          ended_at?: string | null
          escalated_to_ticket_id?: string | null
          id?: string
          messages_count?: number
          orders_actioned?: Json | null
          satisfaction_rating?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          ended_at?: string | null
          escalated_to_ticket_id?: string | null
          id?: string
          messages_count?: number
          orders_actioned?: Json | null
          satisfaction_rating?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      chatbot_settings: {
        Row: {
          assistant_name: string
          auto_escalate_after_messages: number
          avatar_url: string | null
          enabled: boolean
          escalate_keywords: string
          escalate_on_negative_sentiment: boolean
          features_enabled: Json
          id: string
          offline_message: string
          schedule_hours: Json
          schedule_type: string
          updated_at: string
          welcome_message: string
          widget_color: string
        }
        Insert: {
          assistant_name?: string
          auto_escalate_after_messages?: number
          avatar_url?: string | null
          enabled?: boolean
          escalate_keywords?: string
          escalate_on_negative_sentiment?: boolean
          features_enabled?: Json
          id?: string
          offline_message?: string
          schedule_hours?: Json
          schedule_type?: string
          updated_at?: string
          welcome_message?: string
          widget_color?: string
        }
        Update: {
          assistant_name?: string
          auto_escalate_after_messages?: number
          avatar_url?: string | null
          enabled?: boolean
          escalate_keywords?: string
          escalate_on_negative_sentiment?: boolean
          features_enabled?: Json
          id?: string
          offline_message?: string
          schedule_hours?: Json
          schedule_type?: string
          updated_at?: string
          welcome_message?: string
          widget_color?: string
        }
        Relationships: []
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
      complaints: {
        Row: {
          admin_notes: string | null
          channel: string
          complaint_date: string
          created_at: string
          customer_email: string | null
          customer_name: string
          description: string
          id: string
          order_id: string | null
          order_number: string | null
          resolution: string | null
          response_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          channel?: string
          complaint_date?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          description?: string
          id?: string
          order_id?: string | null
          order_number?: string | null
          resolution?: string | null
          response_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          channel?: string
          complaint_date?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          description?: string
          id?: string
          order_id?: string | null
          order_number?: string | null
          resolution?: string | null
          response_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      corporate_gift_requests: {
        Row: {
          admin_notes: string | null
          budget_range: string | null
          company_name: string
          contact_person: string
          created_at: string
          desired_delivery_date: string | null
          email: string
          id: string
          message: string | null
          personalization_details: string | null
          phone: string
          status: string
          units_needed: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          budget_range?: string | null
          company_name: string
          contact_person: string
          created_at?: string
          desired_delivery_date?: string | null
          email: string
          id?: string
          message?: string | null
          personalization_details?: string | null
          phone: string
          status?: string
          units_needed?: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          budget_range?: string | null
          company_name?: string
          contact_person?: string
          created_at?: string
          desired_delivery_date?: string | null
          email?: string
          id?: string
          message?: string | null
          personalization_details?: string | null
          phone?: string
          status?: string
          units_needed?: number
          updated_at?: string
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
          applies_to: string
          category_ids: string[] | null
          code: string
          combine_with_codes: boolean
          combine_with_promotions: boolean
          created_at: string
          customer_group_ids: string[] | null
          customer_scope: string
          description: string | null
          discount_type: string
          discount_value: number
          first_order_only: boolean
          id: string
          includes_free_shipping: boolean
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          max_uses_per_customer: number | null
          min_order_value: number | null
          min_quantity: number | null
          parent_code_id: string | null
          product_ids: string[] | null
          revenue_generated: number
          specific_customer_id: string | null
          total_discount_given: number
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to?: string
          category_ids?: string[] | null
          code: string
          combine_with_codes?: boolean
          combine_with_promotions?: boolean
          created_at?: string
          customer_group_ids?: string[] | null
          customer_scope?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          first_order_only?: boolean
          id?: string
          includes_free_shipping?: boolean
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_order_value?: number | null
          min_quantity?: number | null
          parent_code_id?: string | null
          product_ids?: string[] | null
          revenue_generated?: number
          specific_customer_id?: string | null
          total_discount_given?: number
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to?: string
          category_ids?: string[] | null
          code?: string
          combine_with_codes?: boolean
          combine_with_promotions?: boolean
          created_at?: string
          customer_group_ids?: string[] | null
          customer_scope?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_order_only?: boolean
          id?: string
          includes_free_shipping?: boolean
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_customer?: number | null
          min_order_value?: number | null
          min_quantity?: number | null
          parent_code_id?: string | null
          product_ids?: string[] | null
          revenue_generated?: number
          specific_customer_id?: string | null
          total_discount_given?: number
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_parent_code_id_fkey"
            columns: ["parent_code_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
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
      custom_404_log: {
        Row: {
          accessed_at: string
          id: string
          ip_hash: string | null
          referrer: string | null
          url_accessed: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          url_accessed: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          url_accessed?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      custom_404_settings: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          buttons: Json
          categories_title: string
          category_ids: Json | null
          enabled: boolean
          id: string
          image_alignment: string
          image_max_width: string
          image_url: string | null
          meta_title: string
          recommended_count: number
          recommended_product_ids: Json | null
          recommended_section_title: string
          recommended_show_add_to_cart: boolean
          recommended_show_price: boolean
          recommended_source: string
          search_placeholder: string
          show_categories: boolean
          show_recommended_products: boolean
          show_search: boolean
          subtitle_color: string
          subtitle_font_size: number
          subtitle_text: string
          title_bold: boolean
          title_color: string
          title_font_size: number
          title_text: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          buttons?: Json
          categories_title?: string
          category_ids?: Json | null
          enabled?: boolean
          id?: string
          image_alignment?: string
          image_max_width?: string
          image_url?: string | null
          meta_title?: string
          recommended_count?: number
          recommended_product_ids?: Json | null
          recommended_section_title?: string
          recommended_show_add_to_cart?: boolean
          recommended_show_price?: boolean
          recommended_source?: string
          search_placeholder?: string
          show_categories?: boolean
          show_recommended_products?: boolean
          show_search?: boolean
          subtitle_color?: string
          subtitle_font_size?: number
          subtitle_text?: string
          title_bold?: boolean
          title_color?: string
          title_font_size?: number
          title_text?: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          buttons?: Json
          categories_title?: string
          category_ids?: Json | null
          enabled?: boolean
          id?: string
          image_alignment?: string
          image_max_width?: string
          image_url?: string | null
          meta_title?: string
          recommended_count?: number
          recommended_product_ids?: Json | null
          recommended_section_title?: string
          recommended_show_add_to_cart?: boolean
          recommended_show_price?: boolean
          recommended_source?: string
          search_placeholder?: string
          show_categories?: boolean
          show_recommended_products?: boolean
          show_search?: boolean
          subtitle_color?: string
          subtitle_font_size?: number
          subtitle_text?: string
          title_bold?: boolean
          title_color?: string
          title_font_size?: number
          title_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_scripts: {
        Row: {
          consent_category: string
          content: string
          created_at: string
          created_by_admin_id: string | null
          external_async: boolean | null
          external_crossorigin: string | null
          external_custom_attributes: Json | null
          external_defer: boolean | null
          external_type: string | null
          external_url: string | null
          id: string
          inline_content: string | null
          internal_note: string | null
          internal_reference: string | null
          is_active: boolean | null
          location: string
          name: string
          pages: Json | null
          script_type: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          consent_category?: string
          content?: string
          created_at?: string
          created_by_admin_id?: string | null
          external_async?: boolean | null
          external_crossorigin?: string | null
          external_custom_attributes?: Json | null
          external_defer?: boolean | null
          external_type?: string | null
          external_url?: string | null
          id?: string
          inline_content?: string | null
          internal_note?: string | null
          internal_reference?: string | null
          is_active?: boolean | null
          location?: string
          name: string
          pages?: Json | null
          script_type?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          consent_category?: string
          content?: string
          created_at?: string
          created_by_admin_id?: string | null
          external_async?: boolean | null
          external_crossorigin?: string | null
          external_custom_attributes?: Json | null
          external_defer?: boolean | null
          external_type?: string | null
          external_url?: string | null
          id?: string
          inline_content?: string | null
          internal_note?: string | null
          internal_reference?: string | null
          is_active?: boolean | null
          location?: string
          name?: string
          pages?: Json | null
          script_type?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_scripts_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          changes: Json | null
          created_at: string | null
          id: string
          script_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          script_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          script_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_scripts_audit_log_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "custom_scripts"
            referencedColumns: ["id"]
          },
        ]
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
      customer_wallets: {
        Row: {
          available_balance: number
          created_at: string
          customer_id: string
          id: string
          pending_balance: number
          total_earned: number
          total_used: number
          updated_at: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          customer_id: string
          id?: string
          pending_balance?: number
          total_earned?: number
          total_used?: number
          updated_at?: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          customer_id?: string
          id?: string
          pending_balance?: number
          total_earned?: number
          total_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      customization_field_products: {
        Row: {
          created_at: string
          field_id: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "customization_field_products_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "customization_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_field_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_fields: {
        Row: {
          created_at: string
          display_name: string
          field_type: string
          hint_text: string | null
          id: string
          internal_name: string
          is_required: boolean
          location: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          field_type?: string
          hint_text?: string | null
          id?: string
          internal_name: string
          is_required?: boolean
          location?: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          field_type?: string
          hint_text?: string | null
          id?: string
          internal_name?: string
          is_required?: boolean
          location?: string
          settings?: Json
          updated_at?: string
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
      exit_intent_usage: {
        Row: {
          coupon_code: string
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          coupon_code: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_code?: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_intent_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      external_webhooks: {
        Row: {
          created_at: string | null
          custom_headers: Json | null
          enabled: boolean | null
          event_type: string
          id: string
          include_payload: boolean | null
          last_status: number | null
          last_triggered_at: string | null
          name: string
          secret_key: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          custom_headers?: Json | null
          enabled?: boolean | null
          event_type: string
          id?: string
          include_payload?: boolean | null
          last_status?: number | null
          last_triggered_at?: string | null
          name: string
          secret_key?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          custom_headers?: Json | null
          enabled?: boolean | null
          event_type?: string
          id?: string
          include_payload?: boolean | null
          last_status?: number | null
          last_triggered_at?: string | null
          name?: string
          secret_key?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      extra_services: {
        Row: {
          applies_to: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          applies_to?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          applies_to?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
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
      gdpr_consents: {
        Row: {
          analytics: boolean
          created_at: string | null
          id: string
          ip_hash: string | null
          marketing: boolean
          necessary: boolean
          session_id: string
          updated_at: string | null
          user_agent_hash: string | null
          user_id: string | null
        }
        Insert: {
          analytics?: boolean
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          marketing?: boolean
          necessary?: boolean
          session_id: string
          updated_at?: string | null
          user_agent_hash?: string | null
          user_id?: string | null
        }
        Update: {
          analytics?: boolean
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          marketing?: boolean
          necessary?: boolean
          session_id?: string
          updated_at?: string | null
          user_agent_hash?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gift_card_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          gift_card_id: string
          id: string
          order_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          gift_card_id: string
          id?: string
          order_id?: string | null
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          gift_card_id?: string
          id?: string
          order_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          code: string
          created_at: string
          currency: string
          current_balance: number
          expires_at: string | null
          id: string
          initial_balance: number
          message: string | null
          purchaser_user_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          current_balance?: number
          expires_at?: string | null
          id?: string
          initial_balance?: number
          message?: string | null
          purchaser_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          current_balance?: number
          expires_at?: string | null
          id?: string
          initial_balance?: number
          message?: string | null
          purchaser_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Relationships: []
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
      instagram_feed_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          link_url: string | null
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          link_url?: string | null
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          link_url?: string | null
          sort_order?: number | null
        }
        Relationships: []
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
      landing_pages: {
        Row: {
          content: string | null
          conversions: number | null
          created_at: string
          hero_image: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          published: boolean | null
          slug: string
          updated_at: string
          visits: number | null
        }
        Insert: {
          content?: string | null
          conversions?: number | null
          created_at?: string
          hero_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          published?: boolean | null
          slug: string
          updated_at?: string
          visits?: number | null
        }
        Update: {
          content?: string | null
          conversions?: number | null
          created_at?: string
          hero_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          published?: boolean | null
          slug?: string
          updated_at?: string
          visits?: number | null
        }
        Relationships: []
      }
      legal_consents: {
        Row: {
          accepted: boolean
          consent_type: string
          consent_version: string | null
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          order_id: string | null
          user_agent_hash: string | null
          user_id: string | null
        }
        Insert: {
          accepted?: boolean
          consent_type: string
          consent_version?: string | null
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          order_id?: string | null
          user_agent_hash?: string | null
          user_id?: string | null
        }
        Update: {
          accepted?: boolean
          consent_type?: string
          consent_version?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          order_id?: string | null
          user_agent_hash?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_consents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string | null
          id: string
          ip_address: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email?: string | null
          id?: string
          ip_address: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string | null
          id?: string
          ip_address?: string
          success?: boolean
        }
        Relationships: []
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
      netopia_settings: {
        Row: {
          allowed_delivery_method_ids: Json | null
          allowed_ips: string | null
          checkout_display_name: string
          condition_categories: Json | null
          condition_countries: Json | null
          condition_customer_groups: Json | null
          currency: string
          delivery_restriction: string
          demo_mode: boolean
          enabled: boolean
          id: string
          limit_by_customer_type: boolean
          limit_individual_max: number | null
          limit_individual_min: number | null
          limit_legal_max: number | null
          limit_legal_min: number | null
          max_order_value: number | null
          merchant_key_filename: string | null
          merchant_key_path: string | null
          merchant_key_uploaded_at: string | null
          merchant_signature: string
          min_order_value: number | null
          netopia_cert_filename: string | null
          netopia_cert_path: string | null
          netopia_cert_uploaded_at: string | null
          show_footer_icon: boolean
          updated_at: string
        }
        Insert: {
          allowed_delivery_method_ids?: Json | null
          allowed_ips?: string | null
          checkout_display_name?: string
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          currency?: string
          delivery_restriction?: string
          demo_mode?: boolean
          enabled?: boolean
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_max?: number | null
          limit_individual_min?: number | null
          limit_legal_max?: number | null
          limit_legal_min?: number | null
          max_order_value?: number | null
          merchant_key_filename?: string | null
          merchant_key_path?: string | null
          merchant_key_uploaded_at?: string | null
          merchant_signature?: string
          min_order_value?: number | null
          netopia_cert_filename?: string | null
          netopia_cert_path?: string | null
          netopia_cert_uploaded_at?: string | null
          show_footer_icon?: boolean
          updated_at?: string
        }
        Update: {
          allowed_delivery_method_ids?: Json | null
          allowed_ips?: string | null
          checkout_display_name?: string
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          currency?: string
          delivery_restriction?: string
          demo_mode?: boolean
          enabled?: boolean
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_max?: number | null
          limit_individual_min?: number | null
          limit_legal_max?: number | null
          limit_legal_min?: number | null
          max_order_value?: number | null
          merchant_key_filename?: string | null
          merchant_key_path?: string | null
          merchant_key_uploaded_at?: string | null
          merchant_signature?: string
          min_order_value?: number | null
          netopia_cert_filename?: string | null
          netopia_cert_path?: string | null
          netopia_cert_uploaded_at?: string | null
          show_footer_icon?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      netopia_transactions: {
        Row: {
          action: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          ipn_raw_xml: string | null
          ipn_received_at: string | null
          netopia_order_id: string
          netopia_purchase_id: string | null
          order_id: string
          original_amount: number | null
          pan_masked: string | null
          payment_instrument_id: string | null
          processed_amount: number | null
          status: string
          token_expiration_date: string | null
          token_id: string | null
          updated_at: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ipn_raw_xml?: string | null
          ipn_received_at?: string | null
          netopia_order_id?: string
          netopia_purchase_id?: string | null
          order_id: string
          original_amount?: number | null
          pan_masked?: string | null
          payment_instrument_id?: string | null
          processed_amount?: number | null
          status?: string
          token_expiration_date?: string | null
          token_id?: string | null
          updated_at?: string
        }
        Update: {
          action?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ipn_raw_xml?: string | null
          ipn_received_at?: string | null
          netopia_order_id?: string
          netopia_purchase_id?: string | null
          order_id?: string
          original_amount?: number | null
          pan_masked?: string | null
          payment_instrument_id?: string | null
          processed_amount?: number | null
          status?: string
          token_expiration_date?: string | null
          token_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "netopia_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          blocks: Json | null
          bounce_count: number | null
          click_count: number | null
          content: string
          created_at: string
          id: string
          open_count: number | null
          preview_text: string | null
          recipient_count: number | null
          scheduled_at: string | null
          sender_email: string | null
          sender_name: string | null
          sent_at: string | null
          status: string
          subject: string
          target_groups: string[] | null
          target_segment: string | null
          unsubscribe_count: number | null
          updated_at: string | null
        }
        Insert: {
          blocks?: Json | null
          bounce_count?: number | null
          click_count?: number | null
          content: string
          created_at?: string
          id?: string
          open_count?: number | null
          preview_text?: string | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          target_groups?: string[] | null
          target_segment?: string | null
          unsubscribe_count?: number | null
          updated_at?: string | null
        }
        Update: {
          blocks?: Json | null
          bounce_count?: number | null
          click_count?: number | null
          content?: string
          created_at?: string
          id?: string
          open_count?: number | null
          preview_text?: string | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          target_groups?: string[] | null
          target_segment?: string | null
          unsubscribe_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_groups: {
        Row: {
          auto_sync_customer_group_id: string | null
          created_at: string | null
          description: string | null
          id: string
          member_count: number | null
          name: string
        }
        Insert: {
          auto_sync_customer_group_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          name: string
        }
        Update: {
          auto_sync_customer_group_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_groups_auto_sync_customer_group_id_fkey"
            columns: ["auto_sync_customer_group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmation_token: string | null
          confirmed: boolean | null
          consent_at: string | null
          consent_ip: string | null
          email: string
          groups: string[] | null
          id: string
          is_active: boolean
          name: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          confirmation_token?: string | null
          confirmed?: boolean | null
          consent_at?: string | null
          consent_ip?: string | null
          email: string
          groups?: string[] | null
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          confirmation_token?: string | null
          confirmed?: boolean | null
          consent_at?: string | null
          consent_ip?: string | null
          email?: string
          groups?: string[] | null
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_id?: string | null
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
      order_customization_values: {
        Row: {
          created_at: string
          field_id: string | null
          id: string
          order_id: string | null
          order_item_id: string | null
          product_id: string | null
          value_boolean: boolean | null
          value_files: Json | null
          value_list_option: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          field_id?: string | null
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          product_id?: string | null
          value_boolean?: boolean | null
          value_files?: Json | null
          value_list_option?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          field_id?: string | null
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          product_id?: string | null
          value_boolean?: boolean | null
          value_files?: Json | null
          value_list_option?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_customization_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "customization_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_customization_values_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_customization_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          care_guide_sent_at: string | null
          coupon_id: string | null
          courier: string | null
          courier_name: string | null
          created_at: string
          currency: string | null
          delivered_at: string | null
          discount_amount: number | null
          discount_total: number | null
          fraud_flags: Json | null
          fraud_status: string | null
          fulfillment_warehouse_id: string | null
          gift_message: string | null
          gift_wrap: boolean | null
          gift_wrapping: Json | null
          id: string
          internal_notes: string | null
          loyalty_points_earned: number | null
          marketplace_data: Json | null
          notes: string | null
          order_number: string | null
          payment_fee: number | null
          payment_installments: Json | null
          payment_method: string | null
          payment_status: string | null
          review_reminder_sent: boolean | null
          review_request_sent: boolean | null
          review_request_sent_at: string | null
          shipped_at: string | null
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
          tracking_email_sent_at: string | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_email: string | null
          user_id: string
          utm_data: Json | null
        }
        Insert: {
          affiliate_id?: string | null
          awb_generated_at?: string | null
          billing_address?: Json | null
          care_guide_sent_at?: string | null
          coupon_id?: string | null
          courier?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          discount_total?: number | null
          fraud_flags?: Json | null
          fraud_status?: string | null
          fulfillment_warehouse_id?: string | null
          gift_message?: string | null
          gift_wrap?: boolean | null
          gift_wrapping?: Json | null
          id?: string
          internal_notes?: string | null
          loyalty_points_earned?: number | null
          marketplace_data?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_fee?: number | null
          payment_installments?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          review_reminder_sent?: boolean | null
          review_request_sent?: boolean | null
          review_request_sent_at?: string | null
          shipped_at?: string | null
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
          tracking_email_sent_at?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_email?: string | null
          user_id: string
          utm_data?: Json | null
        }
        Update: {
          affiliate_id?: string | null
          awb_generated_at?: string | null
          billing_address?: Json | null
          care_guide_sent_at?: string | null
          coupon_id?: string | null
          courier?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          discount_total?: number | null
          fraud_flags?: Json | null
          fraud_status?: string | null
          fulfillment_warehouse_id?: string | null
          gift_message?: string | null
          gift_wrap?: boolean | null
          gift_wrapping?: Json | null
          id?: string
          internal_notes?: string | null
          loyalty_points_earned?: number | null
          marketplace_data?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_fee?: number | null
          payment_installments?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          review_reminder_sent?: boolean | null
          review_request_sent?: boolean | null
          review_request_sent_at?: string | null
          shipped_at?: string | null
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
          tracking_email_sent_at?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string
          utm_data?: Json | null
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
          reconciled: boolean | null
          reconciled_at: string | null
          reconciled_by: string | null
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
          reconciled?: boolean | null
          reconciled_at?: string | null
          reconciled_by?: string | null
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
          reconciled?: boolean | null
          reconciled_at?: string | null
          reconciled_by?: string | null
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
          {
            foreignKeyName: "payment_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "safe_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      paypo_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          environment: string
          expires_at: string
          id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          environment?: string
          expires_at: string
          id?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          environment?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      paypo_refunds: {
        Row: {
          amount_bani: number
          created_at: string
          id: string
          order_id: string | null
          paypo_transaction_id: string
          reference_refund_id: string | null
          return_id: string | null
          status: string
        }
        Insert: {
          amount_bani?: number
          created_at?: string
          id?: string
          order_id?: string | null
          paypo_transaction_id: string
          reference_refund_id?: string | null
          return_id?: string | null
          status?: string
        }
        Update: {
          amount_bani?: number
          created_at?: string
          id?: string
          order_id?: string | null
          paypo_transaction_id?: string
          reference_refund_id?: string | null
          return_id?: string | null
          status?: string
        }
        Relationships: []
      }
      paypo_settings: {
        Row: {
          allowed_delivery_ids: Json | null
          allowed_ips: string | null
          checkout_display_name: string
          client_id: string | null
          condition_categories: Json | null
          condition_countries: Json | null
          condition_customer_groups: Json | null
          currency: string
          delivery_restriction: string
          demo_mode: boolean
          enabled: boolean
          id: string
          limit_by_customer_type: boolean
          limit_individual_pct: number | null
          limit_legal_pct: number | null
          max_order_value: number
          min_order_value: number
          show_footer_icon: boolean
          show_snippet: boolean
          updated_at: string
        }
        Insert: {
          allowed_delivery_ids?: Json | null
          allowed_ips?: string | null
          checkout_display_name?: string
          client_id?: string | null
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          currency?: string
          delivery_restriction?: string
          demo_mode?: boolean
          enabled?: boolean
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_pct?: number | null
          limit_legal_pct?: number | null
          max_order_value?: number
          min_order_value?: number
          show_footer_icon?: boolean
          show_snippet?: boolean
          updated_at?: string
        }
        Update: {
          allowed_delivery_ids?: Json | null
          allowed_ips?: string | null
          checkout_display_name?: string
          client_id?: string | null
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          currency?: string
          delivery_restriction?: string
          demo_mode?: boolean
          enabled?: boolean
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_pct?: number | null
          limit_legal_pct?: number | null
          max_order_value?: number
          min_order_value?: number
          show_footer_icon?: boolean
          show_snippet?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      paypo_transactions: {
        Row: {
          amount_bani: number
          created_at: string
          hmac_verified: boolean
          id: string
          last_notification_at: string | null
          order_id: string | null
          paypo_reference_id: string | null
          paypo_transaction_id: string | null
          redirect_url: string | null
          settlement_status: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_bani?: number
          created_at?: string
          hmac_verified?: boolean
          id?: string
          last_notification_at?: string | null
          order_id?: string | null
          paypo_reference_id?: string | null
          paypo_transaction_id?: string | null
          redirect_url?: string | null
          settlement_status?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_bani?: number
          created_at?: string
          hmac_verified?: boolean
          id?: string
          last_notification_at?: string | null
          order_id?: string | null
          paypo_reference_id?: string | null
          paypo_transaction_id?: string | null
          redirect_url?: string | null
          settlement_status?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          created_at: string
          id: string
          notified: boolean | null
          notified_at: string | null
          original_price: number
          product_id: string
          target_price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified?: boolean | null
          notified_at?: string | null
          original_price: number
          product_id: string
          target_price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notified?: boolean | null
          notified_at?: string | null
          original_price?: number
          product_id?: string
          target_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_groups: {
        Row: {
          created_at: string
          customer_group_id: string
          id: string
          price_list_id: string
        }
        Insert: {
          created_at?: string
          customer_group_id: string
          id?: string
          price_list_id: string
        }
        Update: {
          created_at?: string
          customer_group_id?: string
          id?: string
          price_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_list_groups_customer_group_id_fkey"
            columns: ["customer_group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_groups_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          created_at: string
          id: string
          preferential_price: number
          price_list_id: string
          product_id: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferential_price?: number
          price_list_id: string
          product_id: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          preferential_price?: number
          price_list_id?: string
          product_id?: string
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      product_360_frames: {
        Row: {
          created_at: string
          file_size: number
          frame_number: number
          height: number | null
          id: string
          original_filename: string | null
          product_id: string
          public_url: string
          slider_id: string
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          file_size?: number
          frame_number?: number
          height?: number | null
          id?: string
          original_filename?: string | null
          product_id: string
          public_url: string
          slider_id: string
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          file_size?: number
          frame_number?: number
          height?: number | null
          id?: string
          original_filename?: string | null
          product_id?: string
          public_url?: string
          slider_id?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_360_frames_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_360_frames_slider_id_fkey"
            columns: ["slider_id"]
            isOneToOne: false
            referencedRelation: "product_360_sliders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_360_sliders: {
        Row: {
          auto_rotate: boolean | null
          created_at: string
          frame_count: number
          id: string
          product_id: string
          rotation_speed: number | null
          updated_at: string
        }
        Insert: {
          auto_rotate?: boolean | null
          created_at?: string
          frame_count?: number
          id?: string
          product_id: string
          rotation_speed?: number | null
          updated_at?: string
        }
        Update: {
          auto_rotate?: boolean | null
          created_at?: string
          frame_count?: number
          id?: string
          product_id?: string
          rotation_speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_360_sliders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      product_comparisons: {
        Row: {
          created_at: string
          id: string
          product_id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_comparisons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_line_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_line_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_line_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_line_items_product_line_id_fkey"
            columns: ["product_line_id"]
            isOneToOne: false
            referencedRelation: "product_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      product_lines: {
        Row: {
          created_at: string
          description: string | null
          grouping_attribute_id: string | null
          id: string
          internal_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grouping_attribute_id?: string | null
          id?: string
          internal_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grouping_attribute_id?: string | null
          id?: string
          internal_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_lines_grouping_attribute_id_fkey"
            columns: ["grouping_attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
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
          approved: boolean | null
          auto_generated: boolean | null
          co_purchase_count: number | null
          created_at: string | null
          id: string
          product_id: string
          related_product_id: string
          relation_type: string
          sort_order: number | null
        }
        Insert: {
          approved?: boolean | null
          auto_generated?: boolean | null
          co_purchase_count?: number | null
          created_at?: string | null
          id?: string
          product_id: string
          related_product_id: string
          relation_type?: string
          sort_order?: number | null
        }
        Update: {
          approved?: boolean | null
          auto_generated?: boolean | null
          co_purchase_count?: number | null
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
      product_sizes: {
        Row: {
          created_at: string
          id: string
          label: string
          price: number
          product_id: string
          sort_order: number
          weight_grams: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          price?: number
          product_id: string
          sort_order?: number
          weight_grams?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          price?: number
          product_id?: string
          sort_order?: number
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
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
          availability: Database["public"]["Enums"]["availability_state"] | null
          badge_bestseller: boolean
          badge_custom_color: string | null
          badge_custom_text: string | null
          badge_exclusive: boolean
          badge_gift: boolean
          badge_low_stock: boolean
          badge_new: boolean
          badge_new_until: string | null
          badge_promo: boolean
          brand_id: string | null
          bundle_discount_percent: number | null
          bundle_pricing_mode: string | null
          burn_hours: number | null
          canonical_url: string | null
          category_id: string | null
          collections: string[] | null
          compare_at_price: number | null
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
          occasion_tags: string[] | null
          old_price: number | null
          price: number
          product_type: string
          published_at: string | null
          rating: number | null
          review_count: number | null
          scent_family: string | null
          scent_intensity: number | null
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
          total_sold: number | null
          videos: string[] | null
          visibility: Database["public"]["Enums"]["visibility_state"] | null
          visible: boolean | null
          warranty_months: number | null
          warranty_text: string | null
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          availability?:
            | Database["public"]["Enums"]["availability_state"]
            | null
          badge_bestseller?: boolean
          badge_custom_color?: string | null
          badge_custom_text?: string | null
          badge_exclusive?: boolean
          badge_gift?: boolean
          badge_low_stock?: boolean
          badge_new?: boolean
          badge_new_until?: string | null
          badge_promo?: boolean
          brand_id?: string | null
          bundle_discount_percent?: number | null
          bundle_pricing_mode?: string | null
          burn_hours?: number | null
          canonical_url?: string | null
          category_id?: string | null
          collections?: string[] | null
          compare_at_price?: number | null
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
          occasion_tags?: string[] | null
          old_price?: number | null
          price?: number
          product_type?: string
          published_at?: string | null
          rating?: number | null
          review_count?: number | null
          scent_family?: string | null
          scent_intensity?: number | null
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
          total_sold?: number | null
          videos?: string[] | null
          visibility?: Database["public"]["Enums"]["visibility_state"] | null
          visible?: boolean | null
          warranty_months?: number | null
          warranty_text?: string | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          availability?:
            | Database["public"]["Enums"]["availability_state"]
            | null
          badge_bestseller?: boolean
          badge_custom_color?: string | null
          badge_custom_text?: string | null
          badge_exclusive?: boolean
          badge_gift?: boolean
          badge_low_stock?: boolean
          badge_new?: boolean
          badge_new_until?: string | null
          badge_promo?: boolean
          brand_id?: string | null
          bundle_discount_percent?: number | null
          bundle_pricing_mode?: string | null
          burn_hours?: number | null
          canonical_url?: string | null
          category_id?: string | null
          collections?: string[] | null
          compare_at_price?: number | null
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
          occasion_tags?: string[] | null
          old_price?: number | null
          price?: number
          product_type?: string
          published_at?: string | null
          rating?: number | null
          review_count?: number | null
          scent_family?: string | null
          scent_intensity?: number | null
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
          total_sold?: number | null
          videos?: string[] | null
          visibility?: Database["public"]["Enums"]["visibility_state"] | null
          visible?: boolean | null
          warranty_months?: number | null
          warranty_text?: string | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
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
          recommendation_optout: boolean | null
          segments: string[] | null
          smartbill_client_id: string | null
          sms_consent: boolean | null
          sms_consent_at: string | null
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
          recommendation_optout?: boolean | null
          segments?: string[] | null
          smartbill_client_id?: string | null
          sms_consent?: boolean | null
          sms_consent_at?: string | null
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
          recommendation_optout?: boolean | null
          segments?: string[] | null
          smartbill_client_id?: string | null
          sms_consent?: boolean | null
          sms_consent_at?: string | null
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
          active: boolean | null
          active_days: number[] | null
          active_hour_end: number | null
          active_hour_start: number | null
          applies_to_customers: string | null
          applies_to_products: string | null
          badge_text: string | null
          banner_url: string | null
          brand_ids: string[] | null
          bundle_products: Json | null
          category_ids: string[] | null
          conditions: Json | null
          created_at: string | null
          customer_group_ids: string[] | null
          discount_type: string | null
          discount_value: number | null
          ends_at: string | null
          excluded_category_ids: string[] | null
          excluded_product_ids: string[] | null
          gift_product_id: string | null
          id: string
          is_combinable: boolean | null
          label: string | null
          label_color: string | null
          max_discount: number | null
          max_uses: number | null
          max_uses_per_user: number | null
          name: string
          new_customers_only: boolean | null
          no_combine: boolean | null
          priority: number | null
          product_ids: string[] | null
          registered_only: boolean | null
          required_payment_method: string | null
          show_countdown: boolean | null
          spend_tiers: Json | null
          starts_at: string | null
          status: string | null
          total_discount_given: number | null
          total_orders: number | null
          total_revenue: number | null
          type: string
          updated_at: string | null
          used_count: number | null
          volume_tiers: Json | null
        }
        Insert: {
          active?: boolean | null
          active_days?: number[] | null
          active_hour_end?: number | null
          active_hour_start?: number | null
          applies_to_customers?: string | null
          applies_to_products?: string | null
          badge_text?: string | null
          banner_url?: string | null
          brand_ids?: string[] | null
          bundle_products?: Json | null
          category_ids?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          customer_group_ids?: string[] | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          excluded_category_ids?: string[] | null
          excluded_product_ids?: string[] | null
          gift_product_id?: string | null
          id?: string
          is_combinable?: boolean | null
          label?: string | null
          label_color?: string | null
          max_discount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          name: string
          new_customers_only?: boolean | null
          no_combine?: boolean | null
          priority?: number | null
          product_ids?: string[] | null
          registered_only?: boolean | null
          required_payment_method?: string | null
          show_countdown?: boolean | null
          spend_tiers?: Json | null
          starts_at?: string | null
          status?: string | null
          total_discount_given?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          type: string
          updated_at?: string | null
          used_count?: number | null
          volume_tiers?: Json | null
        }
        Update: {
          active?: boolean | null
          active_days?: number[] | null
          active_hour_end?: number | null
          active_hour_start?: number | null
          applies_to_customers?: string | null
          applies_to_products?: string | null
          badge_text?: string | null
          banner_url?: string | null
          brand_ids?: string[] | null
          bundle_products?: Json | null
          category_ids?: string[] | null
          conditions?: Json | null
          created_at?: string | null
          customer_group_ids?: string[] | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          excluded_category_ids?: string[] | null
          excluded_product_ids?: string[] | null
          gift_product_id?: string | null
          id?: string
          is_combinable?: boolean | null
          label?: string | null
          label_color?: string | null
          max_discount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          name?: string
          new_customers_only?: boolean | null
          no_combine?: boolean | null
          priority?: number | null
          product_ids?: string[] | null
          registered_only?: boolean | null
          required_payment_method?: string | null
          show_countdown?: boolean | null
          spend_tiers?: Json | null
          starts_at?: string | null
          status?: string | null
          total_discount_given?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          type?: string
          updated_at?: string | null
          used_count?: number | null
          volume_tiers?: Json | null
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
      purchase_order_items: {
        Row: {
          acquisition_cost_net: number | null
          created_at: string
          ean: string | null
          id: string
          new_sale_price: number | null
          product_id: string | null
          product_name_snapshot: string | null
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number
          sku: string | null
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          acquisition_cost_net?: number | null
          created_at?: string
          ean?: string | null
          id?: string
          new_sale_price?: number | null
          product_id?: string | null
          product_name_snapshot?: string | null
          purchase_order_id: string
          quantity_ordered?: number
          quantity_received?: number
          sku?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          acquisition_cost_net?: number | null
          created_at?: string
          ean?: string | null
          id?: string
          new_sale_price?: number | null
          product_id?: string | null
          product_name_snapshot?: string | null
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number
          sku?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          internal_note: string | null
          status: string
          supplier_id: string | null
          supplier_name_snapshot: string | null
          total_acquisition_cost: number | null
          type: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          internal_note?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name_snapshot?: string | null
          total_acquisition_cost?: number | null
          type?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          internal_note?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name_snapshot?: string | null
          total_acquisition_cost?: number | null
          type?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_campaigns: {
        Row: {
          body: string
          clicked_count: number | null
          created_at: string | null
          delivered_count: number | null
          id: string
          image_url: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          target: string | null
          target_group_id: string | null
          title: string
          url: string | null
        }
        Insert: {
          body: string
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          id?: string
          image_url?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          target?: string | null
          target_group_id?: string | null
          title: string
          url?: string | null
        }
        Update: {
          body?: string
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          id?: string
          image_url?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          target?: string | null
          target_group_id?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_campaigns_target_group_id_fkey"
            columns: ["target_group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
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
      quiz_results: {
        Row: {
          answers_json: Json
          created_at: string
          id: string
          recommended_product_ids: Json
          user_id: string | null
        }
        Insert: {
          answers_json?: Json
          created_at?: string
          id?: string
          recommended_product_ids?: Json
          user_id?: string | null
        }
        Update: {
          answers_json?: Json
          created_at?: string
          id?: string
          recommended_product_ids?: Json
          user_id?: string | null
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
      recommendation_clicks: {
        Row: {
          clicked_at: string
          converted: boolean | null
          id: string
          order_id: string | null
          product_id: string
          recommendation_type: string
          recommended_product_id: string
          revenue: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          converted?: boolean | null
          id?: string
          order_id?: string | null
          product_id: string
          recommendation_type?: string
          recommended_product_id: string
          revenue?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          converted?: boolean | null
          id?: string
          order_id?: string | null
          product_id?: string
          recommendation_type?: string
          recommended_product_id?: string
          revenue?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_clicks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_clicks_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          order_id: string | null
          referral_code: string
          referred_coupon_id: string | null
          referred_email: string | null
          referred_reward_type: string | null
          referred_reward_value: number | null
          referred_user_id: string | null
          referrer_coupon_id: string | null
          referrer_reward_type: string | null
          referrer_reward_value: number | null
          referrer_user_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          referral_code: string
          referred_coupon_id?: string | null
          referred_email?: string | null
          referred_reward_type?: string | null
          referred_reward_value?: number | null
          referred_user_id?: string | null
          referrer_coupon_id?: string | null
          referrer_reward_type?: string | null
          referrer_reward_value?: number | null
          referrer_user_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          referral_code?: string
          referred_coupon_id?: string | null
          referred_email?: string | null
          referred_reward_type?: string | null
          referred_reward_value?: number | null
          referred_user_id?: string | null
          referrer_coupon_id?: string | null
          referrer_reward_type?: string | null
          referrer_reward_value?: number | null
          referrer_user_id?: string
          status?: string
        }
        Relationships: []
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
      return_form_settings: {
        Row: {
          admin_notification_email: string | null
          allow_bank_refund: boolean
          allow_different_product_exchange: boolean
          allow_guest_returns: boolean | null
          allow_multiple_returns_per_order: boolean
          allow_order_cancellation: boolean
          allow_partial_returns: boolean
          allow_same_product_exchange: boolean
          allow_wallet_refund: boolean | null
          auto_approve: boolean
          courier_pickup: string
          email_approved_body: string
          email_approved_subject: string
          email_created_body: string
          email_created_subject: string
          email_received_body: string | null
          email_received_subject: string | null
          email_refunded_body: string | null
          email_refunded_subject: string | null
          email_rejected_body: string
          email_rejected_subject: string
          enabled: boolean
          exchange_shipping_cost: number
          extended_return_window_days: number | null
          footer_link_text: string
          gdpr_consent_text: string | null
          id: string
          non_returnable_tags: string[] | null
          notify_on_approved: boolean
          notify_on_created: boolean
          notify_on_received: boolean | null
          notify_on_refunded: boolean | null
          notify_on_rejected: boolean
          processing_sla_days: number | null
          require_gdpr_consent: boolean | null
          require_order_delivered: boolean | null
          restocking_fee_percent: number | null
          return_address: string | null
          return_policy_text: string | null
          return_reasons: Json
          return_shipping_cost: number
          return_window_days: number
          returnable_category_ids: Json | null
          returnable_products: string
          show_footer_link: boolean
          updated_at: string
        }
        Insert: {
          admin_notification_email?: string | null
          allow_bank_refund?: boolean
          allow_different_product_exchange?: boolean
          allow_guest_returns?: boolean | null
          allow_multiple_returns_per_order?: boolean
          allow_order_cancellation?: boolean
          allow_partial_returns?: boolean
          allow_same_product_exchange?: boolean
          allow_wallet_refund?: boolean | null
          auto_approve?: boolean
          courier_pickup?: string
          email_approved_body?: string
          email_approved_subject?: string
          email_created_body?: string
          email_created_subject?: string
          email_received_body?: string | null
          email_received_subject?: string | null
          email_refunded_body?: string | null
          email_refunded_subject?: string | null
          email_rejected_body?: string
          email_rejected_subject?: string
          enabled?: boolean
          exchange_shipping_cost?: number
          extended_return_window_days?: number | null
          footer_link_text?: string
          gdpr_consent_text?: string | null
          id?: string
          non_returnable_tags?: string[] | null
          notify_on_approved?: boolean
          notify_on_created?: boolean
          notify_on_received?: boolean | null
          notify_on_refunded?: boolean | null
          notify_on_rejected?: boolean
          processing_sla_days?: number | null
          require_gdpr_consent?: boolean | null
          require_order_delivered?: boolean | null
          restocking_fee_percent?: number | null
          return_address?: string | null
          return_policy_text?: string | null
          return_reasons?: Json
          return_shipping_cost?: number
          return_window_days?: number
          returnable_category_ids?: Json | null
          returnable_products?: string
          show_footer_link?: boolean
          updated_at?: string
        }
        Update: {
          admin_notification_email?: string | null
          allow_bank_refund?: boolean
          allow_different_product_exchange?: boolean
          allow_guest_returns?: boolean | null
          allow_multiple_returns_per_order?: boolean
          allow_order_cancellation?: boolean
          allow_partial_returns?: boolean
          allow_same_product_exchange?: boolean
          allow_wallet_refund?: boolean | null
          auto_approve?: boolean
          courier_pickup?: string
          email_approved_body?: string
          email_approved_subject?: string
          email_created_body?: string
          email_created_subject?: string
          email_received_body?: string | null
          email_received_subject?: string | null
          email_refunded_body?: string | null
          email_refunded_subject?: string | null
          email_rejected_body?: string
          email_rejected_subject?: string
          enabled?: boolean
          exchange_shipping_cost?: number
          extended_return_window_days?: number | null
          footer_link_text?: string
          gdpr_consent_text?: string | null
          id?: string
          non_returnable_tags?: string[] | null
          notify_on_approved?: boolean
          notify_on_created?: boolean
          notify_on_received?: boolean | null
          notify_on_refunded?: boolean | null
          notify_on_rejected?: boolean
          processing_sla_days?: number | null
          require_gdpr_consent?: boolean | null
          require_order_delivered?: boolean | null
          restocking_fee_percent?: number | null
          return_address?: string | null
          return_policy_text?: string | null
          return_reasons?: Json
          return_shipping_cost?: number
          return_window_days?: number
          returnable_category_ids?: Json | null
          returnable_products?: string
          show_footer_link?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      return_request_images: {
        Row: {
          created_at: string
          file_size: number | null
          id: string
          original_filename: string | null
          public_url: string
          return_item_id: string | null
          return_request_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          id?: string
          original_filename?: string | null
          public_url: string
          return_item_id?: string | null
          return_request_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          id?: string
          original_filename?: string | null
          public_url?: string
          return_item_id?: string | null
          return_request_id?: string
          storage_path?: string
        }
        Relationships: []
      }
      return_request_items: {
        Row: {
          created_at: string
          exchange_product_id: string | null
          exchange_quantity: number | null
          exchange_variant_id: string | null
          id: string
          order_item_id: string | null
          product_id: string | null
          product_name: string
          quantity: number
          return_reason_id: string | null
          return_reason_text: string | null
          return_request_id: string
          total_value: number | null
          unit_price: number | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          exchange_product_id?: string | null
          exchange_quantity?: number | null
          exchange_variant_id?: string | null
          id?: string
          order_item_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          return_reason_id?: string | null
          return_reason_text?: string | null
          return_request_id: string
          total_value?: number | null
          unit_price?: number | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          exchange_product_id?: string | null
          exchange_quantity?: number | null
          exchange_variant_id?: string | null
          id?: string
          order_item_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          return_reason_id?: string | null
          return_reason_text?: string | null
          return_request_id?: string
          total_value?: number | null
          unit_price?: number | null
          variant_id?: string | null
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
      return_request_notes: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          note_text: string
          return_request_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          note_text: string
          return_request_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          note_text?: string
          return_request_id?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          admin_notes: string | null
          auto_approved: boolean | null
          bank_account_holder: string | null
          bank_iban: string | null
          bank_name: string | null
          courier_pickup_by: string | null
          created_at: string
          customer_id: string | null
          customer_notified_at: string | null
          details: string | null
          gdpr_consent_given: boolean | null
          id: string
          images: Json | null
          items: Json
          order_id: string
          photos: string[] | null
          pickup_address: string | null
          preferred_pickup_date: string | null
          reason: string
          refund_amount: number | null
          refund_method: string | null
          rejection_reason: string | null
          resolution: string | null
          return_deadline: string | null
          return_shipping_cost_calculated: number | null
          rma_number: string | null
          status: string
          tracking_number: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          auto_approved?: boolean | null
          bank_account_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          courier_pickup_by?: string | null
          created_at?: string
          customer_id?: string | null
          customer_notified_at?: string | null
          details?: string | null
          gdpr_consent_given?: boolean | null
          id?: string
          images?: Json | null
          items?: Json
          order_id: string
          photos?: string[] | null
          pickup_address?: string | null
          preferred_pickup_date?: string | null
          reason: string
          refund_amount?: number | null
          refund_method?: string | null
          rejection_reason?: string | null
          resolution?: string | null
          return_deadline?: string | null
          return_shipping_cost_calculated?: number | null
          rma_number?: string | null
          status?: string
          tracking_number?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          auto_approved?: boolean | null
          bank_account_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          courier_pickup_by?: string | null
          created_at?: string
          customer_id?: string | null
          customer_notified_at?: string | null
          details?: string | null
          gdpr_consent_given?: boolean | null
          id?: string
          images?: Json | null
          items?: Json
          order_id?: string
          photos?: string[] | null
          pickup_address?: string | null
          preferred_pickup_date?: string | null
          reason?: string
          refund_amount?: number | null
          refund_method?: string | null
          rejection_reason?: string | null
          resolution?: string | null
          return_deadline?: string | null
          return_shipping_cost_calculated?: number | null
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
          reviewer_name: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          reviewer_name?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          reviewer_name?: string | null
          user_id?: string | null
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
      romania_judete: {
        Row: {
          abreviere: string
          id: number
          nume: string
        }
        Insert: {
          abreviere: string
          id?: number
          nume: string
        }
        Update: {
          abreviere?: string
          id?: number
          nume?: string
        }
        Relationships: []
      }
      romania_localitati: {
        Row: {
          id: number
          judet_id: number | null
          nume: string
          tip: string | null
        }
        Insert: {
          id?: number
          judet_id?: number | null
          nume: string
          tip?: string | null
        }
        Update: {
          id?: number
          judet_id?: number | null
          nume?: string
          tip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "romania_localitati_judet_id_fkey"
            columns: ["judet_id"]
            isOneToOne: false
            referencedRelation: "romania_judete"
            referencedColumns: ["id"]
          },
        ]
      }
      sameday_awbs: {
        Row: {
          awb_number: string | null
          awb_payment: number
          cash_on_delivery: number
          created_at: string
          generated_at: string
          id: string
          insured_value: number
          order_id: string
          package_count: number
          package_type: number
          parcel_numbers: Json | null
          pdf_cached_path: string | null
          pickup_point_id: number | null
          recipient_address: string | null
          recipient_city: string | null
          recipient_county: string | null
          recipient_name: string | null
          recipient_phone: string | null
          service_id: number | null
          status: string
          third_party_pickup: boolean
          total_weight: number
          updated_at: string
        }
        Insert: {
          awb_number?: string | null
          awb_payment?: number
          cash_on_delivery?: number
          created_at?: string
          generated_at?: string
          id?: string
          insured_value?: number
          order_id: string
          package_count?: number
          package_type?: number
          parcel_numbers?: Json | null
          pdf_cached_path?: string | null
          pickup_point_id?: number | null
          recipient_address?: string | null
          recipient_city?: string | null
          recipient_county?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          service_id?: number | null
          status?: string
          third_party_pickup?: boolean
          total_weight?: number
          updated_at?: string
        }
        Update: {
          awb_number?: string | null
          awb_payment?: number
          cash_on_delivery?: number
          created_at?: string
          generated_at?: string
          id?: string
          insured_value?: number
          order_id?: string
          package_count?: number
          package_type?: number
          parcel_numbers?: Json | null
          pdf_cached_path?: string | null
          pickup_point_id?: number | null
          recipient_address?: string | null
          recipient_city?: string | null
          recipient_county?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          service_id?: number | null
          status?: string
          third_party_pickup?: boolean
          total_weight?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sameday_awbs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sameday_cities: {
        Row: {
          county_id: number | null
          county_name: string | null
          extra_km: number | null
          fetched_at: string
          id: number
          name: string
          postal_code: string | null
          sameday_delivery_agency: string | null
          sameday_pickup_agency: string | null
          village: string | null
        }
        Insert: {
          county_id?: number | null
          county_name?: string | null
          extra_km?: number | null
          fetched_at?: string
          id: number
          name: string
          postal_code?: string | null
          sameday_delivery_agency?: string | null
          sameday_pickup_agency?: string | null
          village?: string | null
        }
        Update: {
          county_id?: number | null
          county_name?: string | null
          extra_km?: number | null
          fetched_at?: string
          id?: number
          name?: string
          postal_code?: string | null
          sameday_delivery_agency?: string | null
          sameday_pickup_agency?: string | null
          village?: string | null
        }
        Relationships: []
      }
      sameday_city_mappings: {
        Row: {
          created_at: string
          id: string
          platform_city_name: string
          platform_county_name: string | null
          sameday_city_id: number | null
          sameday_county_id: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          platform_city_name: string
          platform_county_name?: string | null
          sameday_city_id?: number | null
          sameday_county_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          platform_city_name?: string
          platform_county_name?: string | null
          sameday_city_id?: number | null
          sameday_county_id?: number | null
        }
        Relationships: []
      }
      sameday_counties: {
        Row: {
          code: string | null
          fetched_at: string
          id: number
          name: string
        }
        Insert: {
          code?: string | null
          fetched_at?: string
          id: number
          name: string
        }
        Update: {
          code?: string | null
          fetched_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      sameday_pickup_points: {
        Row: {
          address: string | null
          alias: string | null
          city_id: number | null
          city_name: string | null
          contact_persons: Json | null
          county_code: string | null
          county_id: number | null
          county_name: string | null
          fetched_at: string
          id: number
          is_default: boolean
          status: boolean
        }
        Insert: {
          address?: string | null
          alias?: string | null
          city_id?: number | null
          city_name?: string | null
          contact_persons?: Json | null
          county_code?: string | null
          county_id?: number | null
          county_name?: string | null
          fetched_at?: string
          id: number
          is_default?: boolean
          status?: boolean
        }
        Update: {
          address?: string | null
          alias?: string | null
          city_id?: number | null
          city_name?: string | null
          contact_persons?: Json | null
          county_code?: string | null
          county_id?: number | null
          county_name?: string | null
          fetched_at?: string
          id?: number
          is_default?: boolean
          status?: boolean
        }
        Relationships: []
      }
      sameday_services: {
        Row: {
          delivery_type_id: number | null
          delivery_type_name: string | null
          fetched_at: string
          id: number
          is_default: boolean
          name: string
          optional_taxes: Json | null
          service_code: string | null
        }
        Insert: {
          delivery_type_id?: number | null
          delivery_type_name?: string | null
          fetched_at?: string
          id: number
          is_default?: boolean
          name: string
          optional_taxes?: Json | null
          service_code?: string | null
        }
        Update: {
          delivery_type_id?: number | null
          delivery_type_name?: string | null
          fetched_at?: string
          id?: number
          is_default?: boolean
          name?: string
          optional_taxes?: Json | null
          service_code?: string | null
        }
        Relationships: []
      }
      sameday_settings: {
        Row: {
          auto_generate: boolean
          auto_generate_on_status: string
          default_awb_payment: number
          default_contact_person_id: number | null
          default_package_type: number
          default_pickup_point_id: number | null
          default_service_id: number | null
          default_weight: number
          enabled: boolean
          id: string
          production_api_url: string
          sandbox_mode: boolean
          send_tracking_email: boolean
          token_expires_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          auto_generate?: boolean
          auto_generate_on_status?: string
          default_awb_payment?: number
          default_contact_person_id?: number | null
          default_package_type?: number
          default_pickup_point_id?: number | null
          default_service_id?: number | null
          default_weight?: number
          enabled?: boolean
          id?: string
          production_api_url?: string
          sandbox_mode?: boolean
          send_tracking_email?: boolean
          token_expires_at?: string | null
          updated_at?: string
          username?: string
        }
        Update: {
          auto_generate?: boolean
          auto_generate_on_status?: string
          default_awb_payment?: number
          default_contact_person_id?: number | null
          default_package_type?: number
          default_pickup_point_id?: number | null
          default_service_id?: number | null
          default_weight?: number
          enabled?: boolean
          id?: string
          production_api_url?: string
          sandbox_mode?: boolean
          send_tracking_email?: boolean
          token_expires_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      scent_quiz_results: {
        Row: {
          answers: Json
          created_at: string
          id: string
          purchased_product_id: string | null
          recommended_products: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          purchased_product_id?: string | null
          recommended_products?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          purchased_product_id?: string | null
          recommended_products?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scent_quiz_results_purchased_product_id_fkey"
            columns: ["purchased_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      seo_redirects: {
        Row: {
          created_at: string | null
          hit_count: number | null
          id: string
          is_active: boolean | null
          last_hit_at: string | null
          notes: string | null
          redirect_type: number | null
          source_url: string
          target_url: string
        }
        Insert: {
          created_at?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          last_hit_at?: string | null
          notes?: string | null
          redirect_type?: number | null
          source_url: string
          target_url: string
        }
        Update: {
          created_at?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          last_hit_at?: string | null
          notes?: string | null
          redirect_type?: number | null
          source_url?: string
          target_url?: string
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
      shipping_methods: {
        Row: {
          created_at: string
          description: string | null
          estimated_days: string | null
          free_above: number | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_days?: string | null
          free_above?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_days?: string | null
          free_above?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_banners: {
        Row: {
          banner_type: string
          content: string | null
          created_at: string
          id: string
          is_active: boolean
          scheduled_from: string | null
          scheduled_until: string | null
          settings_json: Json
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          banner_type?: string
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          scheduled_from?: string | null
          scheduled_until?: string | null
          settings_json?: Json
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          banner_type?: string
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          scheduled_from?: string | null
          scheduled_until?: string | null
          settings_json?: Json
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_layout_settings: {
        Row: {
          id: string
          setting_key: string
          updated_at: string
          updated_by: string | null
          value_json: Json
        }
        Insert: {
          id?: string
          setting_key: string
          updated_at?: string
          updated_by?: string | null
          value_json?: Json
        }
        Update: {
          id?: string
          setting_key?: string
          updated_at?: string
          updated_by?: string | null
          value_json?: Json
        }
        Relationships: []
      }
      site_popups: {
        Row: {
          body_html: string | null
          coupon_code: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          display_frequency: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          pages: string[] | null
          popup_type: string
          sort_order: number
          starts_at: string | null
          title: string | null
          trigger_type: string
          trigger_value: number | null
          updated_at: string
        }
        Insert: {
          body_html?: string | null
          coupon_code?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          display_frequency?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          pages?: string[] | null
          popup_type?: string
          sort_order?: number
          starts_at?: string | null
          title?: string | null
          trigger_type?: string
          trigger_value?: number | null
          updated_at?: string
        }
        Update: {
          body_html?: string | null
          coupon_code?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          display_frequency?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          pages?: string[] | null
          popup_type?: string
          sort_order?: number
          starts_at?: string | null
          title?: string | null
          trigger_type?: string
          trigger_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: boolean
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: boolean
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: boolean
        }
        Relationships: []
      }
      site_visibility_settings: {
        Row: {
          category: string
          element_key: string
          id: string
          is_active: boolean
          label: string
          path_label: string | null
          scheduled_from: string | null
          scheduled_until: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          element_key: string
          id?: string
          is_active?: boolean
          label?: string
          path_label?: string | null
          scheduled_from?: string | null
          scheduled_until?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          element_key?: string
          id?: string
          is_active?: boolean
          label?: string
          path_label?: string | null
          scheduled_from?: string | null
          scheduled_until?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      slider_360_settings: {
        Row: {
          auto_rotate_default: boolean
          default_frame_count: number
          enabled: boolean
          id: string
          rotation_speed_default: number
          show_360_badge: boolean
          show_controls: boolean
          updated_at: string
        }
        Insert: {
          auto_rotate_default?: boolean
          default_frame_count?: number
          enabled?: boolean
          id?: string
          rotation_speed_default?: number
          show_360_badge?: boolean
          show_controls?: boolean
          updated_at?: string
        }
        Update: {
          auto_rotate_default?: boolean
          default_frame_count?: number
          enabled?: boolean
          id?: string
          rotation_speed_default?: number
          show_360_badge?: boolean
          show_controls?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      smartbill_invoices: {
        Row: {
          created_at: string
          document_type: string
          error_message: string | null
          generated_at: string
          id: string
          invoice_number: string
          invoice_series: string
          issued_at: string | null
          order_id: string
          pdf_cached_path: string | null
          smartbill_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          error_message?: string | null
          generated_at?: string
          id?: string
          invoice_number?: string
          invoice_series?: string
          issued_at?: string | null
          order_id: string
          pdf_cached_path?: string | null
          smartbill_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          error_message?: string | null
          generated_at?: string
          id?: string
          invoice_number?: string
          invoice_series?: string
          issued_at?: string | null
          order_id?: string
          pdf_cached_path?: string | null
          smartbill_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smartbill_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      smartbill_settings: {
        Row: {
          auto_generate: boolean
          auto_generate_on_status: string
          auto_sync_stocks: boolean
          cif: string
          currency: string
          default_meas_unit: string
          default_tax_name: string
          default_tax_percentage: number
          document_type: string
          email: string
          enabled: boolean
          generate_invoices_enabled: boolean
          id: string
          include_shipping: boolean
          invoice_series: string
          order_reference_template: string
          product_identifier: string
          sandbox: boolean
          save_client_to_db: boolean
          save_products_to_db: boolean
          send_email_to_client: boolean
          series_proforma: string
          shipping_product_name: string
          sync_frequency: string
          sync_stocks_enabled: boolean
          unknown_products_action: string
          updated_at: string
          warehouse_name: string | null
        }
        Insert: {
          auto_generate?: boolean
          auto_generate_on_status?: string
          auto_sync_stocks?: boolean
          cif?: string
          currency?: string
          default_meas_unit?: string
          default_tax_name?: string
          default_tax_percentage?: number
          document_type?: string
          email?: string
          enabled?: boolean
          generate_invoices_enabled?: boolean
          id?: string
          include_shipping?: boolean
          invoice_series?: string
          order_reference_template?: string
          product_identifier?: string
          sandbox?: boolean
          save_client_to_db?: boolean
          save_products_to_db?: boolean
          send_email_to_client?: boolean
          series_proforma?: string
          shipping_product_name?: string
          sync_frequency?: string
          sync_stocks_enabled?: boolean
          unknown_products_action?: string
          updated_at?: string
          warehouse_name?: string | null
        }
        Update: {
          auto_generate?: boolean
          auto_generate_on_status?: string
          auto_sync_stocks?: boolean
          cif?: string
          currency?: string
          default_meas_unit?: string
          default_tax_name?: string
          default_tax_percentage?: number
          document_type?: string
          email?: string
          enabled?: boolean
          generate_invoices_enabled?: boolean
          id?: string
          include_shipping?: boolean
          invoice_series?: string
          order_reference_template?: string
          product_identifier?: string
          sandbox?: boolean
          save_client_to_db?: boolean
          save_products_to_db?: boolean
          send_email_to_client?: boolean
          series_proforma?: string
          shipping_product_name?: string
          sync_frequency?: string
          sync_stocks_enabled?: boolean
          unknown_products_action?: string
          updated_at?: string
          warehouse_name?: string | null
        }
        Relationships: []
      }
      smartbill_stock_sync_log: {
        Row: {
          details: Json | null
          errors_count: number
          finished_at: string | null
          id: string
          products_not_found: number
          products_processed: number
          products_updated: number
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          details?: Json | null
          errors_count?: number
          finished_at?: string | null
          id?: string
          products_not_found?: number
          products_processed?: number
          products_updated?: number
          started_at?: string
          status?: string
          sync_type?: string
        }
        Update: {
          details?: Json | null
          errors_count?: number
          finished_at?: string | null
          id?: string
          products_not_found?: number
          products_processed?: number
          products_updated?: number
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
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
      sms_campaigns: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          message: string
          name: string
          recipient_count: number | null
          scheduled_at: string | null
          sent_count: number | null
          status: string | null
          target_segment: string | null
          trigger_type: string | null
          updated_at: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          message: string
          name: string
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_segment?: string | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          message?: string
          name?: string
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_segment?: string | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          created_at: string
          id: string
          message: string
          order_id: string | null
          phone: string
          sms_type: string
          status: string
          twilio_sid: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          order_id?: string | null
          phone: string
          sms_type?: string
          status?: string
          twilio_sid?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string | null
          phone?: string
          sms_type?: string
          status?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      social_proof_analytics: {
        Row: {
          created_at: string
          display_duration_ms: number | null
          id: string
          notification_type: string
          page_url: string | null
          product_id: string | null
          session_id: string | null
          was_clicked: boolean
          was_dismissed: boolean
        }
        Insert: {
          created_at?: string
          display_duration_ms?: number | null
          id?: string
          notification_type?: string
          page_url?: string | null
          product_id?: string | null
          session_id?: string | null
          was_clicked?: boolean
          was_dismissed?: boolean
        }
        Update: {
          created_at?: string
          display_duration_ms?: number | null
          id?: string
          notification_type?: string
          page_url?: string | null
          product_id?: string | null
          session_id?: string | null
          was_clicked?: boolean
          was_dismissed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "social_proof_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      social_proof_custom_messages: {
        Row: {
          active: boolean
          created_at: string
          icon_type: string
          icon_value: string
          id: string
          link_url: string | null
          message_text: string
          priority: number
          sort_order: number
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon_type?: string
          icon_value?: string
          id?: string
          link_url?: string | null
          message_text?: string
          priority?: number
          sort_order?: number
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          icon_type?: string
          icon_value?: string
          id?: string
          link_url?: string | null
          message_text?: string
          priority?: number
          sort_order?: number
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      social_proof_events: {
        Row: {
          buyer_city: string | null
          buyer_first_name: string | null
          created_at: string
          event_type: string
          id: string
          product_id: string | null
          product_image: string | null
          product_name: string
        }
        Insert: {
          buyer_city?: string | null
          buyer_first_name?: string | null
          created_at?: string
          event_type?: string
          id?: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
        }
        Update: {
          buyer_city?: string | null
          buyer_first_name?: string | null
          created_at?: string
          event_type?: string
          id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_proof_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      social_proof_simulated: {
        Row: {
          active: boolean
          city: string
          created_at: string
          first_name: string
          id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          sort_order: number
          time_display: string
          type: string
        }
        Insert: {
          active?: boolean
          city?: string
          created_at?: string
          first_name?: string
          id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          sort_order?: number
          time_display?: string
          type?: string
        }
        Update: {
          active?: boolean
          city?: string
          created_at?: string
          first_name?: string
          id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          sort_order?: number
          time_display?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_proof_simulated_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      stock_reception_log: {
        Row: {
          id: string
          new_stock: number | null
          previous_stock: number | null
          product_id: string | null
          purchase_order_id: string | null
          quantity_added: number
          received_at: string
          received_by: string | null
          variant_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          id?: string
          new_stock?: number | null
          previous_stock?: number | null
          product_id?: string | null
          purchase_order_id?: string | null
          quantity_added?: number
          received_at?: string
          received_by?: string | null
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          id?: string
          new_stock?: number | null
          previous_stock?: number | null
          product_id?: string | null
          purchase_order_id?: string | null
          quantity_added?: number
          received_at?: string
          received_by?: string | null
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reception_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reception_log_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
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
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
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
      tbi_settings: {
        Row: {
          allowed_delivery_ids: Json | null
          allowed_ips: string | null
          checkout_display_name: string
          condition_categories: Json | null
          condition_countries: Json | null
          condition_customer_groups: Json | null
          delivery_restriction: string
          demo_mode: boolean
          enabled: boolean
          enabled_products: Json
          id: string
          limit_by_customer_type: boolean
          limit_individual_pct: number | null
          limit_legal_pct: number | null
          max_order_value: number | null
          min_order_value: number
          show_footer_icon: boolean
          show_snippet: boolean
          store_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          allowed_delivery_ids?: Json | null
          allowed_ips?: string | null
          checkout_display_name?: string
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          delivery_restriction?: string
          demo_mode?: boolean
          enabled?: boolean
          enabled_products?: Json
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_pct?: number | null
          limit_legal_pct?: number | null
          max_order_value?: number | null
          min_order_value?: number
          show_footer_icon?: boolean
          show_snippet?: boolean
          store_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          allowed_delivery_ids?: Json | null
          allowed_ips?: string | null
          checkout_display_name?: string
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          delivery_restriction?: string
          demo_mode?: boolean
          enabled?: boolean
          enabled_products?: Json
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_pct?: number | null
          limit_legal_pct?: number | null
          max_order_value?: number | null
          min_order_value?: number
          show_footer_icon?: boolean
          show_snippet?: boolean
          store_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      tbi_transactions: {
        Row: {
          created_at: string
          encrypted_payload_sent: string | null
          id: string
          last_callback_at: string | null
          motiv: string | null
          order_id: string | null
          status: string
          status_id_raw: string | null
          tbi_credit_application_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          encrypted_payload_sent?: string | null
          id?: string
          last_callback_at?: string | null
          motiv?: string | null
          order_id?: string | null
          status?: string
          status_id_raw?: string | null
          tbi_credit_application_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          encrypted_payload_sent?: string | null
          id?: string
          last_callback_at?: string | null
          motiv?: string | null
          order_id?: string | null
          status?: string
          status_id_raw?: string | null
          tbi_credit_application_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      wallet_settings: {
        Row: {
          allowed_delivery_method_ids: Json | null
          allowed_ips: string | null
          checkout_display_name: string
          condition_categories: Json | null
          condition_countries: Json | null
          condition_customer_groups: Json | null
          condition_max_order_value: number | null
          condition_min_order_value: number | null
          delivery_method_restriction: string
          enabled: boolean
          id: string
          limit_by_customer_type: boolean
          limit_individual_pct: number | null
          limit_legal_pct: number | null
          updated_at: string
          usage_mode: string
        }
        Insert: {
          allowed_delivery_method_ids?: Json | null
          allowed_ips?: string | null
          checkout_display_name?: string
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          condition_max_order_value?: number | null
          condition_min_order_value?: number | null
          delivery_method_restriction?: string
          enabled?: boolean
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_pct?: number | null
          limit_legal_pct?: number | null
          updated_at?: string
          usage_mode?: string
        }
        Update: {
          allowed_delivery_method_ids?: Json | null
          allowed_ips?: string | null
          checkout_display_name?: string
          condition_categories?: Json | null
          condition_countries?: Json | null
          condition_customer_groups?: Json | null
          condition_max_order_value?: number | null
          condition_min_order_value?: number | null
          delivery_method_restriction?: string
          enabled?: boolean
          id?: string
          limit_by_customer_type?: boolean
          limit_individual_pct?: number | null
          limit_legal_pct?: number | null
          updated_at?: string
          usage_mode?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by_admin_id: string | null
          customer_id: string
          description: string
          direction: string
          id: string
          order_id: string | null
          return_id: string | null
          status: string
          type: string
          updated_at: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by_admin_id?: string | null
          customer_id: string
          description?: string
          direction?: string
          id?: string
          order_id?: string | null
          return_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by_admin_id?: string | null
          customer_id?: string
          description?: string
          direction?: string
          id?: string
          order_id?: string | null
          return_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "customer_wallets"
            referencedColumns: ["id"]
          },
        ]
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
      winback_campaigns: {
        Row: {
          created_at: string | null
          email_1_enabled: boolean | null
          email_1_subject: string | null
          email_1_template_id: string | null
          email_2_delay_days: number | null
          email_2_discount_percent: number | null
          email_2_discount_validity_days: number | null
          email_2_enabled: boolean | null
          email_2_subject: string | null
          email_3_delay_days: number | null
          email_3_discount_percent: number | null
          email_3_enabled: boolean | null
          email_3_free_shipping: boolean | null
          email_3_subject: string | null
          id: string
          is_active: boolean | null
          name: string
          target_group_id: string | null
          target_segment: string
          trigger_days: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_1_enabled?: boolean | null
          email_1_subject?: string | null
          email_1_template_id?: string | null
          email_2_delay_days?: number | null
          email_2_discount_percent?: number | null
          email_2_discount_validity_days?: number | null
          email_2_enabled?: boolean | null
          email_2_subject?: string | null
          email_3_delay_days?: number | null
          email_3_discount_percent?: number | null
          email_3_enabled?: boolean | null
          email_3_free_shipping?: boolean | null
          email_3_subject?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_group_id?: string | null
          target_segment?: string
          trigger_days?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_1_enabled?: boolean | null
          email_1_subject?: string | null
          email_1_template_id?: string | null
          email_2_delay_days?: number | null
          email_2_discount_percent?: number | null
          email_2_discount_validity_days?: number | null
          email_2_enabled?: boolean | null
          email_2_subject?: string | null
          email_3_delay_days?: number | null
          email_3_discount_percent?: number | null
          email_3_enabled?: boolean | null
          email_3_free_shipping?: boolean | null
          email_3_subject?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_group_id?: string | null
          target_segment?: string
          trigger_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winback_campaigns_target_group_id_fkey"
            columns: ["target_group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      winback_enrollments: {
        Row: {
          campaign_id: string
          converted: boolean | null
          converted_at: string | null
          converted_order_id: string | null
          coupon_code: string | null
          created_at: string | null
          email_1_sent_at: string | null
          email_2_sent_at: string | null
          email_3_sent_at: string | null
          id: string
          revenue: number | null
          status: string
          updated_at: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          converted?: boolean | null
          converted_at?: string | null
          converted_order_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          email_3_sent_at?: string | null
          id?: string
          revenue?: number | null
          status?: string
          updated_at?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          converted?: boolean | null
          converted_at?: string | null
          converted_order_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          email_3_sent_at?: string | null
          id?: string
          revenue?: number | null
          status?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winback_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "winback_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          added_at: string
          id: string
          price_at_add: number | null
          product_id: string
          wishlist_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          price_at_add?: number | null
          product_id: string
          wishlist_id: string
        }
        Update: {
          added_at?: string
          id?: string
          price_at_add?: number | null
          product_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          is_public: boolean | null
          name: string
          share_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          name?: string
          share_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          name?: string
          share_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      custom_404_stats: {
        Row: {
          first_seen: string | null
          last_seen: string | null
          referrer_count: number | null
          url_accessed: string | null
          visit_count: number | null
        }
        Relationships: []
      }
      safe_payment_methods: {
        Row: {
          allowed_counties: string[] | null
          allowed_customer_groups: string[] | null
          bank_details: Json | null
          bnpl_config: Json | null
          description: string | null
          display_order: number | null
          extra_fee_type: string | null
          extra_fee_value: number | null
          icon_url: string | null
          id: string | null
          is_active: boolean | null
          key: string | null
          max_amount: number | null
          min_amount: number | null
          name: string | null
          payment_deadline_days: number | null
          pickup_location_id: string | null
          provider: string | null
          type: string | null
        }
        Insert: {
          allowed_counties?: string[] | null
          allowed_customer_groups?: string[] | null
          bank_details?: Json | null
          bnpl_config?: Json | null
          description?: string | null
          display_order?: number | null
          extra_fee_type?: string | null
          extra_fee_value?: number | null
          icon_url?: string | null
          id?: string | null
          is_active?: boolean | null
          key?: string | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string | null
          payment_deadline_days?: number | null
          pickup_location_id?: string | null
          provider?: string | null
          type?: string | null
        }
        Update: {
          allowed_counties?: string[] | null
          allowed_customer_groups?: string[] | null
          bank_details?: Json | null
          bnpl_config?: Json | null
          description?: string | null
          display_order?: number | null
          extra_fee_type?: string | null
          extra_fee_value?: number | null
          icon_url?: string | null
          id?: string | null
          is_active?: boolean | null
          key?: string | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string | null
          payment_deadline_days?: number | null
          pickup_location_id?: string | null
          provider?: string | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anonymize_user_data: { Args: { p_user_id: string }; Returns: Json }
      check_exit_intent_fraud: {
        Args: {
          p_address?: string
          p_email?: string
          p_name?: string
          p_phone?: string
        }
        Returns: boolean
      }
      cleanup_old_chatbot_conversations: { Args: never; Returns: undefined }
      count_dynamic_category_products: {
        Args: { p_rules: Json }
        Returns: number
      }
      create_exit_intent_coupon: {
        Args: { p_code: string; p_valid_until: string }
        Returns: undefined
      }
      delete_customer_data_gdpr: { Args: { p_user_id: string }; Returns: Json }
      get_active_scripts_for_page: {
        Args: { p_page_types: string[] }
        Returns: {
          consent_category: string
          content: string
          external_async: boolean
          external_crossorigin: string
          external_custom_attributes: Json
          external_defer: boolean
          external_type: string
          external_url: string
          id: string
          inline_content: string
          location: string
          pages: Json
          script_type: string
          sort_order: number
        }[]
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
      get_social_proof_messages: {
        Args: { limit_count?: number }
        Returns: {
          message: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_public_app_setting_key: { Args: { _key: string }; Returns: boolean }
      is_valid_email: { Args: { email: string }; Returns: boolean }
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
      use_loyalty_points: {
        Args: {
          p_order_id?: string
          p_points_to_use: number
          p_user_id: string
        }
        Returns: Json
      }
      validate_coupon: {
        Args: {
          p_cart_total: number
          p_coupon_code: string
          p_user_id?: string
        }
        Returns: Json
      }
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
      availability_state:
        | "in_stock"
        | "low_stock"
        | "out_of_stock"
        | "preorder"
        | "available_2_3"
        | "available_5_7"
        | "available_7_10"
        | "available_10_20"
        | "discontinued"
        | "notify_me"
      visibility_state: "visible" | "hidden_catalog" | "hidden_total"
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
      availability_state: [
        "in_stock",
        "low_stock",
        "out_of_stock",
        "preorder",
        "available_2_3",
        "available_5_7",
        "available_7_10",
        "available_10_20",
        "discontinued",
        "notify_me",
      ],
      visibility_state: ["visible", "hidden_catalog", "hidden_total"],
    },
  },
} as const
