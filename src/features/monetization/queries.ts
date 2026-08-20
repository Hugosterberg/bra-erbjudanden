// @ts-nocheck
"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { AffiliateNetwork } from "@/features/affiliate-import/types";
import type {
  AffiliateRevenueDaily,
  AffiliateRevenueEvent,
  Sponsorship,
  AffiliateDisclosureSettings,
  RevenueMetrics,
  NetworkRevenueMetrics,
} from "./types";

export async function findRevenueEventsByDateRange(
  startDate: string,
  endDate: string,
): Promise<AffiliateRevenueEvent[]> {
  const client = createClient();

  const { data, error } = await client
    .from("affiliate_revenue_events")
    .select("*")
    .gte("recorded_at", startDate)
    .lte("recorded_at", endDate)
    .order("recorded_at", { ascending: false });

  if (error) {
    console.error("Error fetching revenue events:", error);
    return [];
  }

  return data || [];
}

export async function findDailyRevenueByNetwork(
  network: AffiliateNetwork,
  days: number = 30,
): Promise<AffiliateRevenueDaily[]> {
  const client = createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("affiliate_revenue_daily")
    .select("*")
    .eq("affiliate_network", network)
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching daily revenue:", error);
    return [];
  }

  return data || [];
}

export async function findActiveSponsorships(): Promise<Sponsorship[]> {
  const client = createClient();

  const { data, error } = await client
    .from("sponsorships")
    .select("*")
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .order("reserved_position", { ascending: true, nullsLast: true });

  if (error) {
    console.error("Error fetching active sponsorships:", error);
    return [];
  }

  return data || [];
}

export async function findSponsorshipByOfferId(offerId: string): Promise<Sponsorship | null> {
  const client = createClient();

  const { data, error } = await client
    .from("sponsorships")
    .select("*")
    .eq("offer_id", offerId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("Error fetching sponsorship:", error);
    return null;
  }

  return data;
}

export async function findAffiliateDisclosureSettings(): Promise<AffiliateDisclosureSettings | null> {
  const client = createClient();

  const { data, error } = await client
    .from("affiliate_disclosure_settings")
    .select("*")
    .eq("site_name", "braerbjudanden.se")
    .maybeSingle();

  if (error) {
    console.error("Error fetching disclosure settings:", error);
    return null;
  }

  return data;
}

export async function calculateRevenueMetrics(
  startDate: string,
  endDate: string,
): Promise<RevenueMetrics> {
  const client = createClient();

  const { data, error } = await client
    .from("affiliate_revenue_events")
    .select("event_type, revenue_usd")
    .gte("recorded_at", startDate)
    .lte("recorded_at", endDate);

  if (error) {
    console.error("Error calculating metrics:", error);
    return {
      totalRevenue: 0,
      totalClicks: 0,
      totalImpressions: 0,
      totalConversions: 0,
      averageCpc: null,
      averageCpm: null,
      conversionRate: 0,
    };
  }

  const events = data || [];
  const clicks = events.filter((e) => e.event_type === "click").length;
  const impressions = events.filter((e) => e.event_type === "impression").length;
  const conversions = events.filter((e) => e.event_type === "conversion").length;
  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue_usd || 0), 0);

  const averageCpc = clicks > 0 ? totalRevenue / clicks : null;
  const averageCpm = impressions > 0 ? (totalRevenue / impressions) * 1000 : null;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

  return {
    totalRevenue,
    totalClicks: clicks,
    totalImpressions: impressions,
    totalConversions: conversions,
    averageCpc,
    averageCpm,
    conversionRate,
  };
}

export async function calculateNetworkRevenueMetrics(
  network: AffiliateNetwork,
  startDate: string,
  endDate: string,
): Promise<NetworkRevenueMetrics> {
  const client = createClient();

  const { data, error } = await client
    .from("affiliate_revenue_events")
    .select("event_type, revenue_usd")
    .eq("affiliate_network", network)
    .gte("recorded_at", startDate)
    .lte("recorded_at", endDate);

  if (error) {
    console.error("Error calculating network metrics:", error);
    return {
      network,
      totalRevenue: 0,
      totalClicks: 0,
      totalImpressions: 0,
      totalConversions: 0,
      averageCpc: null,
      averageCpm: null,
      conversionRate: 0,
      trend: "flat",
    };
  }

  const events = data || [];
  const clicks = events.filter((e) => e.event_type === "click").length;
  const impressions = events.filter((e) => e.event_type === "impression").length;
  const conversions = events.filter((e) => e.event_type === "conversion").length;
  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue_usd || 0), 0);

  const averageCpc = clicks > 0 ? totalRevenue / clicks : null;
  const averageCpm = impressions > 0 ? (totalRevenue / impressions) * 1000 : null;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

  // Simple trend: compare first half vs second half
  const midpoint = Math.floor(events.length / 2);
  const firstHalf = events.slice(0, midpoint);
  const secondHalf = events.slice(midpoint);
  const firstHalfRevenue = firstHalf.reduce((sum, e) => sum + (e.revenue_usd || 0), 0);
  const secondHalfRevenue = secondHalf.reduce((sum, e) => sum + (e.revenue_usd || 0), 0);

  let trend: "up" | "down" | "flat" = "flat";
  if (secondHalfRevenue > firstHalfRevenue * 1.1) trend = "up";
  else if (secondHalfRevenue < firstHalfRevenue * 0.9) trend = "down";

  return {
    network,
    totalRevenue,
    totalClicks: clicks,
    totalImpressions: impressions,
    totalConversions: conversions,
    averageCpc,
    averageCpm,
    conversionRate,
    trend,
  };
}

export async function findTopRevenueOffers(limit: number = 10): Promise<
  Array<{
    offerId: string;
    title: string;
    revenue: number;
    clicks: number;
  }>
> {
  const client = createClient();

  const { data, error } = await client
    .from("affiliate_revenue_events")
    .select("offer_id, revenue_usd, event_type")
    .eq("event_type", "click")
    .order("revenue_usd", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching top revenue offers:", error);
    return [];
  }

  // Group by offer_id and sum
  const grouped = (data || []).reduce(
    (acc, event) => {
      const existing = acc.find((e) => e.offerId === event.offer_id);
      if (existing) {
        existing.revenue += event.revenue_usd || 0;
        existing.clicks += 1;
      } else {
        acc.push({
          offerId: event.offer_id,
          revenue: event.revenue_usd || 0,
          clicks: 1,
          title: "", // Will be populated by caller if needed
        });
      }
      return acc;
    },
    [] as Array<{ offerId: string; revenue: number; clicks: number; title: string }>,
  );

  return grouped.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}
