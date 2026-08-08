"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";

/**
 * Generate a conversion tracking pixel for advertiser to install
 * Returns an img tag that fires when page loads
 */
export function generateConversionPixel(campaignId: string, apiKey: string): string {
  const pixelUrl = `/api/pixels/conversions?campaign=${campaignId}&key=${apiKey}`;
  return `<img src="${pixelUrl}" width="1" height="1" alt="" />`;
}

/**
 * Record a conversion
 */
export async function recordConversion(params: {
  campaignId: string;
  conversionType: "purchase" | "signup" | "lead" | "view" | "custom";
  conversionValue?: number;
  externalConversionId?: string;
  clickId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client.from("ad_conversions").insert([
      {
        campaign_id: params.campaignId,
        click_id: params.clickId,
        conversion_type: params.conversionType,
        conversion_value: params.conversionValue,
        external_conversion_id: params.externalConversionId,
        pixel_fired: true,
      },
    ]);

    if (error) {
      console.error("Error recording conversion:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error recording conversion:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get conversion rate for campaign
 */
export async function getCampaignConversionRate(campaignId: string): Promise<number> {
  const client = createAdminClient();

  // Get total clicks
  const { count: clickCount } = await client
    .from("ad_clicks")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  // Get total conversions
  const { count: conversionCount } = await client
    .from("ad_conversions")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  if (!clickCount || clickCount === 0) {
    return 0;
  }

  return (conversionCount || 0) / clickCount;
}

/**
 * Get conversion value for campaign
 */
export async function getCampaignConversionValue(campaignId: string): Promise<number> {
  const client = createAdminClient();

  const { data } = await client
    .from("ad_conversions")
    .select("conversion_value")
    .eq("campaign_id", campaignId);

  if (!data) {
    return 0;
  }

  return data.reduce((sum, c) => sum + (c.conversion_value || 0), 0);
}

/**
 * Get ROI for campaign (revenue / spend)
 */
export async function getCampaignROI(campaignId: string): Promise<number | null> {
  const client = createAdminClient();

  // Get spend
  const { data: metrics } = await client
    .from("ad_metrics_daily")
    .select("spend_sek")
    .eq("campaign_id", campaignId);

  const totalSpend = metrics?.reduce((sum, m) => sum + (m.spend_sek || 0), 0) || 0;

  if (totalSpend === 0) {
    return null;
  }

  const totalRevenue = await getCampaignConversionValue(campaignId);

  return totalRevenue / totalSpend;
}

/**
 * Breakdown by conversion type
 */
export async function getConversionBreakdown(
  campaignId: string,
): Promise<Record<string, { count: number; value: number }>> {
  const client = createAdminClient();

  const { data } = await client.from("ad_conversions").select("conversion_type, conversion_value").eq("campaign_id", campaignId);

  if (!data) {
    return {};
  }

  const breakdown: Record<string, { count: number; value: number }> = {};

  data.forEach((conv) => {
    const type = conv.conversion_type;
    if (!breakdown[type]) {
      breakdown[type] = { count: 0, value: 0 };
    }
    breakdown[type].count += 1;
    breakdown[type].value += conv.conversion_value || 0;
  });

  return breakdown;
}
