"use server";

import { headers } from "next/headers";

import { consumeRateLimit, rateLimitKeyFromHeaders } from "@/shared/lib/rate-limit";

import { submitCouponFeedback } from "./queries";

export type CouponFeedbackResult = {
  ok: boolean;
  message: string;
  successLabel?: string | null;
};

export async function submitCouponFeedbackAction(
  offerId: string,
  worked: boolean,
): Promise<CouponFeedbackResult> {
  if (!offerId) {
    return { ok: false, message: "Ogiltigt erbjudande." };
  }

  const key = rateLimitKeyFromHeaders("coupon-feedback", await headers());
  if (!(await consumeRateLimit(key, 30, 60 * 60))) {
    return { ok: false, message: "För många svar. Försök igen senare." };
  }

  return submitCouponFeedback(offerId, worked);
}
