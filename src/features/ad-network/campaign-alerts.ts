// @ts-nocheck
"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";
import { sendWebhookEvent } from "./webhooks";
import type { AdCampaign } from "./types";

export type AlertType = "budget_warning" | "low_ctr" | "high_cpc" | "fraud_detected" | "underperforming";
export type AlertSeverity = "info" | "warning" | "critical";

/**
 * Check campaign health and create alerts if needed
 */
export async function checkCampaignHealth(campaign: AdCampaign): Promise<void> {
  if (campaign.status !== "active") {
    return;
  }

  const client = createAdminClient();

  // Get today's metrics
  const today = new Date().toISOString().split("T")[0];
  const { data: todayMetrics } = await client
    .from("ad_metrics_daily")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("date", today)
    .single();

  if (!todayMetrics) {
    return; // No data yet
  }

  // 1. Check budget warning
  if (campaign.daily_budget_sek && todayMetrics.spend_sek > campaign.daily_budget_sek * 0.8) {
    await createAlert(
      campaign.id,
      "budget_warning",
      "warning",
      `Daily spend (${todayMetrics.spend_sek} SEK) is 80% of budget (${campaign.daily_budget_sek} SEK)`,
      todayMetrics.spend_sek,
    );
  }

  // 2. Check CTR (industry average ~1-2%)
  const ctr = todayMetrics.impressions > 0 ? (todayMetrics.clicks / todayMetrics.impressions) * 100 : 0;
  if (todayMetrics.impressions > 100 && ctr < 0.5) {
    await createAlert(campaign.id, "low_ctr", "warning", `CTR is very low (${ctr.toFixed(2)}%). Consider testing new creatives.`, ctr);
  }

  // 3. Check CPC (depends on industry, but flag if abnormally high)
  const cpc = todayMetrics.clicks > 0 ? todayMetrics.spend_sek / todayMetrics.clicks : 0;
  if (cpc > 10) {
    await createAlert(campaign.id, "high_cpc", "critical", `CPC is very high (${cpc.toFixed(2)} SEK). Consider lowering bid.`, cpc);
  }

  // 4. Check fraud rate
  const { count: fraudCount } = await client
    .from("click_fraud_detection")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .eq("is_fraudulent", true);

  const { count: totalClickCount } = await client
    .from("ad_clicks")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaign.id);

  if (totalClickCount && fraudCount && fraudCount / totalClickCount > 0.05) {
    // >5% fraud rate
    await createAlert(
      campaign.id,
      "fraud_detected",
      "critical",
      `High fraud rate detected (${((fraudCount / totalClickCount) * 100).toFixed(1)}%). Reviewing clicks.`,
      (fraudCount / totalClickCount) * 100,
    );
  }

  // 5. Check if underperforming (negative ROI)
  const { data: conversions } = await client
    .from("ad_conversions")
    .select("conversion_value")
    .eq("campaign_id", campaign.id)
    .order("recorded_at", { ascending: false })
    .limit(100);

  const recentConversionValue = conversions?.reduce((sum, c) => sum + (c.conversion_value || 0), 0) || 0;
  const recentSpend = todayMetrics.spend_sek;

  if (recentSpend > 0 && recentConversionValue < recentSpend * 0.5) {
    await createAlert(campaign.id, "underperforming", "warning", `ROI is below 50%. Consider pausing or optimizing campaign.`, null);
  }
}

/**
 * Create an alert
 */
async function createAlert(
  campaignId: string,
  alertType: AlertType,
  severity: AlertSeverity,
  message: string,
  thresholdValue?: number,
): Promise<void> {
  const client = createAdminClient();

  // Check if alert already exists (avoid duplicates)
  const { data: existingAlert } = await client
    .from("campaign_alerts")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("alert_type", alertType)
    .is("acknowledged_at", null)
    .order("triggered_at", { ascending: false })
    .limit(1)
    .single();

  // Don't create duplicate alerts within 1 hour
  if (existingAlert) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (new Date(existingAlert.triggered_at) > oneHourAgo) {
      return;
    }
  }

  // Create alert
  await client.from("campaign_alerts").insert([
    {
      campaign_id: campaignId,
      alert_type: alertType,
      severity,
      message,
      threshold_value: thresholdValue,
      current_value: thresholdValue,
    },
  ]);

  // Send webhook notification
  const campaign = await client.from("ad_campaigns").select("advertiser_id").eq("id", campaignId).single();

  if (campaign.data) {
    await sendWebhookEvent(campaign.data.advertiser_id, "budget_warning", {
      campaignId,
      alertType,
      message,
    });
  }
}

/**
 * Acknowledge/dismiss an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client
      .from("campaign_alerts")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", alertId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error acknowledging alert:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get active alerts for campaign
 */
export async function getCampaignAlerts(campaignId: string): Promise<
  Array<{
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    triggeredAt: string;
  }>
> {
  const client = createAdminClient();

  const { data } = await client
    .from("campaign_alerts")
    .select("id, alert_type, severity, message, triggered_at")
    .eq("campaign_id", campaignId)
    .is("acknowledged_at", null)
    .order("triggered_at", { ascending: false });

  return (
    data?.map((alert) => ({
      id: alert.id,
      type: alert.alert_type as AlertType,
      severity: alert.severity as AlertSeverity,
      message: alert.message,
      triggeredAt: alert.triggered_at,
    })) || []
  );
}

/**
 * Recommend pause if underperforming
 */
export async function shouldPauseCampaign(campaignId: string): Promise<{ should: boolean; reason?: string }> {
  const client = createAdminClient();

  // Get recent alerts
  const { data: alerts } = await client
    .from("campaign_alerts")
    .select("*")
    .eq("campaign_id", campaignId)
    .is("acknowledged_at", null)
    .order("triggered_at", { ascending: false });

  if (!alerts) {
    return { should: false };
  }

  // Multiple critical alerts = pause
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  if (criticalCount >= 2) {
    return { should: true, reason: "Multiple critical issues detected" };
  }

  // High fraud rate = pause
  const hasFraud = alerts.some((a) => a.alert_type === "fraud_detected");
  if (hasFraud) {
    return { should: true, reason: "Fraud detected" };
  }

  // Very low ROI = pause
  const hasLowROI = alerts.some((a) => a.alert_type === "underperforming");
  if (hasLowROI) {
    return { should: true, reason: "Underperforming campaign" };
  }

  return { should: false };
}

/**
 * Auto-pause campaign if needed
 */
export async function autoPauseBadCampaigns(): Promise<number> {
  const client = createAdminClient();

  // Get all active campaigns
  const { data: campaigns } = await client
    .from("ad_campaigns")
    .select("*")
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString());

  if (!campaigns) {
    return 0;
  }

  let pausedCount = 0;

  for (const campaign of campaigns) {
    const recommendation = await shouldPauseCampaign(campaign.id);

    if (recommendation.should) {
      await client
        .from("ad_campaigns")
        .update({ status: "paused" })
        .eq("id", campaign.id);

      pausedCount++;

      // Notify advertiser
      await sendWebhookEvent(campaign.advertiser_id, "campaign.paused", {
        campaignId: campaign.id,
        reason: recommendation.reason,
      });
    }
  }

  return pausedCount;
}
