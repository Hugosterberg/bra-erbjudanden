import type { AffiliateNetwork } from "@/features/affiliate-import/types";

export type RevenueEventType = "impression" | "click" | "conversion";

export interface AffiliateRevenueEvent {
  id: string;
  offer_id: string;
  affiliate_network: AffiliateNetwork;
  event_type: RevenueEventType;
  revenue_usd: number;
  revenue_sek: number | null;
  currency: string;
  external_transaction_id: string | null;
  recorded_at: string;
  user_agent: string | null;
  referrer: string | null;
  ip_hash: string | null;
}

export interface AffiliateRevenueDaily {
  id: string;
  date: string;
  affiliate_network: AffiliateNetwork;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_usd: number;
  average_cpc: number | null;
  average_cpm: number | null;
  created_at: string;
}

export interface Sponsorship {
  id: string;
  offer_id: string;
  sponsor_name: string;
  sponsor_website_url: string | null;
  pricing_model: "cpc" | "cpm" | "flat_daily";
  amount: number;
  currency: string;
  starts_at: string;
  ends_at: string;
  status: "active" | "paused" | "completed";
  reserved_position: number | null;
  impressions_goal: number | null;
  clicks_goal: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SponsorshipEvent {
  id: string;
  sponsorship_id: string;
  event_type: "impression" | "click";
  recorded_at: string;
}

export interface AffiliateDisclosureSettings {
  id: string;
  site_name: string;
  disclosure_text: string | null;
  privacy_policy_url: string | null;
  affiliate_policy_url: string | null;
  faq_url: string | null;
  show_disclosure_badge: boolean;
  show_network_attribution: boolean;
  updated_at: string;
}

export interface AffiliateNetworkConfig {
  id: string;
  affiliate_network: AffiliateNetwork;
  commission_percentage: number | null;
  min_revenue_threshold: number | null;
  payout_frequency: string;
  last_payout_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueMetrics {
  totalRevenue: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  averageCpc: number | null;
  averageCpm: number | null;
  conversionRate: number;
}

export interface NetworkRevenueMetrics extends RevenueMetrics {
  network: AffiliateNetwork;
  trend: "up" | "down" | "flat";
}
