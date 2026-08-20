// @ts-nocheck
"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";

export interface AuctionContext {
  placementId: string;
  sessionId: string;
  userGeo?: string;
  userDevice?: "mobile" | "tablet" | "desktop";
  timeOfDay?: number; // 0-23
  dayOfWeek?: number; // 0-6
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

/**
 * Real-time bidding auction engine
 * Runs instantly when ad slot needs to be filled
 */
export async function runRTBAuction(context: AuctionContext): Promise<AuctionResult | null> {
  const startTime = Date.now();
  const client = createAdminClient();

  try {
    // 1. Get all active campaigns that can bid for this placement
    const { data: campaigns } = await client
      .from("ad_campaigns")
      .select("*")
      .eq("status", "active")
      .lt("starts_at", new Date().toISOString())
      .gt("ends_at", new Date().toISOString());

    if (!campaigns || campaigns.length === 0) {
      return null;
    }

    // 2. For each campaign, calculate adjusted bid based on targeting
    const bids: Array<{
      campaignId: string;
      creativeId: string;
      baseBid: number;
      adjustedBid: number;
      multipliers: { geo?: number; device?: number; time?: number };
    }> = [];

    for (const campaign of campaigns) {
      // Get creatives for campaign
      const { data: creatives } = await client
        .from("ad_creatives")
        .select("id")
        .eq("campaign_id", campaign.id)
        .eq("status", "approved")
        .limit(1);

      if (!creatives || creatives.length === 0) {
        continue;
      }

      // Get targeting rules
      const { data: rules } = await client
        .from("ad_targeting_rules")
        .select("*")
        .eq("campaign_id", campaign.id)
        .eq("active", true);

      // Calculate bid multiplier based on targeting
      let bidMultiplier = 1.0;
      const multipliers: Record<string, number> = {};

      if (rules) {
        for (const rule of rules) {
          const condition = rule.rule_condition as Record<string, unknown>;

          // Check geo targeting
          if (rule.rule_type === "geo" && context.userGeo) {
            if (matchesGeoCondition(context.userGeo, condition)) {
              bidMultiplier *= rule.bid_multiplier;
              multipliers.geo = rule.bid_multiplier;
            }
          }

          // Check device targeting
          if (rule.rule_type === "device" && context.userDevice) {
            if (matchesDeviceCondition(context.userDevice, condition)) {
              bidMultiplier *= rule.bid_multiplier;
              multipliers.device = rule.bid_multiplier;
            }
          }

          // Check time targeting
          if (rule.rule_type === "time" && context.timeOfDay !== undefined) {
            if (matchesTimeCondition(context.timeOfDay, condition)) {
              bidMultiplier *= rule.bid_multiplier;
              multipliers.time = rule.bid_multiplier;
            }
          }
        }
      }

      const adjustedBid = campaign.bid_amount * bidMultiplier;

      // Check daily budget pacing
      const pacing = await getBudgetPacing(campaign.id);
      if (pacing && pacing.pace_multiplier) {
        const finalBid = adjustedBid * pacing.pace_multiplier;
        bids.push({
          campaignId: campaign.id,
          creativeId: creatives[0].id,
          baseBid: campaign.bid_amount,
          adjustedBid: finalBid,
          multipliers,
        });
      } else {
        bids.push({
          campaignId: campaign.id,
          creativeId: creatives[0].id,
          baseBid: campaign.bid_amount,
          adjustedBid,
          multipliers,
        });
      }
    }

    if (bids.length === 0) {
      return null;
    }

    // 3. Sort by adjusted bid (highest wins)
    bids.sort((a, b) => b.adjustedBid - a.adjustedBid);

    const winner = bids[0];
    const runnerUp = bids[1];

    // 4. Record auction
    const auctionTimeMs = Date.now() - startTime;

    await client.from("rtb_auctions").insert([
      {
        placement_id: context.placementId,
        session_id: context.sessionId,
        user_context: {
          geo: context.userGeo,
          device: context.userDevice,
          timeOfDay: context.timeOfDay,
          dayOfWeek: context.dayOfWeek,
          referrer: context.referrer,
          pageUrl: context.pageUrl,
        },
        auction_winners: [winner.campaignId],
        highest_bid: winner.adjustedBid,
        second_highest_bid: runnerUp?.adjustedBid,
        winning_campaign_id: winner.campaignId,
        winning_creative_id: winner.creativeId,
        auction_time_ms: auctionTimeMs,
      },
    ]);

    return {
      winningCampaignId: winner.campaignId,
      winningCreativeId: winner.creativeId,
      bidAmount: winner.adjustedBid,
      runnerUpBid: runnerUp?.adjustedBid,
      auctionTimeMs,
    };
  } catch (error) {
    console.error("Error running RTB auction:", error);
    return null;
  }
}

/**
 * Dynamic floor price adjustment based on demand
 */
export async function calculateDynamicFloor(placementId: string): Promise<number> {
  const client = createAdminClient();

  const today = new Date().toISOString().split("T")[0];
  const hour = new Date().getHours();

  // Get historical floor price
  const { data: historical } = await client
    .from("placement_floor_prices")
    .select("base_floor_sek, demand_index")
    .eq("placement_id", placementId)
    .eq("date", today)
    .eq("hour", hour)
    .single();

  if (!historical) {
    // Get base floor from placement
    const { data: placement } = await client
      .from("ad_placements")
      .select("base_cpm_sek")
      .eq("id", placementId)
      .single();

    return placement?.base_cpm_sek || 0.30;
  }

  // Calculate dynamic floor = base * (1 + demand adjustment)
  const demandAdjustment = (historical.demand_index - 1) * 0.1; // Max ±10% adjustment
  const dynamicFloor = historical.base_floor_sek * (1 + demandAdjustment);

  return Math.max(historical.base_floor_sek * 0.5, Math.min(dynamicFloor, historical.base_floor_sek * 2));
}

/**
 * Update demand index based on auction activity
 */
export async function updateDemandIndex(placementId: string): Promise<void> {
  const client = createAdminClient();

  const today = new Date().toISOString().split("T")[0];
  const hour = new Date().getHours();

  // Get auction count this hour
  const { count: auctionCount } = await client
    .from("rtb_auctions")
    .select("*", { count: "exact", head: true })
    .eq("placement_id", placementId)
    .gte("auction_at", `${today}T${hour.toString().padStart(2, "0")}:00:00Z`)
    .lt("auction_at", `${today}T${(hour + 1).toString().padStart(2, "0")}:00:00Z`);

  // Get placement capacity
  const { data: placement } = await client
    .from("ad_placements")
    .select("max_daily_impressions")
    .eq("id", placementId)
    .single();

  const hourlyCapacity = (placement?.max_daily_impressions || 10000) / 24;
  const demandRatio = (auctionCount || 0) / (hourlyCapacity * 0.1); // Target 10% of hourly capacity for auctions
  const demandIndex = Math.max(0.5, Math.min(2.0, demandRatio));

  // Update floor prices table
  await client.from("placement_floor_prices").upsert(
    {
      placement_id: placementId,
      date: today,
      hour,
      demand_index: demandIndex,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "placement_id,date,hour" },
  );
}

// === Helper Functions ===

function matchesGeoCondition(userGeo: string, condition: Record<string, unknown>): boolean {
  if (condition.country && condition.country !== userGeo.split(",")[0]) {
    return false;
  }
  if (condition.region && condition.region !== userGeo.split(",")[1]) {
    return false;
  }
  return true;
}

function matchesDeviceCondition(userDevice: string, condition: Record<string, unknown>): boolean {
  if (condition.devices && Array.isArray(condition.devices) && !condition.devices.includes(userDevice)) {
    return false;
  }
  return true;
}

function matchesTimeCondition(timeOfDay: number, condition: Record<string, unknown>): boolean {
  if (condition.hourStart !== undefined && timeOfDay < (condition.hourStart as number)) {
    return false;
  }
  if (condition.hourEnd !== undefined && timeOfDay > (condition.hourEnd as number)) {
    return false;
  }
  if (condition.daysOfWeek && Array.isArray(condition.daysOfWeek) && !condition.daysOfWeek.includes(new Date().getDay())) {
    return false;
  }
  return true;
}

interface BudgetPacing {
  pace_multiplier?: number;
}

async function getBudgetPacing(campaignId: string): Promise<BudgetPacing | null> {
  const client = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await client
    .from("campaign_budget_pacing")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("date", today)
    .single();

  return data;
}
