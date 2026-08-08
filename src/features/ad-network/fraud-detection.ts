"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";
import type { AdClick } from "./types";

export interface FraudAnalysis {
  riskScore: number; // 0-10
  isFraudulent: boolean;
  flags: string[];
  notes: string;
}

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
  const flags: string[] = [];
  let riskScore = 0;

  // 1. Check for rapid-fire clicks from same IP
  if (context?.ipHash) {
    const recentClicksFromIp = await getRecentClicksFromIp(context.ipHash, click.campaign_id);
    if (recentClicksFromIp > 5) {
      flags.push("rapid_clicks_same_ip");
      riskScore += 3;
    }
  }

  // 2. Check for invalid user agents
  if (context?.userAgent) {
    if (isBot(context.userAgent)) {
      flags.push("bot_user_agent");
      riskScore += 4;
    }
    if (isSuspiciousUserAgent(context.userAgent)) {
      flags.push("suspicious_user_agent");
      riskScore += 2;
    }
  }

  // 3. Check for VPN/Proxy
  if (context?.ipHash && isVpnIp(context.ipHash)) {
    flags.push("vpn_detected");
    riskScore += 1; // VPN not always fraud, just higher scrutiny
  }

  // 4. Check for unusual click patterns
  const unusualPattern = await detectUnusualPattern(click.campaign_id, context?.pageUrl);
  if (unusualPattern) {
    flags.push("unusual_click_pattern");
    riskScore += 2;
  }

  // 5. Check for invalid referrer
  if (context?.referrer && isInvalidReferrer(context.referrer)) {
    flags.push("invalid_referrer");
    riskScore += 1.5;
  }

  // 6. Check for repeated clicks from same session
  const recentClicksInSession = await getRecentClicksInSession(click.session_id || "", click.campaign_id);
  if (recentClicksInSession > 2) {
    flags.push("multiple_clicks_same_session");
    riskScore += 2;
  }

  // 7. Check for click time anomalies
  if (isUnusualClickTime()) {
    flags.push("unusual_click_time");
    riskScore += 0.5;
  }

  const isFraudulent = riskScore >= 5;

  const notes = flags.length > 0 ? flags.join(", ") : "No suspicious indicators detected";

  return {
    riskScore: Math.min(10, riskScore),
    isFraudulent,
    flags,
    notes,
  };
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

  const { data, error } = await client.from("click_fraud_detection").select("count");

  if (error) {
    console.error("Error getting fraud rate:", error);
    return 0;
  }

  const fraudulentCount = (data?.filter((d) => d.is_fraudulent) || []).length;
  const totalCount = data?.length || 1;

  return (fraudulentCount / totalCount) * 100;
}

// === Helper Functions ===

function isBot(userAgent: string): boolean {
  const botPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /ahrefsbot/i,
    /semrushbot/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  return userAgent.length < 10 || userAgent === "unknown" || /headless|curl|wget|python/i.test(userAgent);
}

function isVpnIp(ipHash: string): boolean {
  // In production, use a VPN detection API
  // For now, just check for known VPN/proxy IP patterns
  return ipHash.startsWith("vpn_") || ipHash.startsWith("proxy_");
}

function isInvalidReferrer(referrer: string): boolean {
  try {
    const url = new URL(referrer);
    // Check for obviously fake referrers
    return !url.hostname || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return true; // Invalid URL format
  }
}

function isUnusualClickTime(): boolean {
  const hour = new Date().getHours();
  // Flag clicks at very unusual hours (2-4 AM)
  return hour >= 2 && hour <= 4;
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
  data.forEach((click) => {
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
