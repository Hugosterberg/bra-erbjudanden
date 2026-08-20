export type CommercialLabel = "ad" | "sponsored" | "partnership" | "exclusive";

export const COMMERCIAL_LABELS: Record<CommercialLabel, string> = {
  ad: "Annons",
  sponsored: "Sponsrat",
  partnership: "I samarbete",
  exclusive: "Exklusivt erbjudande",
};

export type CommercialLabelSource = {
  is_sponsored?: boolean | null;
  is_exclusive?: boolean | null;
};

/**
 * Commercial labels must only reflect an actual commercial agreement.
 * Editorial curation (is_featured) is deliberately excluded: calling an
 * editor's pick a partnership would both mislead readers and make the
 * disclosure meaningless where money really is involved.
 */
export function resolveOfferCommercialLabel(
  offer: CommercialLabelSource,
): CommercialLabel | null {
  if (offer.is_sponsored) {
    return "sponsored";
  }

  if (offer.is_exclusive) {
    return "exclusive";
  }

  return null;
}
