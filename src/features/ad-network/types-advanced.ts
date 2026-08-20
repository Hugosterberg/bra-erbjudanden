// @ts-nocheck
export interface AuctionContext {
  placementId: string;
  sessionId: string;
  userGeo?: string;
  userDevice?: "mobile" | "tablet" | "desktop";
  timeOfDay?: number;
  dayOfWeek?: number;
  referrer?: string;
  pageUrl?: string;
}

export interface AuctionResult {
  winningCampaignId: string;
  winningCreativeId: string;
  bidAmount: number;
  runnerUpBid?: number;
  auctionTimeMs: number;
}

export interface TargetingRule {
  id: string;
  campaign_id: string;
  rule_type: "geo" | "device" | "time" | "weather" | "language" | "custom";
  rule_condition: Record<string, unknown>;
  bid_multiplier: number;
  active: boolean;
  created_at: string;
}

export interface PlacementPerformance {
  placement_id: string;
  date: string;
  viewability_score?: number;
  click_through_rate?: number;
  brand_safety_score?: number;
  fraud_rate?: number;
  overall_quality_score?: number;
}

export interface PublisherRevenueDaily {
  id: string;
  date: string;
  affiliate_revenue_sek: number;
  ad_network_revenue_sek: number;
  total_revenue_sek: number;
  affiliate_clicks: number;
  ad_impressions: number;
  ad_clicks: number;
  created_at: string;
}

export interface PublisherPerformanceDaily {
  id: string;
  date: string;
  total_visitors: number;
  unique_visitors: number;
  page_views: number;
  avg_session_duration_sec: number;
  bounce_rate: number;
  conversion_rate: number;
  created_at: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description?: string;
  segment_type: "lookalike" | "retargeting" | "behavioral" | "demographic";
  rules: Record<string, unknown>;
  size_estimate?: number;
  active: boolean;
  created_at: string;
}

export interface PlacementFloorPrice {
  id: string;
  placement_id: string;
  date: string;
  hour: number;
  base_floor_sek: number;
  dynamic_floor_sek: number;
  demand_index: number;
  impressions_delivered: number;
  capacity_used_percent: number;
  updated_at: string;
}

export interface CampaignBudgetPacing {
  id: string;
  campaign_id: string;
  date: string;
  budget_allocated_sek: number;
  budget_spent_sek: number;
  impressions_target: number;
  impressions_delivered: number;
  pace_multiplier: number;
  updated_at: string;
}

export interface RTBAuction {
  id: string;
  placement_id: string;
  session_id: string;
  user_context: Record<string, unknown>;
  auction_winners: string[];
  highest_bid: number;
  second_highest_bid?: number;
  winning_campaign_id?: string;
  winning_creative_id?: string;
  auction_time_ms?: number;
  auction_at: string;
}

export interface MarketplaceListings {
  id: string;
  placement_id: string;
  date_from: string;
  date_to: string;
  available_impressions: number;
  sold_impressions: number;
  base_price_sek: number;
  current_floor_sek: number;
  demand_level: "low" | "medium" | "high" | "very_high";
  status: "available" | "sold_out" | "reserved";
  created_at: string;
}

export interface AdComplianceReview {
  id: string;
  creative_id: string;
  reviewed_at: string;
  reviewer_id?: string;
  compliance_score?: number;
  brand_safety_score?: number;
  content_flags: string[];
  status: "approved" | "flagged" | "rejected";
  notes?: string;
  updated_at: string;
}

export interface YieldOptimizationResult {
  recommendedFloorPrice: number;
  estimatedDailyRevenue: number;
  recommendation: string;
}

export interface OptimalPriceResult {
  price: number;
  expectedVolume: number;
  expectedRevenue: number;
  confidence: number;
}

export interface AttributionResult {
  affiliate: { conversions: number; value: number; share: number };
  adNetwork: { conversions: number; value: number; share: number };
  combined: { conversions: number; value: number };
}

export interface RevenueForecast {
  affiliateRevenueForecast: number;
  adNetworkRevenueForecast: number;
  totalForecast: number;
  confidence: number;
}
