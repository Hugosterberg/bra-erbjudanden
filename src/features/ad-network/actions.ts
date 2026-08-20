// @ts-nocheck
"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";
import { generateRandomString } from "@/shared/lib/random";

// Advertiser account creation
export async function registerAdvertiser(params: {
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  country?: string;
}): Promise<{ success: boolean; advertiserId?: string; error?: string }> {
  try {
    const client = createAdminClient();
    const apiKey = generateRandomString(32);
    const apiSecret = generateRandomString(32);

    const { data, error } = await client
      .from("advertiser_accounts")
      .insert([
        {
          business_name: params.businessName,
          contact_email: params.contactEmail,
          contact_phone: params.contactPhone,
          website_url: params.websiteUrl,
          country: params.country || "SE",
          api_key: apiKey,
          api_secret: apiSecret,
          status: "pending", // Requires admin approval
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error registering advertiser:", error);
      return { success: false, error: error.message };
    }

    return { success: true, advertiserId: data.id };
  } catch (error) {
    console.error("Unexpected error registering advertiser:", error);
    return { success: false, error: String(error) };
  }
}

// Create ad campaign
export async function createAdCampaign(
  advertiserId: string,
  params: {
    name: string;
    description?: string;
    targetUrl: string;
    campaignType: "banner" | "featured_offer" | "native" | "sidebar";
    pricingModel: "cpm" | "cpc" | "daily_flat";
    bidAmount: number;
    startsAt: string;
    endsAt: string;
    dailyBudget?: number;
    totalBudget?: number;
    targetCategories?: string[];
    targetRegions?: string[];
  },
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  try {
    const client = createAdminClient();

    const { data, error } = await client
      .from("ad_campaigns")
      .insert([
        {
          advertiser_id: advertiserId,
          name: params.name,
          description: params.description,
          target_url: params.targetUrl,
          campaign_type: params.campaignType,
          pricing_model: params.pricingModel,
          bid_amount: params.bidAmount,
          starts_at: params.startsAt,
          ends_at: params.endsAt,
          daily_budget_sek: params.dailyBudget,
          total_budget_sek: params.totalBudget,
          target_categories: params.targetCategories || [],
          target_regions: params.targetRegions || [],
          status: "pending_approval", // Requires review
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating campaign:", error);
      return { success: false, error: error.message };
    }

    return { success: true, campaignId: data.id };
  } catch (error) {
    console.error("Unexpected error creating campaign:", error);
    return { success: false, error: String(error) };
  }
}

// Upload ad creative
export async function uploadAdCreative(
  campaignId: string,
  params: {
    name: string;
    creativeType: "image" | "text" | "video" | "html";
    imageUrl?: string;
    imageAltText?: string;
    headline?: string;
    bodyText?: string;
    ctaText?: string;
    htmlContent?: string;
    videoUrl?: string;
    width?: number;
    height?: number;
  },
): Promise<{ success: boolean; creativeId?: string; error?: string }> {
  try {
    const client = createAdminClient();

    const { data, error } = await client
      .from("ad_creatives")
      .insert([
        {
          campaign_id: campaignId,
          name: params.name,
          creative_type: params.creativeType,
          image_url: params.imageUrl,
          image_alt_text: params.imageAltText,
          headline: params.headline,
          body_text: params.bodyText,
          cta_text: params.ctaText || "Besök",
          html_content: params.htmlContent,
          video_url: params.videoUrl,
          width: params.width,
          height: params.height,
          status: "pending_review",
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error uploading creative:", error);
      return { success: false, error: error.message };
    }

    return { success: true, creativeId: data.id };
  } catch (error) {
    console.error("Unexpected error uploading creative:", error);
    return { success: false, error: String(error) };
  }
}

// Record ad impression
export async function recordAdImpression(params: {
  campaignId: string;
  creativeId: string;
  placementId: string;
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
  pageUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client.from("ad_impressions").insert([
      {
        campaign_id: params.campaignId,
        creative_id: params.creativeId,
        placement_id: params.placementId,
        session_id: params.sessionId,
        user_agent: params.userAgent,
        referrer: params.referrer,
        page_url: params.pageUrl,
      },
    ]);

    if (error) {
      console.error("Error recording impression:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error recording impression:", error);
    return { success: false, error: String(error) };
  }
}

// Record ad click
export async function recordAdClick(params: {
  campaignId: string;
  creativeId: string;
  impressionId?: string;
  sessionId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client.from("ad_clicks").insert([
      {
        campaign_id: params.campaignId,
        creative_id: params.creativeId,
        impression_id: params.impressionId,
        session_id: params.sessionId,
      },
    ]);

    if (error) {
      console.error("Error recording click:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error recording click:", error);
    return { success: false, error: String(error) };
  }
}

// Approve/reject campaign (admin only)
export async function approveCampaign(
  campaignId: string,
  approved: boolean,
  rejectionReason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client
      .from("ad_campaigns")
      .update({
        status: approved ? "approved" : "rejected",
        rejection_reason: rejectionReason,
      })
      .eq("id", campaignId);

    if (error) {
      console.error("Error updating campaign:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating campaign:", error);
    return { success: false, error: String(error) };
  }
}

// Approve/reject creative (admin only)
export async function approveCreative(
  creativeId: string,
  approved: boolean,
  rejectionReason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client
      .from("ad_creatives")
      .update({
        status: approved ? "approved" : "rejected",
        rejection_reason: rejectionReason,
      })
      .eq("id", creativeId);

    if (error) {
      console.error("Error updating creative:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating creative:", error);
    return { success: false, error: String(error) };
  }
}

// Pause/resume campaign
export async function pauseCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client
      .from("ad_campaigns")
      .update({ status: "paused" })
      .eq("id", campaignId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error pausing campaign:", error);
    return { success: false, error: String(error) };
  }
}

export async function resumeCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client
      .from("ad_campaigns")
      .update({ status: "active" })
      .eq("id", campaignId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error resuming campaign:", error);
    return { success: false, error: String(error) };
  }
}

// Approve advertiser (admin only)
export async function approveAdvertiser(
  advertiserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client
      .from("advertiser_accounts")
      .update({ status: "approved", verified_at: new Date().toISOString() })
      .eq("id", advertiserId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error approving advertiser:", error);
    return { success: false, error: String(error) };
  }
}
