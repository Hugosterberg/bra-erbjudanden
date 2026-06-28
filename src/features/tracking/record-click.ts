import { createHash } from "node:crypto";

import { headers } from "next/headers";

import type { OfferRedirectTarget } from "@/features/offers/types";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import type { Database } from "@/shared/types/database";

type ClickType = Database["public"]["Enums"]["click_type"];

function hashIp(ip: string | null) {
  if (!ip) {
    return null;
  }

  const salt = process.env.CLICK_HASH_SALT ?? "local-development";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function recordClick(input: {
  offerId: string;
  storeId: string | null;
  clickType: ClickType;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const realIp = headerStore.get("x-real-ip");

  await supabase.from("click_events").insert({
    offer_id: input.offerId,
    store_id: input.storeId,
    click_type: input.clickType,
    referrer: headerStore.get("referer"),
    user_agent: headerStore.get("user-agent"),
    ip_hash: hashIp(forwardedFor ?? realIp),
  });
}

export async function recordAffiliateClick(offer: OfferRedirectTarget) {
  await recordClick({
    offerId: offer.id,
    storeId: offer.store_id,
    clickType: "website",
  });
}

export async function recordCouponCopyClick(offerId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  // Only record copies for offers that actually exist and carry a code, so the
  // public-facing tracking endpoint can't be used to inject arbitrary rows.
  const { data: offer } = await supabase
    .from("offers")
    .select("id, store_id")
    .eq("id", offerId)
    .not("discount_code", "is", null)
    .maybeSingle();

  if (!offer) {
    return;
  }

  await recordClick({
    offerId: offer.id,
    storeId: offer.store_id,
    clickType: "discount_code",
  });
}
