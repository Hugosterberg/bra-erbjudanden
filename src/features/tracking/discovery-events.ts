import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import { getSupabasePublicClient } from "@/shared/lib/supabase/public";
import type { Database } from "@/shared/types/database";

type DiscoveryEventType = Database["public"]["Enums"]["discovery_event_type"];

function hashIp(ip: string | null) {
  if (!ip) {
    return null;
  }

  const salt = process.env.CLICK_HASH_SALT ?? "local-development";
  return createHash("sha256").update(`${salt}:event:${ip}`).digest("hex");
}

export async function recordDiscoveryEvent(input: {
  eventType: DiscoveryEventType;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  // Analytics must never take a page or a form submission down with it.
  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const realIp = headerStore.get("x-real-ip");

    await supabase.from("discovery_events").insert({
      event_type: input.eventType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
      ip_hash: hashIp(forwardedFor ?? realIp),
    });
  } catch (error) {
    console.error("[tracking] Failed to record discovery event", error);
  }
}

export function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

// Click counts are aggregated in Postgres. Selecting the raw rows would be
// capped by the PostgREST row limit and silently under-report popularity.
export async function countOfferClicksSince(since: Date) {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    return new Map<string, number>();
  }

  const { data } = await supabase.rpc("count_offer_clicks_since", {
    since: since.toISOString(),
  });

  return new Map((data ?? []).map((row) => [row.offer_id, Number(row.click_count)]));
}

export async function countStoreClicksSince(since: Date) {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    return new Map<string, number>();
  }

  const { data } = await supabase.rpc("count_store_clicks_since", {
    since: since.toISOString(),
  });

  return new Map((data ?? []).map((row) => [row.store_id, Number(row.click_count)]));
}
