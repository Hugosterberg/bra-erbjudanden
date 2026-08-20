import type { OfferWithRelations } from "@/features/offers/types";

import { calculateDealScore, type DealScoreResult } from "./score";

export function scoreOffer(
  offer: OfferWithRelations,
  clickCount = 0,
  now?: Date,
): DealScoreResult {
  return calculateDealScore({
    discountType: offer.discount_type,
    discountValue: offer.discount_value,
    createdAt: offer.created_at,
    updatedAt: offer.updated_at,
    lastVerifiedAt: offer.last_verified_at,
    endsAt: offer.ends_at,
    isFeatured: offer.is_featured,
    isSponsored: offer.is_sponsored,
    clickCount,
    now,
  });
}
