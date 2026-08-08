/**
 * Ad Network Module — Professional Programmatic Advertising
 *
 * Exports all ad network features:
 * - Campaign management & approval workflows
 * - Real-time bidding auctions
 * - Header bidding across multiple networks
 * - Smart bidding & fraud detection
 * - Webhooks & event notifications
 * - A/B testing & performance optimization
 * - Analytics & reporting
 */

// ===== TYPES =====
export type {
  AdvertiserStatus,
  PaymentMethod,
  CampaignType,
  PricingModel,
  CampaignStatus,
  CreativeType,
  CreativeStatus,
  PlacementType,
  PayoutStatus,
  AdvertiserAccount,
  AdCampaign,
  AdCreative,
  AdPlacement,
  AdImpression,
  AdClick,
  AdMetricsDaily,
  AdvertiserPayout,
  AdNetworkSettings,
  CampaignPerformance,
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
  findActivePlacements,
  findPlacementById,
  findCampaignsByPlacement,
  findCampaignById,
  findCreativesByCampaign,
  findCampaignMetrics,
  getAdvertiserStats,
  countDailyImpressions,
} from "./queries";

// ===== ACTIONS =====
export {
  registerAdvertiser,
  createAdCampaign,
  uploadAdCreative,
  recordAdImpression,
  recordAdClick,
  approveCampaign,
  approveCreative,
  pauseCampaign,
  resumeCampaign,
  approveAdvertiser,
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

// ===== CONVERSION TRACKING =====
export {
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

// ===== COMPONENTS =====
export { AdBanner } from "./components/ad-banner";
export { PublisherRevenueDashboard } from "./components/publisher-revenue-dashboard";
