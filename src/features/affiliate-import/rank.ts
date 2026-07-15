import type { Database } from "@/shared/types/database";

type DiscountType = Database["public"]["Enums"]["discount_type"];

// Lower rank_position = higher on the site. Percentage deals rank above fixed amounts.
export function discountToRankPosition(
  discountType: DiscountType,
  discountValue: number,
): number {
  if (discountType === "percentage") {
    return Math.max(1, Math.round(101 - Math.min(discountValue, 100)));
  }

  return Math.max(1001, Math.round(2000 - Math.min(discountValue, 999)));
}

export function compareImportedOffers<
  T extends { discount_type: DiscountType; discount_value: number },
>(a: T, b: T) {
  const aIsPercentage = a.discount_type === "percentage";
  const bIsPercentage = b.discount_type === "percentage";

  if (aIsPercentage !== bIsPercentage) {
    return aIsPercentage ? -1 : 1;
  }

  return b.discount_value - a.discount_value;
}
