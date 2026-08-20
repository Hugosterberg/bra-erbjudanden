export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          website_url: string | null;
          logo_url: string | null;
          status: "active" | "inactive" | "archived";
          is_featured: boolean;
          affiliate_url: string | null;
          saving_tips: string | null;
          seo_intro: string | null;
          affiliate_network: Database["public"]["Enums"]["affiliate_network"] | null;
          external_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          website_url?: string | null;
          logo_url?: string | null;
          status?: "active" | "inactive" | "archived";
          is_featured?: boolean;
          affiliate_url?: string | null;
          saving_tips?: string | null;
          seo_intro?: string | null;
          affiliate_network?: Database["public"]["Enums"]["affiliate_network"] | null;
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          seo_intro: string | null;
          status: "active" | "inactive" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          seo_intro?: string | null;
          status?: "active" | "inactive" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          store_id: string;
          category_id: string | null;
          redemption_type: "discount_code" | "direct_link";
          discount_type: "percentage" | "fixed_amount";
          discount_value: number;
          discount_code: string | null;
          affiliate_url: string;
          terms: string | null;
          image_url: string | null;
          starts_at: string | null;
          ends_at: string | null;
          status: "draft" | "published" | "archived";
          rank_position: number;
          is_featured: boolean;
          is_sponsored: boolean;
          is_exclusive: boolean;
          last_verified_at: string | null;
          original_price: number | null;
          current_price: number | null;
          affiliate_network: Database["public"]["Enums"]["affiliate_network"] | null;
          external_id: string | null;
          is_imported: boolean;
          imported_at: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          store_id: string;
          category_id?: string | null;
          redemption_type?: "discount_code" | "direct_link";
          discount_type: "percentage" | "fixed_amount";
          discount_value: number;
          discount_code?: string | null;
          affiliate_url: string;
          terms?: string | null;
          image_url?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          status?: "draft" | "published" | "archived";
          rank_position?: number;
          is_featured?: boolean;
          is_sponsored?: boolean;
          is_exclusive?: boolean;
          last_verified_at?: string | null;
          original_price?: number | null;
          current_price?: number | null;
          affiliate_network?: Database["public"]["Enums"]["affiliate_network"] | null;
          external_id?: string | null;
          is_imported?: boolean;
          imported_at?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["offers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "offers_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      click_events: {
        Row: {
          id: string;
          offer_id: string;
          store_id: string | null;
          click_type: "discount_code" | "website";
          clicked_at: string;
          referrer: string | null;
          user_agent: string | null;
          ip_hash: string | null;
        };
        Insert: {
          id?: string;
          offer_id: string;
          store_id?: string | null;
          click_type?: "discount_code" | "website";
          clicked_at?: string;
          referrer?: string | null;
          user_agent?: string | null;
          ip_hash?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["click_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "click_events_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "click_events_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_subscribers: {
        Row: {
          id: string;
          email: string;
          status: "active" | "unsubscribed";
          source: string;
          consent_given_at: string;
          consent_text: string;
          last_signup_at: string;
          signup_count: number;
          signup_sources: string[];
          interests: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          status?: "active" | "unsubscribed";
          source?: string;
          consent_given_at?: string;
          consent_text?: string;
          last_signup_at?: string;
          signup_count?: number;
          signup_sources?: string[];
          interests?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deal_subscribers"]["Insert"]>;
        Relationships: [];
      };
      affiliate_import_runs: {
        Row: {
          id: string;
          started_at: string;
          finished_at: string | null;
          status: "running" | "completed" | "completed_with_errors" | "failed";
          networks: string[];
          stats: Json;
          errors: Json;
        };
        Insert: {
          id?: string;
          started_at?: string;
          finished_at?: string | null;
          status?: "running" | "completed" | "completed_with_errors" | "failed";
          networks?: string[];
          stats?: Json;
          errors?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["affiliate_import_runs"]["Insert"]>;
        Relationships: [];
      };
      affiliate_import_network_runs: {
        Row: {
          id: string;
          batch_id: string;
          affiliate_network: Database["public"]["Enums"]["affiliate_network"];
          started_at: string;
          finished_at: string | null;
          status: "running" | "completed" | "completed_with_errors" | "failed";
          fetched: number;
          created_count: number;
          updated_count: number;
          archived_count: number;
          skipped_count: number;
          errors: Json;
        };
        Insert: {
          id?: string;
          batch_id: string;
          affiliate_network: Database["public"]["Enums"]["affiliate_network"];
          started_at?: string;
          finished_at?: string | null;
          status?: "running" | "completed" | "completed_with_errors" | "failed";
          fetched?: number;
          created_count?: number;
          updated_count?: number;
          archived_count?: number;
          skipped_count?: number;
          errors?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["affiliate_import_network_runs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "affiliate_import_network_runs_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_import_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          brand: string | null;
          category_id: string | null;
          description: string | null;
          image_url: string | null;
          product_url: string | null;
          current_price: number | null;
          specifications: Json;
          status: "active" | "inactive" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          brand?: string | null;
          category_id?: string | null;
          description?: string | null;
          image_url?: string | null;
          product_url?: string | null;
          current_price?: number | null;
          specifications?: Json;
          status?: "active" | "inactive" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          id: string;
          article_type: Database["public"]["Enums"]["article_type"];
          title: string;
          slug: string;
          excerpt: string | null;
          body: string;
          category_id: string | null;
          store_id: string | null;
          product_id: string | null;
          author_name: string;
          methodology: Database["public"]["Enums"]["methodology_type"];
          featured_image_url: string | null;
          editorial_score: number | null;
          verdict: string | null;
          pros: string[];
          cons: string[];
          best_for: string | null;
          not_best_for: string | null;
          compared_products: Json;
          is_sponsored: boolean;
          status: "draft" | "published" | "archived";
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_type: Database["public"]["Enums"]["article_type"];
          title: string;
          slug: string;
          excerpt?: string | null;
          body: string;
          category_id?: string | null;
          store_id?: string | null;
          product_id?: string | null;
          author_name?: string;
          methodology?: Database["public"]["Enums"]["methodology_type"];
          featured_image_url?: string | null;
          editorial_score?: number | null;
          verdict?: string | null;
          pros?: string[];
          cons?: string[];
          best_for?: string | null;
          not_best_for?: string | null;
          compared_products?: Json;
          is_sponsored?: boolean;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "articles_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "articles_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      coupon_feedback: {
        Row: {
          id: string;
          offer_id: string;
          worked: boolean;
          ip_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          offer_id: string;
          worked: boolean;
          ip_hash: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coupon_feedback"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "coupon_feedback_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
        ];
      };
      discovery_events: {
        Row: {
          id: string;
          event_type: Database["public"]["Enums"]["discovery_event_type"];
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          ip_hash: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          event_type: Database["public"]["Enums"]["discovery_event_type"];
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip_hash?: string | null;
          occurred_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["discovery_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      register_deal_subscriber: {
        Args: {
          p_email: string;
          p_source?: string;
          p_consent_text?: string;
        };
        Returns: Database["public"]["Tables"]["deal_subscribers"]["Row"];
      };
      count_offer_clicks_since: {
        Args: { since: string };
        Returns: { offer_id: string; click_count: number }[];
      };
      count_store_clicks_since: {
        Args: { since: string };
        Returns: { store_id: string; click_count: number }[];
      };
      count_offer_clicks_by_type: {
        Args: Record<string, never>;
        Returns: {
          offer_id: string;
          click_type: Database["public"]["Enums"]["click_type"];
          click_count: number;
        }[];
      };
    };
    Enums: {
      offer_status: "draft" | "published" | "archived";
      discount_type: "percentage" | "fixed_amount";
      redemption_type: "discount_code" | "direct_link";
      entity_status: "active" | "inactive" | "archived";
      subscriber_status: "active" | "unsubscribed";
      click_type: "discount_code" | "website";
      affiliate_network:
        | "addrevenue"
        | "adtraction"
        | "adrecord"
        | "awin"
        | "tradedoubler";
      article_type: "best_in_test" | "review" | "guide";
      methodology_type: "tested_by_us" | "editorial_evaluation" | "compared_from_sources";
      discovery_event_type:
        | "deal_view"
        | "coupon_copy"
        | "affiliate_click"
        | "newsletter_signup"
        | "search"
        | "coupon_worked"
        | "coupon_failed";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
