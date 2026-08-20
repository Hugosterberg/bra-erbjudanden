// @ts-nocheck
"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type {
  AdCampaign,
  AdCreative,
  AdPlacement,
  CampaignPerformance,
} from "./types";

export async function findActivePlacements(): Promise<AdPlacement[]> {
  const client = createClient();

  const { data, error } = await client
    .from("ad_placements")
    .select("*")
    .eq("active", true)
    .order("position_priority", { ascending: true });

  if (error) {
    console.error("Error fetching placements:", error);
    return [];
  }

  return data || [];
}

export async function findPlacementById(placementId: string): Promise<AdPlacement | null> {
  const client = createClient();

  const { data, error } = await client
    .from("ad_placements")
    .select("*")
    .eq("id", placementId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching placement:", error);
  }

  return data || null;
}

export async function findCampaignsByPlacement(): Promise<AdCampaign[]> {
  const client = createClient();

  // Find active campaigns
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("ad_campaigns")
    .select("*")
    .eq("status", "active")
    .lte("starts_at", now)
    .gt("ends_at", now)
    .order("bid_amount", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }

  return data || [];
}

export async function findCampaignById(campaignId: string): Promise<AdCampaign | null> {
  const client = createClient();

  const { data, error } = await client
    .from("ad_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching campaign:", error);
  }

  return data || null;
}

export async function findCreativesByCampaign(campaignId: string): Promise<AdCreative[]> {
  const client = createClient();

  const { data, error } = await client
    .from("ad_creatives")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching creatives:", error);
    return [];
  }

  return data || [];
}

export async function findCampaignMetrics(
  campaignId: string,
  startDate: string,
  endDate: string,
): Promise<CampaignPerformance | null> {
  const client = createClient();

  const { data, error } = await client
    .from("ad_metrics_daily")
    .select("impressions, clicks, spend_sek")
    .eq("campaign_id", campaignId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Error fetching campaign metrics:", error);
    return null;
  }

  const metrics = data || [];
  if (metrics.length === 0) {
    return null;
  }

  const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
  const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
  const totalSpend = metrics.reduce((sum, m) => sum + (m.spend_sek || 0), 0);

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

  return {
    campaign_id: campaignId,
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    total_spend_sek: totalSpend,
    ctr,
    cpc_sek: cpc,
    cpm_sek: cpm,
    roi: null, // Requires conversion tracking
  };
}

export async function getAdvertiserStats(
  advertiserId: string,
  startDate: string,
  endDate: string,
): Promise<{
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  campaigns: number;
}> {
  const client = createClient();

  const [campaignsData, metricsData] = await Promise.all([
    client
      .from("ad_campaigns")
      .select("id")
      .eq("advertiser_id", advertiserId)
      .eq("status", "active"),
    client
      .from("ad_metrics_daily")
      .select("impressions, clicks, spend_sek")
      .gte("date", startDate)
      .lte("date", endDate)
      .in(
        "campaign_id",
        [
          // Will be populated from campaigns query
        ],
      ),
  ]);

  if (campaignsData.error || metricsData.error) {
    console.error("Error fetching advertiser stats:", campaignsData.error || metricsData.error);
    return {
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      campaigns: 0,
    };
  }

  const campaigns = campaignsData.data || [];
  const metrics = metricsData.data || [];

  const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
  const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
  const totalSpend = metrics.reduce((sum, m) => sum + (m.spend_sek || 0), 0);

  return {
    totalImpressions,
    totalClicks,
    totalSpend,
    campaigns: campaigns.length,
  };
}

export async function countDailyImpressions(
  campaignId: string,
  placementId?: string,
): Promise<number> {
  const client = createClient();
  const today = new Date().toISOString().split("T")[0];

  let query = client
    .from("ad_metrics_daily")
    .select("impressions")
    .eq("campaign_id", campaignId)
    .eq("date", today);

  if (placementId) {
    query = query.eq("placement_id", placementId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    console.error("Error counting impressions:", error);
  }

  return data?.impressions || 0;
}
