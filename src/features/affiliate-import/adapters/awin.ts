import { currentMarket } from "@/shared/config/market";

import { getAwinConfig } from "../config";
import { ensureDescription, ensureTitle, parseDiscountFromText } from "../parse-discount";
import type { AffiliateAdapter, ImportedOfferDraft } from "../types";
import {
  dedupeByExternalId,
  fetchJson,
  isExpired,
  pickId,
  pickString,
  readArray,
  readRecord,
  toIsoDate,
} from "./utils";

const BASE_URL = "https://api.awin.com";
// The Offers API rejects page sizes outside 10-200.
const PAGE_SIZE = 200;
const MAX_PAGES = 50;

type AwinPromotionResponse = {
  data?: unknown[];
};

export function mapAwinPromotion(
  record: Record<string, unknown>,
  publisherId: string,
): ImportedOfferDraft | null {
  const externalId = pickId(record, ["promotionId"]);
  const advertiser = readRecord(record.advertiser) ?? {};
  const advertiserId = pickId(advertiser, ["id"]);
  const advertiserName = pickString(advertiser, ["name"]) || `Butik ${advertiserId}`;
  // `url` is the merchant's own page and earns nothing. Only urlTracking pays.
  const affiliateUrl = pickString(record, ["urlTracking"]);
  const voucher = readRecord(record.voucher);
  const voucherCode = voucher ? pickString(voucher, ["code"]) || null : null;
  const title = ensureTitle(pickString(record, ["title"]), `${advertiserName} erbjudande`);
  const terms = pickString(record, ["terms"]) || null;
  const description = ensureDescription(pickString(record, ["description"]) || title, title);
  const discount = parseDiscountFromText(title, description);
  const endsAt = toIsoDate(record.endDate);

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
      websiteUrl: null,
      logoUrl: pickString(advertiser, ["logoUrl"]) || null,
      affiliateUrl: `https://www.awin1.com/cread.php?awinmid=${encodeURIComponent(advertiserId)}&awinaffid=${encodeURIComponent(publisherId)}`,
    },
    redemptionType: voucherCode ? "discount_code" : "direct_link",
    ...discount,
    discountCode: voucherCode,
    affiliateUrl,
    terms,
    imageUrl: null,
    startsAt: toIsoDate(record.startDate),
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

    const allOffers: ImportedOfferDraft[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
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
              // Offers from programmes we have not joined cannot earn commission.
              membership: "joined",
              regionCodes: [config.regionCode || currentMarket.code],
              status: "active",
              type: "all",
            },
            pagination: { page, pageSize: PAGE_SIZE },
          }),
        },
      );

      const items = readArray(response.data);
      for (const item of items) {
        const record = readRecord(item);
        const offer = record ? mapAwinPromotion(record, config.publisherId) : null;
        if (offer) {
          allOffers.push(offer);
        }
      }

      if (items.length < PAGE_SIZE) {
        break;
      }
    }

    return dedupeByExternalId(allOffers);
  },
};
