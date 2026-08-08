"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";
import type { AdCampaign } from "./types";

export interface BidSuggestion {
  suggestedBid: number;
  reason: string;
  estimatedRoi: number | null;
  confidence: number;
}

/**
 * Smart bidding suggestions based on campaign performance
 * Uses historical data to recommend optimal bids
 */
export async function generateBidSuggestion(campaign: AdCampaign): Promise<BidSuggestion | null> {
  const client = createAdminClient();

  // Get last 7 days of metrics for this campaign
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: metrics, error } = await client
    .from("ad_metrics_daily")
    .select("impressions, clicks, spend_sek, cpm_sek")
    .eq("campaign_id", campaign.id)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error || !metrics || metrics.length === 0) {
    return null;
  }

  // Calculate average performance
  const avgCPM = metrics.reduce((sum, m) => sum + (m.cpm_sek || 0), 0) / metrics.length;
  const avgCTR = metrics.reduce((sum, m) => sum + ((m.clicks / m.impressions) * 100 || 0), 0) / metrics.length;

  // Get placement floor price
  const { data: placements } = await client
    .from("ad_placements")
    .select("base_cpm_sek, min_bid_sek")
    .eq("active", true);

  const avgFloorCPM = placements?.reduce((sum, p) => sum + (p.base_cpm_sek || 0), 0) / (placements?.length || 1) || 0.30;

  // Smart bidding algorithm
  let suggestedBid = campaign.bid_amount;
  let reason = "";
  let confidence = 0.7;

  if (avgCTR > 5) {
    // High CTR - increase bid to win more placements
    suggestedBid = avgCPM * 1.2;
    reason = "High CTR detected - increase bid to capture more impressions";
    confidence = 0.85;
  } else if (avgCTR < 1) {
    // Low CTR - lower bid to reduce waste
    suggestedBid = Math.max(avgFloorCPM, avgCPM * 0.7);
    reason = "Low CTR - reduce bid to improve efficiency";
    confidence = 0.75;
  } else if (avgCPM > campaign.bid_amount * 1.3) {
    // Paying too much - lower bid
    suggestedBid = avgCPM * 0.9;
    reason = "Actual CPM exceeding bid - lower bid to improve ROI";
    confidence = 0.8;
  } else if (avgCPM < campaign.bid_amount * 0.6) {
    // Getting good deal - maintain or increase
    suggestedBid = avgCPM * 1.1;
    reason = "Strong performance at current bid - slight increase recommended";
    confidence = 0.75;
  }

  // Estimate ROI (simple model - would be more complex in production)
  const estimatedRoi = avgCTR > 0 ? (avgCTR - 1) * 10 : null;

  return {
    suggestedBid: Math.round(suggestedBid * 100) / 100,
    reason,
    estimatedRoi,
    confidence,
  };
}

/**
 * Save bid suggestion to database
 */
export async function saveBidSuggestion(
  campaignId: string,
  suggestion: BidSuggestion,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client.from("bid_suggestions").insert([
      {
        campaign_id: campaignId,
        current_bid: (await getCampaignBid(campaignId)) || 0,
        suggested_bid: suggestion.suggestedBid,
        reason: suggestion.reason,
        estimated_roi: suggestion.estimatedRoi,
        confidence: suggestion.confidence,
        model_version: "v1",
      },
    ]);

    if (error) {
      console.error("Error saving bid suggestion:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error saving bid suggestion:", error);
    return { success: false, error: String(error) };
  }
}

async function getCampaignBid(campaignId: string): Promise<number | null> {
  const client = createAdminClient();
  const { data } = await client.from("ad_campaigns").select("bid_amount").eq("id", campaignId).single();
  return data?.bid_amount || null;
}

/**
 * Auto-apply bid suggestion (admin only)
 */
export async function autoOptimizeBid(campaignId: string): Promise<{ success: boolean; newBid?: number; error?: string }> {
  try {
    const client = createAdminClient();

    // Get campaign
    const { data: campaign } = await client.from("ad_campaigns").select("*").eq("id", campaignId).single();

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    // Generate suggestion
    const suggestion = await generateBidSuggestion(campaign);
    if (!suggestion) {
      return { success: false, error: "Not enough data to generate suggestion" };
    }

    // Apply bid (with safety limits)
    const minBid = campaign.bid_amount * 0.5;
    const maxBid = campaign.bid_amount * 2;
    const newBid = Math.max(minBid, Math.min(maxBid, suggestion.suggestedBid));

    const { error } = await client
      .from("ad_campaigns")
      .update({ bid_amount: newBid })
      .eq("id", campaignId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Save suggestion
    await saveBidSuggestion(campaignId, suggestion);

    return { success: true, newBid };
  } catch (error) {
    console.error("Unexpected error auto-optimizing bid:", error);
    return { success: false, error: String(error) };
  }
}
