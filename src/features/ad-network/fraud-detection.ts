"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";
import { assessClickFraud, type FraudAssessment } from "./fraud-signals";
import type { AdClick } from "./types";

export type FraudAnalysis = FraudAssessment;

/**
 * Analyze a click for fraud patterns
 * Multi-factor detection: IP patterns, timing, session behavior, etc.
 */
export async function analyzeClickForFraud(click: AdClick, context?: {
  userAgent?: string;
  ipHash?: string;
  pageUrl?: string;
  referrer?: string;
}): Promise<FraudAnalysis> {
  const recentClicksFromIp = context?.ipHash
    ? await getRecentClicksFromIp(context.ipHash, click.campaign_id)
    : 0;
  const unusualPattern = await detectUnusualPattern(click.campaign_id, context?.pageUrl);
  const recentClicksInSession = await getRecentClicksInSession(click.session_id || "", click.campaign_id);

  return assessClickFraud({
    recentClicksFromIp,
    userAgent: context?.userAgent,
    ipHash: context?.ipHash,
    referrer: context?.referrer,
    unusualPattern,
    recentClicksInSession,
  });
}

/**
 * Record fraud analysis result
 */
export async function recordFraudAnalysis(
  clickId: string,
  campaignId: string,
  analysis: FraudAnalysis,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client.from("click_fraud_detection").insert([
      {
        click_id: clickId,
        campaign_id: campaignId,
        risk_score: analysis.riskScore,
        risk_flags: analysis.flags,
        is_fraudulent: analysis.isFraudulent,
        notes: analysis.notes,
      },
    ]);

    if (error) {
      console.error("Error recording fraud analysis:", error);
      return { success: false, error: error.message };
    }

    // If fraudulent, create alert
    if (analysis.isFraudulent) {
      await createCampaignAlert(campaignId, "fraud_detected", "critical", `Click flagged as fraudulent: ${analysis.notes}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error recording fraud analysis:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get fraud rate for campaign
 */
export async function getCampaignFraudRate(campaignId: string): Promise<number> {
  const client = createAdminClient();

  const { data, error } = await client
    .from("click_fraud_detection")
    .select("*")
    .eq("campaign_id", campaignId);

  if (error) {
    console.error("Error getting fraud rate:", error);
    return 0;
  }

  const fraudulentCount = (data?.filter((d: Record<string, unknown>) => d.is_fraudulent) || []).length;
  const totalCount = data?.length || 1;

  return (fraudulentCount / totalCount) * 100;
}

async function getRecentClicksFromIp(ipHash: string, campaignId: string): Promise<number> {
  const client = createAdminClient();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { count } = await client
    .from("ad_clicks")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("ip_hash", ipHash)
    .gte("recorded_at", fiveMinutesAgo);

  return count || 0;
}

async function getRecentClicksInSession(sessionId: string, campaignId: string): Promise<number> {
  if (!sessionId) return 0;

  const client = createAdminClient();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

  const { count } = await client
    .from("ad_clicks")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("session_id", sessionId)
    .gte("recorded_at", oneMinuteAgo);

  return count || 0;
}

async function detectUnusualPattern(campaignId: string, pageUrl?: string): Promise<boolean> {
  if (!pageUrl) return false;

  const client = createAdminClient();

  // Check if same page is generating too many clicks
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data } = await client
    .from("ad_clicks")
    .select("*")
    .eq("campaign_id", campaignId)
    .gte("recorded_at", oneHourAgo)
    .order("recorded_at", { ascending: false })
    .limit(100);

  if (!data || data.length < 20) return false;

  // If >50% of clicks are from same source, it's suspicious
  const urlCounts = new Map<string, number>();
  data.forEach(() => {
    const count = urlCounts.get(pageUrl || "unknown") || 0;
    urlCounts.set(pageUrl || "unknown", count + 1);
  });

  const singleSourceClicks = urlCounts.get(pageUrl || "unknown") || 0;
  return singleSourceClicks / data.length > 0.5;
}

async function createCampaignAlert(
  campaignId: string,
  alertType: string,
  severity: string,
  message: string,
): Promise<void> {
  const client = createAdminClient();

  await client.from("campaign_alerts").insert([
    {
      campaign_id: campaignId,
      alert_type: alertType,
      severity,
      message,
    },
  ]);
}
