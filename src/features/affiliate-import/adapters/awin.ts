import { getAwinConfig } from "../config";
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

const BASE_URL = "https://api.awin.com";

type AwinPromotionResponse = {
  data?: unknown[];
  promotions?: unknown[];
};

function mapPromotion(record: Record<string, unknown>): ImportedOfferDraft | null {
  const externalId = String(
    pickNumber(record, ["promotionId", "id"]) ?? pickString(record, ["promotionId", "id"]),
  );
  const advertiser = readRecord(record.advertiser);
  const advertiserId = String(
    pickNumber(advertiser ?? {}, ["id", "advertiserId"]) ??
      pickNumber(record, ["advertiserId"]) ??
      "",
  );
  const advertiserName =
    pickString(advertiser ?? {}, ["name"]) ||
    pickString(record, ["advertiserName"]) ||
    `Butik ${advertiserId}`;
  const affiliateUrl =
    pickString(record, ["url", "trackingUrl", "deeplink"]) ||
    pickString(record, ["link"]) ||
    "";
  const voucherCode = pickString(record, ["voucher", "voucherCode", "code"]) || null;
  const title = ensureTitle(
    pickString(record, ["title", "headline", "description"]),
    `${advertiserName} erbjudande`,
  );
  const description = ensureDescription(
    pickString(record, ["description", "terms"]) || title,
    title,
  );
  const discount = parseDiscountFromText(title, description, pickString(record, ["terms"]));
  const endsAt = toIsoDate(
    pickString(record, ["endDate", "expires", "endDateTime", "validTo"]),
  );

  if (!externalId || !affiliateUrl || !advertiserId || isExpired(endsAt)) {
    return null;
  }

  return {
    externalId,
    network: "awin",
    title,
    description,
    store: {
      externalId: advertiserId,
      name: advertiserName,
      websiteUrl: pickString(advertiser ?? {}, ["displayUrl", "url"]) || null,
      logoUrl: pickString(advertiser ?? {}, ["logoUrl"]) || null,
    },
    redemptionType: voucherCode ? "discount_code" : "direct_link",
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountCode: voucherCode,
    affiliateUrl,
    terms: pickString(record, ["terms"]) || null,
    imageUrl: pickString(record, ["logoUrl"]) || null,
    startsAt: toIsoDate(pickString(record, ["startDate", "startDateTime", "validFrom"])),
    endsAt,
  };
}

export const awinAdapter: AffiliateAdapter = {
  network: "awin",
  isConfigured() {
    return Boolean(getAwinConfig());
  },
  async fetchOffers() {
    const config = getAwinConfig();
    if (!config) {
      return [];
    }

    const pageSize = 500;
    const allOffers: ImportedOfferDraft[] = [];

    for (let page = 1; page <= 20; page += 1) {
      const response = await fetchJson<AwinPromotionResponse>(
        `${BASE_URL}/publisher/${config.publisherId}/promotions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filters: {
              regionCodes: [config.regionCode],
              status: "active",
              type: "all",
            },
            pagination: {
              page,
              pageSize,
            },
          }),
        },
      );

      const items = readArray(response.data ?? response.promotions ?? response);
      const offers = items
        .map((item) => {
          const record = readRecord(item);
          return record ? mapPromotion(record) : null;
        })
        .filter((offer): offer is ImportedOfferDraft => offer !== null);

      allOffers.push(...offers);

      if (items.length < pageSize) {
        break;
      }
    }

    return dedupeByExternalId(allOffers);
  },
};
