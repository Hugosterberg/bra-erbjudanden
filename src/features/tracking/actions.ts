"use server";

import { headers } from "next/headers";

import { consumeRateLimit, rateLimitKeyFromHeaders } from "@/shared/lib/rate-limit";

import { recordCouponCopyClick } from "./record-click";
import { recordDiscoveryEvent } from "./discovery-events";

const EVENTS_PER_HOUR = 120;

/** These run without login, so one visitor must not be able to fill the tables. */
async function isWithinEventLimit(scope: string) {
  const requestHeaders = await headers();
  return consumeRateLimit(rateLimitKeyFromHeaders(scope, requestHeaders), EVENTS_PER_HOUR, 60 * 60);
}

export async function recordCouponCopyAction(offerId: string) {
  if (!offerId || !(await isWithinEventLimit("coupon-copy"))) {
    return;
  }

  await recordCouponCopyClick(offerId, await headers());
  await recordDiscoveryEvent({
    eventType: "coupon_copy",
    entityType: "offer",
    entityId: offerId,
  });
}

export async function recordSearchAction(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2 || !(await isWithinEventLimit("search"))) {
    return;
  }

  await recordDiscoveryEvent({
    eventType: "search",
    entityType: "search",
    metadata: { q: trimmed.slice(0, 80) },
  });
}
