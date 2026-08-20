"use server";

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

  return submitCouponFeedback(offerId, worked);
}
