import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { checkCampaignHealth } from "@/features/ad-network/campaign-alerts";
import { generateBidSuggestion, saveBidSuggestion } from "@/features/ad-network/smart-bidding";

interface MetricEntry {
  impressions: number;
  clicks: number;
  spend_sek: number;
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const client = createAdminClient();

    // 1. Check health of all active campaigns
    console.log("Checking campaign health...");
    const { data: campaigns } = await client
      .from("ad_campaigns")
      .select("*")
      .eq("status", "active")
      .gt("ends_at", new Date().toISOString());

    let healthChecked = 0;
    if (campaigns) {
      for (const campaign of campaigns) {
        try {
          await checkCampaignHealth(campaign);
          healthChecked++;
        } catch (error) {
          console.error(`Error checking health for campaign ${campaign.id}:`, error);
        }
      }
    }

    // 2. Generate bid suggestions for high-performing campaigns
    console.log("Generating bid suggestions...");
    let suggestionsGenerated = 0;
    if (campaigns) {
      for (const campaign of campaigns) {
        try {
          const suggestion = await generateBidSuggestion(campaign);
          if (suggestion) {
            await saveBidSuggestion(campaign.id, suggestion);
            suggestionsGenerated++;
          }
        } catch (error) {
          console.error(`Error generating suggestion for campaign ${campaign.id}:`, error);
        }
      }
    }

    // 3. Auto-pause underperforming campaigns
    console.log("Auto-pausing bad campaigns...");
    const pausedCount = await autoPauseCampaigns();

    // 4. Aggregate metrics for the day
    console.log("Aggregating daily metrics...");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    // Get impressions and clicks grouped by campaign and placement
    const { data: impressions } = await client
      .from("ad_impressions")
      .select("campaign_id, placement_id")
      .gte("recorded_at", `${dateStr}T00:00:00Z`)
      .lte("recorded_at", `${dateStr}T23:59:59Z`);

    const { data: clicks } = await client
      .from("ad_clicks")
      .select("campaign_id")
      .gte("recorded_at", `${dateStr}T00:00:00Z`)
      .lte("recorded_at", `${dateStr}T23:59:59Z`);

    const { data: spend } = await client
      .from("ad_campaigns")
      .select("id, bid_amount, pricing_model");

    // Build aggregated metrics
    const metricsMap = new Map<string, MetricEntry>();

    if (impressions) {
      impressions.forEach((imp: Record<string, unknown>) => {
        const key = `${imp.campaign_id}|${imp.placement_id}`;
        const existing = metricsMap.get(key) || { impressions: 0, clicks: 0, spend_sek: 0 };
        existing.impressions += 1;
        metricsMap.set(key, existing);
      });
    }

    if (clicks) {
      clicks.forEach((click: Record<string, unknown>) => {
        // Find all entries for this campaign and update clicks
        for (const [key, value] of metricsMap.entries()) {
          if (key.startsWith(click.campaign_id as string)) {
            value.clicks += 1;
          }
        }
      });
    }

    // Estimate spend (simplified - in production use actual transaction data)
    if (spend) {
      for (const campaign of spend) {
        for (const [key, value] of metricsMap.entries()) {
          if (key.startsWith(campaign.id)) {
            // Simple estimation based on impressions and bid
            if (campaign.pricing_model === "cpm") {
              value.spend_sek = (value.impressions / 1000) * campaign.bid_amount;
            } else if (campaign.pricing_model === "cpc") {
              value.spend_sek = value.clicks * campaign.bid_amount;
            }
          }
        }
      }
    }

    // Insert aggregated metrics
    let metricsInserted = 0;
    for (const [key, metrics] of metricsMap.entries()) {
      const [campaignId, placementId] = key.split("|");

      const { error } = await client.from("ad_metrics_daily").upsert(
        {
          date: dateStr,
          campaign_id: campaignId,
          placement_id: placementId || null,
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          spend_sek: metrics.spend_sek,
          ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : null,
          cpc_sek: metrics.clicks > 0 ? metrics.spend_sek / metrics.clicks : null,
        },
        { onConflict: "date,campaign_id,placement_id" },
      );

      if (!error) {
        metricsInserted++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        stats: {
          healthChecked,
          suggestionsGenerated,
          campaignsPaused: pausedCount,
          metricsAggregated: metricsInserted,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in ad network maintenance cron:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
