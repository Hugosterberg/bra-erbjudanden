import { getTradedoublerConfig } from "../config";
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

const BASE_URL = "https://api.tradedoubler.com/1.0/vouchers.json";

type TradedoublerResponse = {
  vouchers?: unknown[];
};

function mapVoucher(record: Record<string, unknown>): ImportedOfferDraft | null {
  const externalId = String(pickNumber(record, ["id"]) ?? pickString(record, ["id"]));
  const programId = String(
    pickNumber(record, ["programId"]) ??
      pickNumber(readRecord(record.program) ?? {}, ["id"]) ??
      "",
  );
  const programName =
    pickString(readRecord(record.program) ?? {}, ["name"]) ||
    pickString(record, ["programName"]) ||
    `Program ${programId}`;
  const affiliateUrl =
    pickString(record, ["landingUrl", "defaultTracker", "trackingUrl"]) || "";
  const code = pickString(record, ["code"]) || null;
  const title = ensureTitle(
    pickString(record, ["title", "shortDescription"]),
    code ? `${programName} rabattkod` : `${programName} erbjudande`,
  );
  const description = ensureDescription(
    pickString(record, ["description", "shortDescription"]) || title,
    title,
  );
  const discount = parseDiscountFromText(title, description);
  const endDateMs = pickNumber(record, ["endDate"]);
  const endsAt =
    toIsoDate(pickString(record, ["endDate", "endDateTime"])) ??
    (endDateMs ? new Date(endDateMs).toISOString() : null);
  const startDateMs = pickNumber(record, ["startDate"]);
  const startsAt =
    toIsoDate(pickString(record, ["startDate", "startDateTime"])) ??
    (startDateMs ? new Date(startDateMs).toISOString() : null);

  if (!externalId || !affiliateUrl || !programId || isExpired(endsAt)) {
    return null;
  }

  return {
    externalId,
    network: "tradedoubler",
    title,
    description,
    store: {
      externalId: programId,
      name: programName,
      websiteUrl: affiliateUrl,
      logoUrl: null,
    },
    redemptionType: code ? "discount_code" : "direct_link",
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountCode: code,
    affiliateUrl,
    terms: pickString(record, ["publisherInformation"]) || null,
    imageUrl: null,
    startsAt,
    endsAt,
  };
}

export const tradedoublerAdapter: AffiliateAdapter = {
  network: "tradedoubler",
  isConfigured() {
    return Boolean(getTradedoublerConfig());
  },
  async fetchOffers() {
    const config = getTradedoublerConfig();
    if (!config) {
      return [];
    }

    const response = await fetchJson<TradedoublerResponse>(
      `${BASE_URL}?token=${encodeURIComponent(config.token)}&dateOutputFormat=iso8601`,
    );

    const offers = readArray(response.vouchers ?? response)
      .map((item) => {
        const record = readRecord(item);
        return record ? mapVoucher(record) : null;
      })
      .filter((offer): offer is ImportedOfferDraft => offer !== null);

    return dedupeByExternalId(offers);
  },
};
