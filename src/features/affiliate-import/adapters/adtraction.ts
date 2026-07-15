import { getAdtractionConfig } from "../config";
import { ensureDescription, ensureTitle, parseDiscountFromText } from "../parse-discount";
import type { AffiliateAdapter, ImportedOfferDraft } from "../types";
import {
  dedupeByExternalId,
  fetchJson,
  isExpired,
  pickNumber,
  pickString,
  readArray,
  readRecord,
  toIsoDate,
} from "./utils";

const BASE_URL = "https://api.adtraction.net/v3";

function mapOffer(record: Record<string, unknown>): ImportedOfferDraft | null {
  const externalId =
    pickString(record, ["offerId", "id"]) ||
    String(pickNumber(record, ["offerId", "id"]) ?? "");

  const affiliateUrl = pickString(record, ["trackingURL", "trackingUrl", "offerPage"]);
  const programId = String(pickNumber(record, ["programId"]) ?? "");
  const programName = pickString(record, ["programName"]) || `Program ${programId}`;

  if (!externalId || !affiliateUrl || !programId) {
    return null;
  }

  const market = pickString(record, ["market"]).toUpperCase();
  if (market && market !== "SE") {
    return null;
  }

  const title = ensureTitle(
    pickString(record, ["offerDescription", "title", "name"]),
    `${programName} erbjudande`,
  );
  const description = ensureDescription(title, title);
  const discountCode = pickString(record, ["offerCoupon", "couponCode"]) || null;
  const offerType = pickString(record, ["offerType"]);
  const discount = parseDiscountFromText(title, pickString(record, ["offerTerms"]));
  const endsAt = toIsoDate(pickString(record, ["validTo", "validUntil"]));

  if (isExpired(endsAt)) {
    return null;
  }

  const redemptionType =
    discountCode || offerType === "1"
      ? "discount_code"
      : "direct_link";

  return {
    externalId,
    network: "adtraction",
    title,
    description,
    store: {
      externalId: programId,
      name: programName,
      websiteUrl: pickString(record, ["programUrl"]) || null,
      logoUrl: pickString(record, ["logoURL", "logoUrl"]) || null,
    },
    redemptionType,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountCode,
    affiliateUrl,
    terms: pickString(record, ["offerTerms"]) || null,
    imageUrl: pickString(record, ["logoURL", "logoUrl"]) || null,
    startsAt: toIsoDate(pickString(record, ["validFrom"])),
    endsAt,
  };
}

export const adtractionAdapter: AffiliateAdapter = {
  network: "adtraction",
  isConfigured() {
    return Boolean(getAdtractionConfig());
  },
  async fetchOffers() {
    const config = getAdtractionConfig();
    if (!config) {
      return [];
    }

    const response = await fetchJson<unknown>(`${BASE_URL}/partner/offers/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": config.apiToken,
      },
      body: JSON.stringify({
        market: "SE",
        channelId: config.channelId,
      }),
    });

    const offers = readArray(response)
      .map((item) => {
        const record = readRecord(item);
        return record ? mapOffer(record) : null;
      })
      .filter((offer): offer is ImportedOfferDraft => offer !== null);

    return dedupeByExternalId(offers);
  },
};
