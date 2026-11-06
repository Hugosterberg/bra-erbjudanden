"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/auth";
import { formatDealHeadline } from "@/features/offers/format";
import { siteConfig } from "@/shared/config/site";
import { fetchAllPages } from "@/shared/lib/supabase/fetch-all-pages";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import {
  EMAIL_BATCH_SIZE,
  getEmailSender,
  isMailerConfigured,
  sendEmail,
  sendEmailBatch,
  type OutgoingEmail,
} from "./mailer";
import { sendSubscriberConfirmation } from "./confirmation";
import type { NewsletterResult } from "./results";
import { buildCampaignEmail, type CampaignOffer } from "./templates";

const SEND_TIME_BUDGET_MS = 240_000;

const campaignSchema = z.object({
  subject: z.string().trim().min(3, "Ämnesrad krävs").max(120),
  intro: z.string().trim().max(1000).optional(),
  offer_ids: z.array(z.string().uuid()).min(1, "Välj minst ett erbjudande").max(12),
});

export type NewsletterActionState = {
  ok: boolean;
  message: string;
};

function finish(result: NewsletterResult): never {
  revalidatePath("/admin/nyhetsbrev");
  redirect(`/admin/nyhetsbrev?resultat=${result}`);
}

function unsubscribeUrl(token: string) {
  return `${siteConfig.url}/nyhetsbrev/avregistrera?token=${token}`;
}

/** An offer that has ended since the campaign was written must not be sent. */
async function loadCampaignOffers(offerIds: string[]): Promise<CampaignOffer[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("offers")
    .select("id, title, discount_type, discount_value, is_up_to, deal_label, discount_code, store:stores(name)")
    .in("id", offerIds)
    .eq("status", "published")
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`);

  return (data ?? []).map((offer) => ({
    id: offer.id,
    title: offer.title,
    deal: formatDealHeadline(offer),
    storeName: (offer.store as { name: string } | null)?.name ?? null,
    discountCode: offer.discount_code,
  }));
}

function buildMarketingEmail(
  to: string,
  token: string,
  campaign: { subject: string; intro: string | null },
  offers: CampaignOffer[],
): OutgoingEmail {
  const url = unsubscribeUrl(token);

  return {
    to,
    ...buildCampaignEmail({
      subject: campaign.subject,
      intro: campaign.intro,
      offers,
      unsubscribeUrl: url,
      sender: getEmailSender(),
    }),
    headers: {
      "List-Unsubscribe": `<${siteConfig.url}/api/nyhetsbrev/avregistrera?token=${token}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export async function createCampaignAction(formData: FormData): Promise<NewsletterActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const parsed = campaignSchema.safeParse({
    subject: String(formData.get("subject") ?? ""),
    intro: String(formData.get("intro") ?? ""),
    offer_ids: formData.getAll("offer_ids").map(String),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Kontrollera fälten." };
  }

  if (!supabase) {
    return { ok: false, message: "Databasen är inte konfigurerad." };
  }

  const { error } = await supabase.from("newsletter_campaigns").insert({
    subject: parsed.data.subject,
    intro: parsed.data.intro || null,
    offer_ids: parsed.data.offer_ids,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/nyhetsbrev");
  return { ok: true, message: "Utskicket sparades som utkast. Skicka ett test innan du skickar." };
}

export async function sendCampaignTestAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const campaignId = String(formData.get("campaign_id") ?? "");
  const to = z.string().email().safeParse(String(formData.get("test_email") ?? ""));

  if (!supabase || !to.success) {
    finish("test-fel");
  }

  const { data: campaign } = await supabase
    .from("newsletter_campaigns")
    .select("subject, intro, offer_ids")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign) {
    finish("test-fel");
  }

  const offers = await loadCampaignOffers(campaign.offer_ids);
  if (offers.length === 0) {
    finish("inga-erbjudanden");
  }

  try {
    await sendEmail(
      buildMarketingEmail(
        to.data,
        "00000000-0000-0000-0000-000000000000",
        { subject: `[TEST] ${campaign.subject}`, intro: campaign.intro },
        offers,
      ),
    );
  } catch (error) {
    console.error("[newsletter] Test mail failed", error);
    finish("test-fel");
  }

  finish("test-skickat");
}

/**
 * Safe to press twice or run again. Each recipient is claimed in the delivery log
 * before their mail goes out, so overlapping runs cannot both send to them, and a
 * run that stopped continues where it left off. If a run dies right after a claim,
 * those recipients are skipped: a missed mail is better than a duplicate.
 */
export async function sendCampaignAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const campaignId = String(formData.get("campaign_id") ?? "");

  if (!supabase || !isMailerConfigured()) {
    finish("ej-konfigurerad");
  }

  const { data: campaign } = await supabase
    .from("newsletter_campaigns")
    .select("id, subject, intro, offer_ids, status")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign || campaign.status === "sent") {
    finish("redan-skickat");
  }

  const offers = await loadCampaignOffers(campaign.offer_ids);
  if (offers.length === 0) {
    finish("inga-erbjudanden");
  }

  const subscribers = await fetchAllPages<{ id: string; email: string; unsubscribe_token: string }>(
    (from, to) =>
      supabase
        .from("deal_subscribers")
        .select("id, email, unsubscribe_token")
        .eq("status", "active")
        .order("id", { ascending: true })
        .range(from, to),
  );

  if (subscribers.length === 0) {
    finish("inga-prenumeranter");
  }

  const delivered = await fetchAllPages<{ subscriber_id: string }>((from, to) =>
    supabase
      .from("newsletter_deliveries")
      .select("subscriber_id")
      .eq("campaign_id", campaign.id)
      .range(from, to),
  );
  const deliveredIds = new Set(delivered.map((row) => row.subscriber_id));
  const remaining = subscribers.filter((subscriber) => !deliveredIds.has(subscriber.id));
  const startedAt = Date.now();

  await supabase.from("newsletter_campaigns").update({ status: "sending" }).eq("id", campaign.id);

  for (let index = 0; index < remaining.length; index += EMAIL_BATCH_SIZE) {
    if (Date.now() - startedAt > SEND_TIME_BUDGET_MS) {
      finish("pausad");
    }

    const batch = remaining.slice(index, index + EMAIL_BATCH_SIZE);
    const { data: claimed, error: claimError } = await supabase
      .from("newsletter_deliveries")
      .upsert(
        batch.map((subscriber) => ({ campaign_id: campaign.id, subscriber_id: subscriber.id })),
        { onConflict: "campaign_id,subscriber_id", ignoreDuplicates: true },
      )
      .select("subscriber_id");

    if (claimError) {
      console.error("[newsletter] Could not claim recipients", claimError.message);
      finish("fel");
    }

    const claimedIds = new Set((claimed ?? []).map((row) => row.subscriber_id));
    const recipients = batch.filter((subscriber) => claimedIds.has(subscriber.id));

    if (recipients.length === 0) {
      continue;
    }

    try {
      await sendEmailBatch(
        recipients.map((subscriber) =>
          buildMarketingEmail(subscriber.email, subscriber.unsubscribe_token, campaign, offers),
        ),
      );
    } catch (error) {
      console.error("[newsletter] Batch failed", error);
      // Released so that pressing "Fortsätt skicka" tries these again.
      await supabase
        .from("newsletter_deliveries")
        .delete()
        .eq("campaign_id", campaign.id)
        .in("subscriber_id", [...claimedIds]);
      finish("fel");
    }
  }

  await supabase
    .from("newsletter_campaigns")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", campaign.id);

  finish("klart");
}

/** For people who signed up before email was connected. */
export async function sendPendingConfirmationsAction(): Promise<void> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();

  if (!supabase || !isMailerConfigured()) {
    finish("ej-konfigurerad");
  }

  const { data } = await supabase
    .from("deal_subscribers")
    .select("id, email, confirmation_token")
    .eq("status", "pending")
    .is("confirmation_sent_at", null)
    .limit(200);

  for (const subscriber of data ?? []) {
    await sendSubscriberConfirmation(subscriber);
  }

  finish("bekraftelser-skickade");
}
