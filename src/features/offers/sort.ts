import { calculateDealScore } from "@/features/deal-score/score";
import { compareByDiscount } from "./format";
import type { OfferWithRelations } from "./types";

export type OfferSort = "featured" | "newest" | "discount" | "popular" | "score";

export function parseOfferSort(value?: string): OfferSort {
  if (value === "newest" || value === "discount" || value === "popular" || value === "score") {
    return value;
  }

  return "featured";
}

export function sortOffers(
  offers: OfferWithRelations[],
  sort: OfferSort,
  clickCounts: Map<string, number> = new Map(),
) {
  const copy = [...offers];

  switch (sort) {
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    case "discount":
      return copy.sort(compareByDiscount);
    case "popular":
      return copy.sort(
        (a, b) => (clickCounts.get(b.id) ?? 0) - (clickCounts.get(a.id) ?? 0),
      );
    case "score":
      return copy.sort((a, b) => {
        const scoreA = calculateDealScore({
          discountType: a.discount_type,
          discountValue: a.discount_value,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
          lastVerifiedAt: a.last_verified_at,
          endsAt: a.ends_at,
          isFeatured: a.is_featured,
          isSponsored: a.is_sponsored,
          clickCount: clickCounts.get(a.id) ?? 0,
        }).score;
        const scoreB = calculateDealScore({
          discountType: b.discount_type,
          discountValue: b.discount_value,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
          lastVerifiedAt: b.last_verified_at,
          endsAt: b.ends_at,
          isFeatured: b.is_featured,
          isSponsored: b.is_sponsored,
          clickCount: clickCounts.get(b.id) ?? 0,
        }).score;
        return scoreB - scoreA;
      });
    default:
      return copy;
  }
}

export function withClickCounts(
  offers: OfferWithRelations[],
  clickCounts: Map<string, number>,
) {
  return offers.map((offer) => ({
    ...offer,
    click_count: clickCounts.get(offer.id) ?? offer.click_count ?? 0,
  }));
}
