"use server";

import { recordCouponCopyClick } from "./record-click";
import { recordDiscoveryEvent } from "./discovery-events";

export async function recordCouponCopyAction(offerId: string) {
  if (!offerId) {
    return;
  }

  await recordCouponCopyClick(offerId);
  await recordDiscoveryEvent({
    eventType: "coupon_copy",
    entityType: "offer",
    entityId: offerId,
  });
}

export async function recordSearchAction(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return;
  }

  await recordDiscoveryEvent({
    eventType: "search",
    entityType: "search",
    metadata: { q: trimmed.slice(0, 80) },
  });
}
