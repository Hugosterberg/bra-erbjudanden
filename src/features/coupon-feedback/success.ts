export const MIN_COUPON_FEEDBACK_VOTES = 5;

export type CouponSuccessInput = {
  positive: number;
  total: number;
};

export type CouponSuccessResult = {
  rate: number | null;
  label: string | null;
  hasEnoughData: boolean;
};

export function calculateCouponSuccess(input: CouponSuccessInput): CouponSuccessResult {
  const total = Math.max(0, input.total);
  const positive = Math.max(0, Math.min(input.positive, total));

  if (total < MIN_COUPON_FEEDBACK_VOTES) {
    return {
      rate: null,
      label: null,
      hasEnoughData: false,
    };
  }

  const rate = Math.round((positive / total) * 100);

  return {
    rate,
    label: `${rate} % säger att koden fungerar`,
    hasEnoughData: true,
  };
}
