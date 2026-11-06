import { detectNetworkFromUrl } from "../tracking/click-reference.ts";
import type { Offer, OfferWithRelations, RedemptionType } from "./types";

type OfferDeal = Pick<Offer, "discount_type" | "discount_value" | "is_up_to" | "deal_label">;

/** "20%", "150 kr", "Fri frakt" or "Kampanj": never a figure the feed lacks. */
export function formatDealValue(offer: OfferDeal) {
  if (offer.discount_type === null || offer.discount_value === null) {
    return offer.deal_label ?? "Kampanj";
  }

  const value = Math.round(offer.discount_value);
  return offer.discount_type === "percentage" ? `${value}%` : `${value} kr`;
}

/** Headline shown beside the call to action. */
export function formatDealHeadline(offer: OfferDeal) {
  if (offer.discount_type === null || offer.discount_value === null) {
    return offer.deal_label ?? "Aktuell kampanj";
  }

  return `Spara ${offer.is_up_to ? "upp till " : ""}${formatDealValue(offer)}`;
}

export function hasNumericDiscount(offer: OfferDeal) {
  return offer.discount_type !== null && offer.discount_value !== null;
}

/** Whether following the offer can earn us money and must be marked as such. */
export function isCommercialLink(
  offer: Pick<Offer, "affiliate_network" | "affiliate_url" | "is_sponsored">,
) {
  return (
    offer.is_sponsored ||
    offer.affiliate_network !== null ||
    detectNetworkFromUrl(offer.affiliate_url) !== null
  );
}

// Ranks offers by discount magnitude. Percentage discounts are prioritised
// over fixed amounts since they are comparable across price points; within the
// same type the higher value wins.
export function compareByDiscount(
  a: Pick<Offer, "discount_type" | "discount_value">,
  b: Pick<Offer, "discount_type" | "discount_value">,
) {
  const weight = (type: Offer["discount_type"]) =>
    type === "percentage" ? 0 : type === "fixed_amount" ? 1 : 2;

  return (
    weight(a.discount_type) - weight(b.discount_type) ||
    (b.discount_value ?? 0) - (a.discount_value ?? 0)
  );
}

export function formatPrice(value: number) {
  return `${new Intl.NumberFormat("sv-SE").format(Math.round(value))} kr`;
}

/**
 * Only a genuine markdown is worth showing: a "before" price that is not
 * higher than the current one is either bad data or a misleading claim.
 */
export function resolveOfferPricing(offer: {
  original_price: number | null;
  current_price: number | null;
}) {
  const current = offer.current_price;

  if (current === null) {
    return null;
  }

  const original =
    offer.original_price !== null && offer.original_price > current
      ? offer.original_price
      : null;

  return {
    current,
    original,
    savings: original === null ? null : original - current,
  };
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
