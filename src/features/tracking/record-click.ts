import { createHash } from "node:crypto";

import { headers } from "next/headers";

import type { OfferRedirectTarget } from "@/features/offers/types";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

function hashIp(ip: string | null) {
  if (!ip) {
    return null;
  }

  const salt = process.env.CLICK_HASH_SALT ?? "local-development";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function recordAffiliateClick(offer: OfferRedirectTarget) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const realIp = headerStore.get("x-real-ip");

  await supabase.from("click_events").insert({
    offer_id: offer.id,
    store_id: offer.store_id,
    referrer: headerStore.get("referer"),
    user_agent: headerStore.get("user-agent"),
    ip_hash: hashIp(forwardedFor ?? realIp),
  });
}
