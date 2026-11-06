import { createHash, randomUUID } from "node:crypto";

import { after } from "next/server";

import type { OfferRedirectTarget } from "@/features/offers/types";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import type { Database } from "@/shared/types/database";

import {
  appendClickReference,
  detectNetworkFromUrl,
  toClickReference,
  type TrackableNetwork,
} from "./click-reference";
import { recordDiscoveryEvent } from "./discovery-events";
import { isLikelyBot } from "./request-classification";

type ClickType = Database["public"]["Enums"]["click_type"];

function hashIp(ip: string | null) {
  if (!ip) {
    return null;
  }

  const salt = process.env.CLICK_HASH_SALT ?? "local-development";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function readClient(headers: Pick<Headers, "get">) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  return {
    ipHash: hashIp(forwardedFor ?? headers.get("x-real-ip")),
    referrer: headers.get("referer"),
    userAgent: headers.get("user-agent"),
  };
}

async function insertClick(input: {
  offerId: string | null;
  storeId: string | null;
  clickType: ClickType;
  clickId?: string | null;
  network?: TrackableNetwork | null;
  client: ReturnType<typeof readClient>;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("click_events").insert({
    offer_id: input.offerId,
    store_id: input.storeId,
    click_type: input.clickType,
    click_id: input.clickId ?? null,
    network: input.network ?? null,
    referrer: input.client.referrer,
    user_agent: input.client.userAgent,
    ip_hash: input.client.ipHash,
  });

  if (error) {
    console.error("[tracking] Failed to record click", error.message);
  }
}

/**
 * Builds the outbound URL and schedules the click to be stored after the
 * redirect has been sent, so that visitors never wait on the database. Bots
 * still follow the link but are left out of the statistics.
 */
export function trackOutboundClick(input: {
  url: string;
  knownNetwork: TrackableNetwork | null;
  offerId: string | null;
  storeId: string | null;
  entityType: "offer" | "store";
  headers: Pick<Headers, "get">;
}) {
  const network = input.knownNetwork ?? detectNetworkFromUrl(input.url);
  const clickId = randomUUID();
  const destination = appendClickReference(input.url, network, toClickReference(clickId), {
    addrevenueParam: process.env.ADDREVENUE_CLICK_REF_PARAM,
  });
  const client = readClient(input.headers);

  if (!isLikelyBot(client.userAgent)) {
    after(async () => {
      await insertClick({
        offerId: input.offerId,
        storeId: input.storeId,
        clickType: "website",
        clickId,
        network,
        client,
      });
      await recordDiscoveryEvent(
        {
          eventType: "affiliate_click",
          entityType: input.entityType,
          entityId: input.offerId ?? input.storeId ?? undefined,
        },
        input.headers,
      );
    });
  }

  return destination;
}

export function offerOutboundInput(offer: OfferRedirectTarget) {
  return {
    url: offer.affiliate_url,
    knownNetwork: offer.affiliate_network,
    offerId: offer.id,
    storeId: offer.store_id,
    entityType: "offer" as const,
  };
}

export async function recordCouponCopyClick(offerId: string, headers: Pick<Headers, "get">) {
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

  await insertClick({
    offerId: offer.id,
    storeId: offer.store_id,
    clickType: "discount_code",
    client: readClient(headers),
  });
}
