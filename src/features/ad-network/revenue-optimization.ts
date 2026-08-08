"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";

/**
 * Yield management: optimize pricing to maximize revenue
 */
export async function optimizeYieldForPlacement(placementId: string): Promise<{
  recommendedFloorPrice: number;
  estimatedDailyRevenue: number;
  recommendation: string;
}> {
  const client = createAdminClient();

  // Get recent performance data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: dailyMetrics } = await client
    .from("ad_metrics_daily")
    .select("*")
    .eq("placement_id", placementId)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (!dailyMetrics || dailyMetrics.length === 0) {
    return {
      recommendedFloorPrice: 0.3,
      estimatedDailyRevenue: 0,
      recommendation: "Not enough data yet",
    };
  }

  // Calculate metrics
  const avgCPM = dailyMetrics.reduce((sum, m) => sum + (m.revenue_usd || 0), 0) / dailyMetrics.length;
  const avgImpressions = dailyMetrics.reduce((sum, m) => sum + (m.impressions || 0), 0) / dailyMetrics.length;
  const avgCTR = dailyMetrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / dailyMetrics.length;

  // Estimate optimal floor (80% of average CPM for mid-market)
  const recommendedFloor = avgCPM * 0.8;

  // Estimate revenue at this floor
  const estimatedImpressions = avgImpressions * 0.9; // Might lose some bids with higher floor
  const estimatedRevenue = (estimatedImpressions / 1000) * recommendedFloor;

  // Recommendation logic
  let recommendation = "Maintain current floor";

  if (avgCTR > 3) {
    recommendation = "High engagement! Consider raising floor by 20%";
  } else if (avgCTR < 0.5) {
    recommendation = "Low engagement. Consider lowering floor by 15%";
  }

  return {
    recommendedFloorPrice: recommendedFloor,
    estimatedDailyRevenue: estimatedRevenue,
    recommendation,
  };
}

/**
 * Calculate optimal price point using demand curve
 */
export async function calculateOptimalPrice(placementId: string): Promise<{
  price: number;
  expectedVolume: number;
  expectedRevenue: number;
  confidence: number;
}> {
  const client = createAdminClient();

  // Get historical prices and volumes
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: auctions } = await client
    .from("rtb_auctions")
    .select("highest_bid")
    .eq("placement_id", placementId)
    .gte("auction_at", thirtyDaysAgo.toISOString())
    .order("auction_at", { ascending: false });

  if (!auctions || auctions.length < 100) {
    return {
      price: 0.35,
      expectedVolume: 0,
      expectedRevenue: 0,
      confidence: 0.3,
    };
  }

  // Build demand curve
  const bids = auctions.map((a) => a.highest_bid).sort((a, b) => a - b);
  const median = bids[Math.floor(bids.length / 2)];
  const p75 = bids[Math.floor(bids.length * 0.75)];
  const p90 = bids[Math.floor(bids.length * 0.9)];

  // Simple demand model: price elasticity = -1.5 (typical for ads)
  // Higher price = fewer bids
  const optimalPrice = p75; // Around 75th percentile (sweet spot)

  // Estimate volume
  const avgBids = (median + p75 + p90) / 3;
  const estimatedWinRate = avgBids > 0 ? (bids.filter((b) => b >= optimalPrice).length / bids.length) * 100 : 0;

  return {
    price: optimalPrice,
    expectedVolume: Math.round(auctions.length * (estimatedWinRate / 100)),
    expectedRevenue: (auctions.length * (estimatedWinRate / 100)) * optimalPrice,
    confidence: 0.75,
  };
}

/**
 * Recommend placement price increases/decreases
 */
export async function recommendPriceAdjustment(placementId: string): Promise<{
  currentPrice: number;
  recommendedPrice: number;
  changePercent: number;
  reason: string;
  projectedRevenueChange: number;
}> {
  const client = createAdminClient();

  // Get current floor price
  const { data: placement } = await client
    .from("ad_placements")
    .select("base_cpm_sek")
    .eq("id", placementId)
    .single();

  const currentPrice = placement?.base_cpm_sek || 0.3;

  // Get optimal price
  const optimal = await calculateOptimalPrice(placementId);

  const changePercent = ((optimal.price - currentPrice) / currentPrice) * 100;

  let reason = "Price is optimal";
  if (changePercent > 10) {
    reason = "Strong demand! Can increase price and still maintain volume";
  } else if (changePercent < -10) {
    reason = "Weak demand. Lowering price will attract more advertisers";
  }

  const currentRevenue = (20000 / 1000) * currentPrice; // Assume 20k impressions
  const projectedRevenue = (20000 / 1000) * optimal.price;

  return {
    currentPrice,
    recommendedPrice: optimal.price,
    changePercent: Math.round(changePercent),
    reason,
    projectedRevenueChange: projectedRevenue - currentRevenue,
  };
}

/**
 * Multi-touch attribution: which channels drove conversions
 */
export async function attributeConversions(
  startDate: string,
  endDate: string,
): Promise<{
  affiliate: { conversions: number; value: number; share: number };
  adNetwork: { conversions: number; value: number; share: number };
  combined: { conversions: number; value: number };
}> {
  const client = createAdminClient();

  // Get affiliate conversions (from click tracking)
  const { data: affiliateClicks } = await client
    .from("click_events")
    .select("*")
    .gte("clicked_at", startDate)
    .lte("clicked_at", endDate);

  // Get ad conversions
  const { data: adConversions } = await client
    .from("ad_conversions")
    .select("*")
    .gte("recorded_at", startDate)
    .lte("recorded_at", endDate);

  const affiliateConversionValue = affiliateClicks?.reduce((sum, c) => sum + (c.conversion_value || 0), 0) || 0;
  const adConversionValue = adConversions?.reduce((sum, c) => sum + (c.conversion_value || 0), 0) || 0;
  const totalValue = affiliateConversionValue + adConversionValue;

  return {
    affiliate: {
      conversions: affiliateClicks?.length || 0,
      value: affiliateConversionValue,
      share: totalValue > 0 ? (affiliateConversionValue / totalValue) * 100 : 0,
    },
    adNetwork: {
      conversions: adConversions?.length || 0,
      value: adConversionValue,
      share: totalValue > 0 ? (adConversionValue / totalValue) * 100 : 0,
    },
    combined: {
      conversions: (affiliateClicks?.length || 0) + (adConversions?.length || 0),
      value: totalValue,
    },
  };
}

/**
 * Publisher revenue forecast
 */
export async function forecastPublisherRevenue(daysAhead: number = 30): Promise<{
  affiliateRevenueForecast: number;
  adNetworkRevenueForecast: number;
  totalForecast: number;
  confidence: number;
}> {
  const client = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get historical revenue
  const { data: historical } = await client
    .from("publisher_revenue_daily")
    .select("*")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (!historical || historical.length < 7) {
    return {
      affiliateRevenueForecast: 0,
      adNetworkRevenueForecast: 0,
      totalForecast: 0,
      confidence: 0,
    };
  }

  // Simple linear trend
  const firstWeek = historical.slice(0, 7);
  const lastWeek = historical.slice(-7);

  const avgFirstWeekAffiliate =
    firstWeek.reduce((sum, d) => sum + (d.affiliate_revenue_sek || 0), 0) / 7;
  const avgLastWeekAffiliate = lastWeek.reduce((sum, d) => sum + (d.affiliate_revenue_sek || 0), 0) / 7;

  const avgFirstWeekAds = firstWeek.reduce((sum, d) => sum + (d.ad_network_revenue_sek || 0), 0) / 7;
  const avgLastWeekAds = lastWeek.reduce((sum, d) => sum + (d.ad_network_revenue_sek || 0), 0) / 7;

  const affiliateTrend = (avgLastWeekAffiliate - avgFirstWeekAffiliate) / (7 * 7); // Daily change
  const adsTrend = (avgLastWeekAds - avgFirstWeekAds) / (7 * 7);

  // Extrapolate
  const affiliateForecast = avgLastWeekAffiliate + affiliateTrend * daysAhead;
  const adsForecast = avgLastWeekAds + adsTrend * daysAhead;

  return {
    affiliateRevenueForecast: Math.max(0, affiliateForecast),
    adNetworkRevenueForecast: Math.max(0, adsForecast),
    totalForecast: Math.max(0, affiliateForecast + adsForecast),
    confidence: 0.65,
  };
}
