import type { Database } from "@/shared/types/database";

type DiscountType = Database["public"]["Enums"]["discount_type"];

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
