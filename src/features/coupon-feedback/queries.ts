import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import type { Database } from "@/shared/types/database";

import { calculateCouponSuccess } from "./success";

type ClickType = Database["public"]["Enums"]["discovery_event_type"];

function hashIp(ip: string | null) {
  if (!ip) {
    return "anonymous";
  }

  const salt = process.env.CLICK_HASH_SALT ?? "local-development";
  return createHash("sha256").update(`${salt}:coupon:${ip}`).digest("hex");
}

async function clientIpHash() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const realIp = headerStore.get("x-real-ip");
  return hashIp(forwardedFor ?? realIp);
}

export async function getCouponFeedbackSummary(offerId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { positive: 0, total: 0, ...calculateCouponSuccess({ positive: 0, total: 0 }) };
  }

  const { data } = await supabase
    .from("coupon_feedback")
    .select("worked")
    .eq("offer_id", offerId);

  const total = data?.length ?? 0;
  const positive = data?.filter((row) => row.worked).length ?? 0;

  return { positive, total, ...calculateCouponSuccess({ positive, total }) };
}

export async function submitCouponFeedback(offerId: string, worked: boolean) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { ok: false as const, message: "Kunde inte spara just nu." };
  }

  const { data: offer } = await supabase
    .from("offers")
    .select("id, discount_code, status")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer?.discount_code || offer.status !== "published") {
    return { ok: false as const, message: "Erbjudandet kan inte betygsättas." };
  }

  const ipHash = await clientIpHash();
  // One vote per visitor and offer; voting again replaces the previous answer.
  const { error } = await supabase.from("coupon_feedback").upsert(
    {
      offer_id: offerId,
      worked,
      ip_hash: ipHash,
    },
    { onConflict: "offer_id,ip_hash" },
  );

  if (error) {
    return { ok: false as const, message: "Kunde inte spara ditt svar. Försök igen." };
  }

  const eventType: ClickType = worked ? "coupon_worked" : "coupon_failed";
  await supabase.from("discovery_events").insert({
    event_type: eventType,
    entity_type: "offer",
    entity_id: offerId,
    ip_hash: ipHash,
  });

  const summary = await getCouponFeedbackSummary(offerId);

  return {
    ok: true as const,
    message: "Tack för din feedback.",
    successLabel: summary.label,
  };
}
