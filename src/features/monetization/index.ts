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
} from "./types-advanced";

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
} from "./smart-bidding";

// ===== FRAUD DETECTION =====
export {
  analyzeClickForFraud,
  recordFraudAnalysis,
  getCampaignFraudRate,
} from "./fraud-detection";

// ===== WEBHOOKS =====
export {
  registerWebhook,
  sendWebhookEvent,
  getWebhookStatus,
  retryFailedWebhooks,
  verifyWebhookSignature,
} from "./webhooks";

export type { WebhookEventType, WebhookPayload } from "./webhooks";

// ===== CONVERSION TRACKING =====
export {
  generateConversionPixel,
  recordConversion,
  getCampaignConversionRate,
  getCampaignConversionValue,
  getCampaignROI,
  getConversionBreakdown,
} from "./conversion-tracking";

// ===== A/B TESTING =====
export {
  createCreativeTest,
  getTestPerformance,
  concludeTest,
  getOptimalTestSplit,
  getCampaignTests,
} from "./ab-testing";

// ===== CAMPAIGN ALERTS =====
export {
  acknowledgeAlert,
  getCampaignAlerts,
  shouldPauseCampaign,
  autoPauseBadCampaigns,
} from "./campaign-alerts";

export type { AlertType, AlertSeverity } from "./campaign-alerts";

// ===== REAL-TIME BIDDING =====
export {
  runRTBAuction,
  calculateDynamicFloor,
  updateDemandIndex,
} from "./rtb-auction";

// ===== REVENUE OPTIMIZATION =====
export {
  optimizeYieldForPlacement,
  calculateOptimalPrice,
  recommendPriceAdjustment,
  attributeConversions,
  forecastPublisherRevenue,
} from "./revenue-optimization";

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
export { PublisherRevenueDashboard } from "./components/publisher-revenue-dashboard";

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
