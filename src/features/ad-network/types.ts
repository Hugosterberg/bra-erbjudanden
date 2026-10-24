export type AdvertiserStatus = "pending" | "approved" | "suspended" | "inactive";
export type PaymentMethod = "stripe" | "bank_transfer" | "invoice";
export type CampaignType = "banner" | "featured_offer" | "native" | "sidebar";
export type PricingModel = "cpm" | "cpc" | "daily_flat";
export type CampaignStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "active"
  | "paused"
  | "completed"
  | "rejected";
export type CreativeType = "image" | "text" | "video" | "html";
export type CreativeStatus = "pending_review" | "approved" | "rejected" | "archived";
export type PlacementType =
  | "homepage_banner"
  | "homepage_sidebar"
  | "category_hero"
  | "offer_card_sponsor"
  | "sidebar_vertical"
  | "footer_banner";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export interface AdvertiserAccount {
  id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  country: string;
  status: AdvertiserStatus;
  verification_token: string | null;
  verified_at: string | null;
  payment_method: PaymentMethod | null;
  stripe_customer_id: string | null;
  api_key: string;
  api_secret: string;
  monthly_budget_sek: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdCampaign {
  id: string;
  advertiser_id: string;
  name: string;
  description: string | null;
  target_url: string;
  status: CampaignStatus;
  campaign_type: CampaignType;
  pricing_model: PricingModel;
  bid_amount: number;
  currency: string;
  daily_budget_sek: number | null;
  total_budget_sek: number | null;
  starts_at: string;
  ends_at: string;
  target_categories: string[];
  target_regions: string[];
  auto_renew: boolean;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdCreative {
  id: string;
  campaign_id: string;
  name: string;
  creative_type: CreativeType;
  image_url: string | null;
  image_alt_text: string | null;
  headline: string | null;
  body_text: string | null;
  cta_text: string;
  html_content: string | null;
  video_url: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  status: CreativeStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdPlacement {
  id: string;
  name: string;
  description: string | null;
  placement_type: PlacementType;
  position_priority: number;
  width: number | null;
  height: number | null;
  max_daily_impressions: number | null;
  supported_formats: string[];
  base_cpm_sek: number | null;
  min_bid_sek: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdImpression {
  id: string;
  campaign_id: string;
  creative_id: string;
  placement_id: string | null;
  user_id: string | null;
  session_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referrer: string | null;
  page_url: string | null;
  recorded_at: string;
}

export interface AdClick {
  id: string;
  campaign_id: string;
  creative_id: string;
  impression_id: string | null;
  user_id: string | null;
  session_id: string | null;
  ip_hash: string | null;
  recorded_at: string;
}

export interface AdMetricsDaily {
  id: string;
  date: string;
  campaign_id: string;
  placement_id: string | null;
  impressions: number;
  clicks: number;
  spend_sek: number;
  ctr: number | null;
  cpc_sek: number | null;
}

export interface AdvertiserPayout {
  id: string;
  advertiser_id: string;
  payout_period_start: string;
  payout_period_end: string;
  total_impressions: number;
  total_clicks: number;
  total_spend_sek: number;
  platform_fee_sek: number | null;
  payout_amount_sek: number | null;
  status: PayoutStatus;
  payment_method: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AdNetworkSettings {
  id: string;
  platform_fee_percentage: number;
  min_campaign_budget_sek: number;
  max_daily_impressions: number;
  approval_required: boolean;
  auto_approve_by_score: boolean;
  approval_score_threshold: number | null;
  updated_at: string;
}

export interface CampaignPerformance {
  campaign_id: string;
  total_impressions: number;
  total_clicks: number;
  total_spend_sek: number;
  ctr: number;
  cpc_sek: number;
  cpm_sek: number;
  roi: number | null;
}
