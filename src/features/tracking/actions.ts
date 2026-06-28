"use server";

import { recordCouponCopyClick } from "./record-click";

export async function recordCouponCopyAction(offerId: string) {
  if (!offerId) {
    return;
  }

  await recordCouponCopyClick(offerId);
}
