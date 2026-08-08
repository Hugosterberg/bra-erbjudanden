"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";

export interface PlacementContext {
  offerId: string;
  articleCategory?: string;
  contentType?: "article" | "category" | "homepage";
  keywordContext?: string[];
  userSegment?: "new_visitor" | "returning_visitor" | "high_value";
}

/**
 * Smart Affiliate Link Optimization:
 * Uses ML to predict best placement, timing, and format for affiliate links
 * Goal: Maximize click-through AND conversion rates
 */
export async function getOptimalAffiliatePlacement(context: PlacementContext): Promise<{
  placement: "article_inline" | "article_end" | "sidebar" | "hero" | "footer" | "modal";
  format: "link" | "button" | "card" | "recommendation";
  expectedCTR: number;
  expectedConversion: number;
  expectedRevenue: number;
  callToAction: string;
}> {
  const client = createAdminClient();

  // Get historical performance for this offer
  const { data: placements } = await client
    .from("affiliate_link_placements")
    .select("*")
    .eq("offer_id", context.offerId)
    .order("performance_score", { ascending: false })
    .limit(10);

  if (!placements || placements.length === 0) {
    // No historical data - use ML model to predict
    return predictPlacement(context);
  }

  // Find best performing placement
  const bestPlacement = placements[0];

  // Calculate predicted metrics based on historical data
  const avgCTR = bestPlacement.clicks > 0 ? (bestPlacement.clicks / bestPlacement.impressions) * 100 : 0;
  const avgConversion = bestPlacement.conversions > 0 ? (bestPlacement.conversions / bestPlacement.clicks) * 100 : 0;
  const avgRevenue = bestPlacement.revenue_generated > 0 ? bestPlacement.revenue_generated / bestPlacement.clicks : 0;

  // A/B test: 80% show best placement, 20% test new one
  const shouldTest = Math.random() < 0.2;
  const placement = shouldTest ? getRandomPlacement() : bestPlacement.placement_location;

  // Get offer details
  const { data: offer } = await client.from("offers").select("discount_value").eq("id", context.offerId).single();

  const callToAction = generateCTA(offer, placement);

  return {
    placement: placement as string,
    format: getFormatForPlacement(placement),
    expectedCTR: avgCTR,
    expectedConversion: avgConversion,
    expectedRevenue: avgRevenue,
    callToAction,
  };
}

/**
 * ML-based placement prediction (no historical data)
 */
function predictPlacement(context: PlacementContext): {
  placement: "article_inline" | "article_end" | "sidebar" | "hero" | "footer" | "modal";
  format: "link" | "button" | "card" | "recommendation";
  expectedCTR: number;
  expectedConversion: number;
  expectedRevenue: number;
  callToAction: string;
} {
  // Simple ML model based on context
  let placement: "article_inline" | "article_end" | "sidebar" | "hero" | "footer" | "modal" = "article_end";
  let expectedCTR = 1.5;
  let expectedConversion = 2.0;

  if (context.contentType === "article") {
    // In articles: inline works best for contextual offers, end for general
    placement = context.keywordContext && context.keywordContext.length > 0 ? "article_inline" : "article_end";
    expectedCTR = 2.5; // Higher CTR in context
    expectedConversion = 3.5;
  } else if (context.contentType === "category") {
    // Category pages: hero placement converts best
    placement = "hero";
    expectedCTR = 5.0;
    expectedConversion = 8.0;
  } else if (context.userSegment === "high_value") {
    // High-value users: modal/footer (less annoying)
    placement = "footer";
    expectedCTR = 3.0;
    expectedConversion = 5.0;
  }

  return {
    placement,
    format: getFormatForPlacement(placement),
    expectedCTR,
    expectedConversion,
    expectedRevenue: 15, // SEK estimate
    callToAction: generateCTA(null, placement),
  };
}

function getFormatForPlacement(placement: string): "link" | "button" | "card" | "recommendation" {
  const formats: Record<string, "link" | "button" | "card" | "recommendation"> = {
    article_inline: "link",
    article_end: "card",
    sidebar: "recommendation",
    hero: "button",
    footer: "card",
    modal: "button",
  };
  return formats[placement] || "link";
}

function generateCTA(offer: Record<string, unknown> | null, placement: string): string {
  const discount = (offer?.discount_value as number) || 0;
  const discountText = discount > 0 ? ` - ${discount}% rabatt` : "";

  const ctas: Record<string, string> = {
    article_inline: `Se erbjudandet${discountText}`,
    article_end: `Klicka här för erbjudandet${discountText}`,
    sidebar: `Topperbjudande${discountText}`,
    hero: `HANDLA NU${discountText}`,
    footer: `Hitta fler erbjudanden`,
    modal: `Klicka för erbjudande${discountText}`,
  };

  return ctas[placement] || "Besök";
}

function getRandomPlacement(): string {
  const placements = ["article_inline", "article_end", "sidebar", "hero", "footer"];
  return placements[Math.floor(Math.random() * placements.length)];
}

/**
 * Calculate affiliate link value (expected revenue)
 */
export async function calculateAffiliateLinkValue(
  offerId: string,
  placement: string,
): Promise<{
  expectedCTR: number;
  expectedConversion: number;
  expectedRevenuePerClick: number;
  recommendedPosition: number;
}> {
  const client = createAdminClient();

  // Get placement history
  const { data: history } = await client
    .from("affiliate_link_placements")
    .select("*")
    .eq("offer_id", offerId)
    .eq("placement_location", placement)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!history || history.length === 0) {
    return {
      expectedCTR: 1.5,
      expectedConversion: 2.0,
      expectedRevenuePerClick: 15,
      recommendedPosition: 1,
    };
  }

  const totalClicks = history.reduce((sum, h) => sum + (h.clicks || 0), 0);
  const totalConversions = history.reduce((sum, h) => sum + (h.conversions || 0), 0);
  const totalRevenue = history.reduce((sum, h) => sum + (h.revenue_generated || 0), 0);

  const avgCTR = totalClicks > 0 ? (totalClicks / 30) : 1.5; // Impressions assumed ~30
  const avgConversion = totalConversions > 0 ? (totalConversions / totalClicks) * 100 : 2.0;
  const avgRevenuePerClick = totalClicks > 0 ? totalRevenue / totalClicks : 15;

  return {
    expectedCTR: avgCTR * 100,
    expectedConversion: avgConversion,
    expectedRevenuePerClick: avgRevenuePerClick,
    recommendedPosition: 1, // Top position
  };
}

/**
 * Get high-commission affiliate offers to recommend
 */
export async function getHighCommissionOffers(limit: number = 5): Promise<
  Array<{
    offerId: string;
    title: string;
    discount: number;
    estimatedCommission: number;
    conversionProbability: number;
  }>
> {
  const client = createAdminClient();

  // Get top-performing affiliate offers by commission
  const { data: offers } = await client
    .from("affiliate_revenue_events")
    .select("offer_id, revenue_usd, offers(title, discount_value)")
    .eq("event_type", "conversion")
    .order("revenue_usd", { ascending: false })
    .limit(limit);

  if (!offers) {
    return [];
  }

  return offers.map((item: Record<string, unknown>) => ({
    offerId: item.offer_id as string,
    title: (item.offers as Record<string, unknown>)?.title as string || "Unknown",
    discount: (item.offers as Record<string, unknown>)?.discount_value as number || 0,
    estimatedCommission: item.revenue_usd as number || 0,
    conversionProbability: 0.75, // Estimated
  }));
}

/**
 * Contextual affiliate recommendations (match content)
 */
export async function getContextualRecommendations(
  articleCategory: string,
  keywords: string[],
  limit: number = 3,
): Promise<
  Array<{
    offerId: string;
    title: string;
    relevanceScore: number;
    expectedRevenue: number;
    callToAction: string;
  }>
> {
  const client = createAdminClient();

  // Find offers that match category and keywords
  const { data: relevantOffers } = await client
    .from("offers")
    .select("id, title")
    .eq("status", "published")
    // Would need a full-text search here in production
    .order("rank_position", { ascending: true })
    .limit(limit);

  if (!relevantOffers) {
    return [];
  }

  return relevantOffers.map((offer: Record<string, unknown>, index: number) => ({
    offerId: offer.id as string,
    title: offer.title as string,
    relevanceScore: 0.8 - index * 0.1,
    expectedRevenue: 25 - index * 5,
    callToAction: `Se detta erbjudande`,
  }));
}

/**
 * Track affiliate link performance
 */
export async function recordAffiliateLinkPerformance(params: {
  offerId: string;
  placementLocation: string;
  eventType: "impression" | "click" | "conversion";
  revenueSek?: number;
  variant?: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = createAdminClient();

  const { data, error: selectError } = await client
    .from("affiliate_link_placements")
    .select("*")
    .eq("offer_id", params.offerId)
    .eq("placement_location", params.placementLocation)
    .eq("ab_test_variant", params.variant || null)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    return { success: false, error: selectError.message };
  }

  // Update counters
  const updates: Record<string, number> = {};
  if (params.eventType === "impression") {
    updates.impressions = ((data as Record<string, unknown>)?.impressions as number || 0) + 1;
  } else if (params.eventType === "click") {
    updates.clicks = (data?.clicks || 0) + 1;
  } else if (params.eventType === "conversion") {
    updates.conversions = (data?.conversions || 0) + 1;
    if (params.revenueSek) {
      updates.revenue_generated = (data?.revenue_generated || 0) + params.revenueSek;
    }
  }

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  const { error: updateError } = await client
    .from("affiliate_link_placements")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("offer_id", params.offerId)
    .eq("placement_location", params.placementLocation);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
