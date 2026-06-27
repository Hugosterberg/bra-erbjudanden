import type { DiscountType, OfferWithRelations, RedemptionType } from "./types";

export function formatDiscount(type: DiscountType, value: number) {
  if (type === "percentage") {
    return `${Math.round(value)}%`;
  }

  return `${Math.round(value)} kr`;
}

// Ranks offers by discount magnitude. Percentage discounts are prioritised
// over fixed amounts since they are comparable across price points; within the
// same type the higher value wins.
export function compareByDiscount(a: OfferWithRelations, b: OfferWithRelations) {
  const aIsPercentage = a.discount_type === "percentage";
  const bIsPercentage = b.discount_type === "percentage";

  if (aIsPercentage !== bIsPercentage) {
    return aIsPercentage ? -1 : 1;
  }

  return b.discount_value - a.discount_value;
}

export function formatOfferValidity(date: string | null) {
  if (!date) {
    return "Tills vidare";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRedemptionType(type: RedemptionType) {
  if (type === "discount_code") {
    return "Rabattkod";
  }

  return "Direktlänk";
}

export function formatOfferDestination(offer: OfferWithRelations) {
  const destinationUrl = offer.store?.website_url ?? offer.affiliate_url;

  try {
    const url = new URL(
      destinationUrl.startsWith("http") ? destinationUrl : `https://${destinationUrl}`,
    );

    return url.hostname.replace(/^www\./, "");
  } catch {
    return offer.store?.name ?? "erbjudande";
  }
}

export function formatOfferCtaLabel(offer: OfferWithRelations) {
  return `Gå till ${formatOfferDestination(offer)}`;
}
