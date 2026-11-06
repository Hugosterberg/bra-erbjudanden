import { currentMarket } from "@/shared/config/market";

import { getAdtractionConfig } from "../config";
import { ensureDescription, parseDiscountFromText, titleFromText } from "../parse-discount";
import type { AffiliateAdapter, ImportedOfferDraft } from "../types";
import {
  dedupeByExternalId,
  fetchJson,
  isExpired,
  pickId,
  pickNumber,
  pickString,
  readArray,
  readRecord,
  toIsoDate,
} from "./utils";

// Offers are served by v2 and programmes by v3, per apidocs.adtraction.net.
const OFFERS_URL = "https://api.adtraction.net/v2/partner/offers/";
const PROGRAMS_URL = "https://api.adtraction.net/v3/partner/programs/";
const OFFER_TYPE_COUPON = 1;
const APPROVAL_STATUS_APPROVED = 1;

type ApprovedProgram = {
  name: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  trackingUrl: string | null;
};

export type AdtractionPrograms = Map<string, ApprovedProgram>;

export function mapAdtractionOffer(
  record: Record<string, unknown>,
  programs: AdtractionPrograms,
): ImportedOfferDraft | null {
  const externalId = pickId(record, ["offerId"]);
  const programId = pickId(record, ["programId"]);
  const program = programs.get(programId);

  // Without an approved programme the link would not earn commission.
  if (!externalId || !program) {
    return null;
  }

  const affiliateUrl = pickString(record, ["trackingURL"]) || program.trackingUrl || "";
  const market = pickString(record, ["market"]).toUpperCase();
  const endsAt = toIsoDate(record.validTo);

  if (!affiliateUrl || (market && market !== currentMarket.code) || isExpired(endsAt)) {
    return null;
  }

  const programName = pickString(record, ["programName"]) || program.name;
  const text = pickString(record, ["offerDescription"]);
  const terms = pickString(record, ["offerTerms"]) || null;
  const title = titleFromText(text, `${programName} erbjudande`);
  const code =
    pickNumber(record, ["offerType"]) === OFFER_TYPE_COUPON
      ? pickString(record, ["offerCoupon"]) || null
      : null;

  return {
    externalId,
    network: "adtraction",
    title,
    description: ensureDescription(text, title),
    store: {
      externalId: programId,
      name: programName,
      websiteUrl: pickString(record, ["programUrl"]) || program.websiteUrl,
      logoUrl: pickString(record, ["logoURL"]) || program.logoUrl,
      affiliateUrl: program.trackingUrl,
    },
    redemptionType: code ? "discount_code" : "direct_link",
    ...parseDiscountFromText(text),
    discountCode: code,
    affiliateUrl,
    terms,
    imageUrl: null,
    startsAt: toIsoDate(record.validFrom),
    endsAt,
  };
}

async function fetchApprovedPrograms(apiToken: string, channelId: number) {
  const response = await fetchJson<unknown>(PROGRAMS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Token": apiToken },
    body: JSON.stringify({
      market: currentMarket.code,
      channelId,
      approvalStatus: APPROVAL_STATUS_APPROVED,
    }),
  });

  const programs: AdtractionPrograms = new Map();

  for (const item of readArray(response)) {
    const record = readRecord(item);
    const id = record ? pickId(record, ["programId"]) : "";
    if (record && id) {
      programs.set(id, {
        name: pickString(record, ["programName"]) || `Program ${id}`,
        websiteUrl: pickString(record, ["programURL"]) || null,
        logoUrl: pickString(record, ["logoURL"]) || null,
        trackingUrl: pickString(record, ["trackingURL"]) || null,
      });
    }
  }

  return programs;
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

    const programs = await fetchApprovedPrograms(config.apiToken, config.channelId);
    const response = await fetchJson<unknown>(OFFERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Token": config.apiToken },
      body: JSON.stringify({ market: currentMarket.code, channelId: config.channelId }),
    });

    const offers = readArray(response)
      .map((item) => {
        const record = readRecord(item);
        return record ? mapAdtractionOffer(record, programs) : null;
      })
      .filter((offer): offer is ImportedOfferDraft => offer !== null);

    return dedupeByExternalId(offers);
  },
};
