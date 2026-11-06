import { currentMarket } from "@/shared/config/market";

import { getTradedoublerConfig } from "../config";
import { ensureDescription, ensureTitle, parseDiscountFromText } from "../parse-discount";
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

const BASE_URL = "https://api.tradedoubler.com/1.0/vouchers.json";
const PAGE_SIZE = 500;
const MAX_PAGES = 20;

// voucherTypeId per the Vouchers API: 1 voucher, 2 discount, 4 free shipping.
const VOUCHER_TYPE_CODE = 1;
const VOUCHER_TYPE_DISCOUNT = 2;
const VOUCHER_TYPE_FREE_SHIPPING = 4;

function readDate(record: Record<string, unknown>, key: string) {
  const milliseconds = typeof record[key] === "number" ? (record[key] as number) : null;
  return milliseconds ? new Date(milliseconds).toISOString() : toIsoDate(record[key]);
}

function resolveDiscount(record: Record<string, unknown>, title: string, description: string) {
  const voucherType = pickNumber(record, ["voucherTypeId"]);
  const amount = pickNumber(record, ["discountAmount"]);

  if (voucherType === VOUCHER_TYPE_DISCOUNT && amount !== null && amount > 0) {
    return {
      discountType: record.isPercentage === true ? ("percentage" as const) : ("fixed_amount" as const),
      discountValue: amount,
      isUpTo: false,
      dealLabel: null,
    };
  }

  const parsed = parseDiscountFromText(title, description);
  return voucherType === VOUCHER_TYPE_FREE_SHIPPING && parsed.discountType === null
    ? { ...parsed, dealLabel: "Fri frakt" }
    : parsed;
}

export function mapTradedoublerVoucher(record: Record<string, unknown>): ImportedOfferDraft | null {
  const externalId = pickId(record, ["id"]);
  const programId = pickId(record, ["programId"]);
  const programName = pickString(record, ["programName"]) || `Program ${programId}`;
  // landingUrl is the merchant's own page; defaultTrackUri is what pays.
  const affiliateUrl = pickString(record, ["defaultTrackUri"]);
  const voucherType = pickNumber(record, ["voucherTypeId"]);
  const code = voucherType === VOUCHER_TYPE_CODE ? pickString(record, ["code"]) || null : null;
  const title = ensureTitle(
    pickString(record, ["title", "shortDescription"]),
    code ? `${programName} rabattkod` : `${programName} erbjudande`,
  );
  const description = ensureDescription(
    pickString(record, ["description", "shortDescription"]) || title,
    title,
  );
  const endsAt = readDate(record, "endDate");

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
      websiteUrl: null,
      logoUrl: pickString(record, ["logoPath"]) || null,
      // A voucher with a landing page would send "Besök butik" to that page.
      affiliateUrl: pickString(record, ["landingUrl"]) ? null : affiliateUrl,
    },
    redemptionType: code ? "discount_code" : "direct_link",
    ...resolveDiscount(record, title, description),
    discountCode: code,
    affiliateUrl,
    terms: pickString(record, ["publisherInformation"]) || null,
    imageUrl: null,
    startsAt: readDate(record, "startDate"),
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

    const allOffers: ImportedOfferDraft[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      // Filters are matrix parameters on this API; only the token is a query key.
      const filters = `;dateOutputFormat=iso8601;languageId=${currentMarket.languageCode};pageSize=${PAGE_SIZE};page=${page}`;
      const response = await fetchJson<unknown>(
        `${BASE_URL}${filters}?token=${encodeURIComponent(config.token)}`,
      );

      const items = readArray(response);
      for (const item of items) {
        const record = readRecord(item);
        const offer = record ? mapTradedoublerVoucher(record) : null;
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
