"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";

export interface HeaderBidRequest {
  placementId: string;
  width: number;
  height: number;
  userContext?: {
    country?: string;
    device?: string;
    pageUrl?: string;
    referrer?: string;
  };
}

export interface BidResponse {
  networkId: string;
  networkName: string;
  bidAmount: number;
  ttl: number;
  dealId?: string;
  adMarkup?: string;
}

/**
 * Header Bidding: Run parallel auctions across multiple ad networks
 * Winner gets to display ad
 * Generates 30-50% more revenue than single network
 */
export async function runHeaderBidding(request: HeaderBidRequest): Promise<BidResponse | null> {
  const startTime = Date.now();
  const client = createAdminClient();

  try {
    // 1. Get all active ad networks for this placement
    const { data: bidConfigs } = await client
      .from("header_bidding_config")
      .select(`
        *,
        ad_networks(id, name, api_key)
      `)
      .eq("placement_id", request.placementId)
      .eq("active", true);

    if (!bidConfigs || bidConfigs.length === 0) {
      return null; // Fallback to house ads
    }

    // 2. Run parallel bids to all networks
    const bidPromises = bidConfigs.map((config: Record<string, unknown>) =>
      fetchBidFromNetwork(
        config.ad_networks as Record<string, unknown>,
        {
          width: request.width,
          height: request.height,
          floorPrice: config.floor_price as number | undefined,
          bidModifier: config.bid_modifier as number,
        },
        request.userContext,
      ),
    );

    const bids = await Promise.all(bidPromises);

    // 3. Filter valid bids and sort by amount
    const validBids = bids.filter((bid) => bid && bid.bidAmount > 0).sort((a, b) => b!.bidAmount - a!.bidAmount);

    if (validBids.length === 0) {
      return null;
    }

    const winner = validBids[0]!;
    const runnerUp = validBids[1];

    // 4. Record header bidding auction
    const auctionTimeMs = Date.now() - startTime;

    await client.from("rtb_auctions").insert([
      {
        placement_id: request.placementId,
        session_id: `header-bid-${Date.now()}`,
        user_context: request.userContext || {},
        auction_winners: [winner.networkId],
        highest_bid: winner.bidAmount,
        second_highest_bid: runnerUp?.bidAmount,
        auction_time_ms: auctionTimeMs,
      },
    ]);

    return winner;
  } catch (error) {
    console.error("Error running header bidding:", error);
    return null;
  }
}

async function fetchBidFromNetwork(
  network: Record<string, unknown>,
  adParams: {
    width: number;
    height: number;
    floorPrice?: number;
    bidModifier: number;
  },
): Promise<BidResponse | null> {
  try {
    // Simulate API call to ad network
    // In production, would call actual network APIs (Google AdSense, OpenX, Rubicon, AppNexus, etc)

    const networkBids: Record<string, () => Promise<BidResponse | null>> = {
      google_adsense: async () => ({
        networkId: network.id,
        networkName: "Google AdSense",
        bidAmount: 0.35 * (adParams.bidModifier || 1),
        ttl: 60000,
      }),
      openx: async () => ({
        networkId: network.id,
        networkName: "OpenX",
        bidAmount: 0.32 * (adParams.bidModifier || 1),
        ttl: 60000,
      }),
      rubicon: async () => ({
        networkId: network.id,
        networkName: "Rubicon Project",
        bidAmount: 0.38 * (adParams.bidModifier || 1),
        ttl: 60000,
      }),
      appnexus: async () => ({
        networkId: network.id,
        networkName: "AppNexus",
        bidAmount: 0.33 * (adParams.bidModifier || 1),
        ttl: 60000,
      }),
    };

    const bidFn = networkBids[network.name.toLowerCase().replace(" ", "_")];
    if (bidFn) {
      return await bidFn();
    }

    return null;
  } catch (error) {
    console.error(`Error fetching bid from ${network.name}:`, error);
    return null;
  }
}

/**
 * Get revenue floor (don't sell below this price)
 */
export async function getRevenueFloor(placementId: string, country?: string): Promise<{
  minCpm?: number;
  minCpc?: number;
}> {
  const client = createAdminClient();

  const { data } = await client
    .from("revenue_floor_rules")
    .select("min_cpm, min_cpc")
    .eq("placement_id", placementId)
    .eq("country", country || null)
    .eq("effective_from", new Date().toISOString().split("T")[0])
    .lte("effective_from", new Date().toISOString().split("T")[0])
    .gte("effective_until", new Date().toISOString().split("T")[0])
    .order("priority", { ascending: true })
    .limit(1)
    .single();

  return {
    minCpm: data?.min_cpm,
    minCpc: data?.min_cpc,
  };
}

/**
 * Check if bid meets floor price
 */
export function meetsFloor(bidAmount: number, floor?: number): boolean {
  if (!floor) return true;
  return bidAmount >= floor;
}

/**
 * Estimate header bidding revenue increase
 */
export async function estimateHeaderBiddingLift(): Promise<{
  currentRevenue: number;
  projectedRevenue: number;
  liftPercent: number;
}> {
  const client = createAdminClient();

  // Get last 30 days of revenue
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data } = await client
    .from("revenue_report_daily")
    .select("total_revenue_sek")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const currentRevenue = (data || []).reduce((sum, d) => sum + (d.total_revenue_sek || 0), 0);

  // Header bidding typically generates 30-50% more revenue
  const projectedLift = 0.4; // 40% (conservative)
  const projectedRevenue = currentRevenue * (1 + projectedLift);

  return {
    currentRevenue,
    projectedRevenue,
    liftPercent: projectedLift * 100,
  };
}
