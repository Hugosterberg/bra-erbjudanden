"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";
import type { AffiliateNetwork } from "@/features/affiliate-import/types";
import type { Sponsorship, AffiliateDisclosureSettings } from "./types";

export async function recordRevenueEvent(params: {
  offerId: string;
  affiliateNetwork: AffiliateNetwork;
  eventType: "impression" | "click" | "conversion";
  revenueUsd: number;
  revenueSek?: number;
  externalTransactionId?: string;
  userAgent?: string;
  referrer?: string;
  ipHash?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client.from("affiliate_revenue_events").insert([
      {
        offer_id: params.offerId,
        affiliate_network: params.affiliateNetwork,
        event_type: params.eventType,
        revenue_usd: params.revenueUsd,
        revenue_sek: params.revenueSek,
        external_transaction_id: params.externalTransactionId,
        user_agent: params.userAgent,
        referrer: params.referrer,
        ip_hash: params.ipHash,
      },
    ]);

    if (error) {
      console.error("Error recording revenue event:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error recording revenue event:", error);
    return { success: false, error: String(error) };
  }
}

export async function createSponsorship(params: {
  offerId: string;
  sponsorName: string;
  sponsorWebsiteUrl?: string;
  pricingModel: "cpc" | "cpm" | "flat_daily";
  amount: number;
  currency?: string;
  startsAt: string;
  endsAt: string;
  reservedPosition?: number;
  impressionsGoal?: number;
  clicksGoal?: number;
  notes?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const client = createAdminClient();

    const { data, error } = await client
      .from("sponsorships")
      .insert([
        {
          offer_id: params.offerId,
          sponsor_name: params.sponsorName,
          sponsor_website_url: params.sponsorWebsiteUrl,
          pricing_model: params.pricingModel,
          amount: params.amount,
          currency: params.currency || "SEK",
          starts_at: params.startsAt,
          ends_at: params.endsAt,
          reserved_position: params.reservedPosition,
          impressions_goal: params.impressionsGoal,
          clicks_goal: params.clicksGoal,
          notes: params.notes,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating sponsorship:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error("Unexpected error creating sponsorship:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateSponsorship(
  sponsorshipId: string,
  updates: Partial<Sponsorship>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client
      .from("sponsorships")
      .update({
        ...(updates.amount && { amount: updates.amount }),
        ...(updates.status && { status: updates.status }),
        ...(updates.reserved_position && { reserved_position: updates.reserved_position }),
        ...(updates.notes && { notes: updates.notes }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsorshipId);

    if (error) {
      console.error("Error updating sponsorship:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating sponsorship:", error);
    return { success: false, error: String(error) };
  }
}

export async function pauseSponsorship(sponsorshipId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return updateSponsorship(sponsorshipId, { status: "paused" });
}

export async function resumeSponsorship(sponsorshipId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return updateSponsorship(sponsorshipId, { status: "active" });
}

export async function recordSponsorshipEvent(
  sponsorshipId: string,
  eventType: "impression" | "click",
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client.from("sponsorship_events").insert([
      {
        sponsorship_id: sponsorshipId,
        event_type: eventType,
      },
    ]);

    if (error) {
      console.error("Error recording sponsorship event:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error recording sponsorship event:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateAffiliateDisclosureSettings(
  updates: Partial<AffiliateDisclosureSettings>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createAdminClient();

    const { error } = await client
      .from("affiliate_disclosure_settings")
      .update({
        ...(updates.disclosure_text && { disclosure_text: updates.disclosure_text }),
        ...(updates.privacy_policy_url && { privacy_policy_url: updates.privacy_policy_url }),
        ...(updates.affiliate_policy_url && { affiliate_policy_url: updates.affiliate_policy_url }),
        ...(updates.faq_url && { faq_url: updates.faq_url }),
        ...(typeof updates.show_disclosure_badge !== "undefined" && {
          show_disclosure_badge: updates.show_disclosure_badge,
        }),
        ...(typeof updates.show_network_attribution !== "undefined" && {
          show_network_attribution: updates.show_network_attribution,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("site_name", "braerbjudanden.se");

    if (error) {
      console.error("Error updating disclosure settings:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating disclosure settings:", error);
    return { success: false, error: String(error) };
  }
}
