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
          status: "active" | "inactive" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
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
          clicked_at: string;
          referrer: string | null;
          user_agent: string | null;
          ip_hash: string | null;
        };
        Insert: {
          id?: string;
          offer_id: string;
          store_id?: string | null;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deal_subscribers"]["Insert"]>;
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
    };
    Enums: {
      offer_status: "draft" | "published" | "archived";
      discount_type: "percentage" | "fixed_amount";
      redemption_type: "discount_code" | "direct_link";
      entity_status: "active" | "inactive" | "archived";
      subscriber_status: "active" | "unsubscribed";
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
