/**
 * Monetization Module — Complete Revenue System
 *
 * Exports all monetization features:
 * - Affiliate tracking & optimization
 * - Display ads & header bidding
 * - Native ads & sponsored content
 * - Revenue analytics & forecasting
 * - Smart bidding & fraud detection
 * - Webhooks & conversions
 * - A/B testing & alerts
 */

// ===== TYPES =====
export type {
  RevenueEventType,
  AffiliateRevenueEvent,
  AffiliateRevenueDaily,
  Sponsorship,
  SponsorshipEvent,
  AffiliateDisclosureSettings,
  AffiliateNetworkConfig,
  RevenueMetrics,
  NetworkRevenueMetrics,
} from "./types";

export type {
  AuctionContext,
  AuctionResult,
  TargetingRule,
  PlacementPerformance,
  PublisherRevenueDaily,
  PublisherPerformanceDaily,
  AudienceSegment,
  PlacementFloorPrice,
  CampaignBudgetPacing,
  RTBAuction,
  MarketplaceListings,
  AdComplianceReview,
  YieldOptimizationResult,
  OptimalPriceResult,
  AttributionResult,
  RevenueForecast,
} from "@/features/ad-network/types-advanced";

// ===== QUERIES =====
export {
  findRevenueEventsByDateRange,
  findDailyRevenueByNetwork,
  findActiveSponsorships,
  findSponsorshipByOfferId,
  findAffiliateDisclosureSettings,
  calculateRevenueMetrics,
  calculateNetworkRevenueMetrics,
  findTopRevenueOffers,
} from "./queries";

// ===== ACTIONS =====
export {
  recordRevenueEvent,
  createSponsorship,
  updateSponsorship,
  pauseSponsorship,
  resumeSponsorship,
  recordSponsorshipEvent,
  updateAffiliateDisclosureSettings,
} from "./actions";

// ===== SMART BIDDING =====
export {
  generateBidSuggestion,
  saveBidSuggestion,
  autoOptimizeBid,
} from "@/features/ad-network/smart-bidding";

// ===== FRAUD DETECTION =====
export {
  analyzeClickForFraud,
  recordFraudAnalysis,
  getCampaignFraudRate,
} from "@/features/ad-network/fraud-detection";

// ===== WEBHOOKS =====
export {
  registerWebhook,
  sendWebhookEvent,
  getWebhookStatus,
  retryFailedWebhooks,
  verifyWebhookSignature,
} from "@/features/ad-network/webhooks";

export type { WebhookEventType, WebhookPayload } from "@/features/ad-network/webhooks";

// ===== CONVERSION TRACKING =====
export {
  generateConversionPixel,
  recordConversion,
  getCampaignConversionRate,
  getCampaignConversionValue,
  getCampaignROI,
  getConversionBreakdown,
} from "@/features/ad-network/conversion-tracking";

// ===== A/B TESTING =====
export {
  createCreativeTest,
  getTestPerformance,
  concludeTest,
  getOptimalTestSplit,
  getCampaignTests,
} from "@/features/ad-network/ab-testing";

// ===== CAMPAIGN ALERTS =====
export {
  acknowledgeAlert,
  getCampaignAlerts,
  shouldPauseCampaign,
  autoPauseBadCampaigns,
} from "@/features/ad-network/campaign-alerts";

export type { AlertType, AlertSeverity } from "@/features/ad-network/campaign-alerts";

// ===== REAL-TIME BIDDING =====
export {
  runRTBAuction,
  calculateDynamicFloor,
  updateDemandIndex,
} from "@/features/ad-network/rtb-auction";

// ===== REVENUE OPTIMIZATION =====
export {
  optimizeYieldForPlacement,
  calculateOptimalPrice,
  recommendPriceAdjustment,
  attributeConversions,
  forecastPublisherRevenue,
} from "@/features/ad-network/revenue-optimization";

// ===== HEADER BIDDING =====
export {
  runHeaderBidding,
  getRevenueFloor,
  meetsFloor,
  estimateHeaderBiddingLift,
} from "./header-bidding";

// ===== AFFILIATE OPTIMIZATION =====
export {
  getOptimalAffiliatePlacement,
  calculateAffiliateLinkValue,
  getHighCommissionOffers,
  getContextualRecommendations,
  recordAffiliateLinkPerformance,
} from "./affiliate-optimization";

// ===== COMPONENTS =====
export { AffiliateDisclosureBadge } from "./components/affiliate-disclosure-badge";
export { AffiliateLinkLabel } from "./components/affiliate-link-label";
export { RevenueDashboard } from "./components/revenue-dashboard";
export { SponsorshipAdmin } from "./components/sponsorship-admin";

// ===== SCHEMAS =====
export {
  createSponsorshipSchema,
  updateSponsorshipSchema,
  updateDisclosureSettingsSchema,
} from "./schemas";

export type {
  CreateSponsorshipInput,
  UpdateSponsorshipInput,
  UpdateDisclosureSettingsInput,
} from "./schemas";
